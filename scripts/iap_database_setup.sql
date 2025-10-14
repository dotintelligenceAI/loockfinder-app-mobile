-- 🛍️ Configuração da tabela para In-App Purchases (IAP)
-- Este script cria a estrutura necessária para gerenciar compras IAP

-- Tabela para registrar compras IAP
CREATE TABLE IF NOT EXISTS iap_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL,
  transaction_id VARCHAR(255) NOT NULL,
  purchase_token TEXT,
  original_transaction_id VARCHAR(255),
  plan_id VARCHAR(50) NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_restored BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_iap_purchases_user_id ON iap_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_iap_purchases_product_id ON iap_purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_iap_purchases_transaction_id ON iap_purchases(transaction_id);
CREATE INDEX IF NOT EXISTS idx_iap_purchases_status ON iap_purchases(status);

-- RLS (Row Level Security) para iap_purchases
ALTER TABLE iap_purchases ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver suas próprias compras
CREATE POLICY "Users can view own IAP purchases" ON iap_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários podem inserir suas próprias compras
CREATE POLICY "Users can insert own IAP purchases" ON iap_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem atualizar suas próprias compras
CREATE POLICY "Users can update own IAP purchases" ON iap_purchases
  FOR UPDATE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_iap_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_iap_purchases_updated_at
  BEFORE UPDATE ON iap_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_iap_purchases_updated_at();

-- Tabela para mapear produtos IAP para planos do sistema
CREATE TABLE IF NOT EXISTS iap_product_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  iap_product_id VARCHAR(255) NOT NULL UNIQUE,
  system_plan_id VARCHAR(50) NOT NULL,
  plan_type VARCHAR(20) NOT NULL, -- 'product' ou 'subscription'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir mapeamentos padrão
INSERT INTO iap_product_mappings (iap_product_id, system_plan_id, plan_type) VALUES
  ('com.lookfinder.premium.monthly', 'monthly', 'subscription'),
  ('com.lookfinder.premium.semest', 'semestral', 'subscription'),
  ('com.lookfinder.premium.annual', 'annual', 'subscription')
ON CONFLICT (iap_product_id) DO NOTHING;

-- Índices para iap_product_mappings
CREATE INDEX IF NOT EXISTS idx_iap_mappings_product_id ON iap_product_mappings(iap_product_id);
CREATE INDEX IF NOT EXISTS idx_iap_mappings_system_plan ON iap_product_mappings(system_plan_id);
CREATE INDEX IF NOT EXISTS idx_iap_mappings_active ON iap_product_mappings(is_active);

-- RLS para iap_product_mappings (todos podem ler)
ALTER TABLE iap_product_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view IAP product mappings" ON iap_product_mappings
  FOR SELECT USING (true);

-- Função para obter mapeamento de produto IAP
CREATE OR REPLACE FUNCTION get_iap_plan_mapping(iap_product_id_param VARCHAR(255))
RETURNS TABLE(
  system_plan_id VARCHAR(50),
  plan_type VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ipm.system_plan_id,
    ipm.plan_type
  FROM iap_product_mappings ipm
  WHERE ipm.iap_product_id = iap_product_id_param
    AND ipm.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar compra IAP
CREATE OR REPLACE FUNCTION record_iap_purchase(
  user_id_param UUID,
  product_id_param VARCHAR(255),
  transaction_id_param VARCHAR(255),
  purchase_token_param TEXT DEFAULT NULL,
  original_transaction_id_param VARCHAR(255) DEFAULT NULL,
  is_restored_param BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  purchase_id UUID;
  system_plan_id VARCHAR(50);
  plan_type VARCHAR(20);
BEGIN
  -- Obter mapeamento do produto
  SELECT 
    ipm.system_plan_id,
    ipm.plan_type
  INTO system_plan_id, plan_type
  FROM iap_product_mappings ipm
  WHERE ipm.iap_product_id = product_id_param
    AND ipm.is_active = true;

  IF system_plan_id IS NULL THEN
    RAISE EXCEPTION 'Produto IAP não encontrado: %', product_id_param;
  END IF;

  -- Inserir compra
  INSERT INTO iap_purchases (
    user_id,
    product_id,
    transaction_id,
    purchase_token,
    original_transaction_id,
    plan_id,
    purchase_date,
    is_restored,
    status
  ) VALUES (
    user_id_param,
    product_id_param,
    transaction_id_param,
    purchase_token_param,
    original_transaction_id_param,
    system_plan_id,
    NOW(),
    is_restored_param,
    'completed'
  )
  RETURNING id INTO purchase_id;

  -- Atualizar perfil do usuário
  UPDATE profiles SET
    subscription_status = 'active',
    current_plan_id = (
      SELECT id FROM subscription_plans 
      WHERE slug = system_plan_id 
      LIMIT 1
    ),
    subscription_expires_at = CASE 
      WHEN plan_type = 'product' THEN NULL
      WHEN system_plan_id = 'monthly' THEN NOW() + INTERVAL '1 month'
      WHEN system_plan_id = 'semestral' THEN NOW() + INTERVAL '6 months'
      WHEN system_plan_id = 'annual' THEN NOW() + INTERVAL '1 year'
      ELSE NOW() + INTERVAL '1 month'
    END,
    updated_at = NOW()
  WHERE id = user_id_param;

  RETURN purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário tem compra ativa
CREATE OR REPLACE FUNCTION has_active_iap_purchase(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_purchase BOOLEAN := false;
BEGIN
  -- Verificar se o usuário tem assinatura ativa verificando o perfil
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = user_id_param
      AND subscription_status = 'active'
      AND (
        subscription_expires_at IS NULL OR 
        subscription_expires_at > NOW()
      )
  ) INTO has_purchase;

  RETURN has_purchase;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE iap_purchases IS 'Registra todas as compras IAP dos usuários';
COMMENT ON TABLE iap_product_mappings IS 'Mapeia produtos IAP para planos do sistema';
COMMENT ON FUNCTION get_iap_plan_mapping IS 'Obtém mapeamento de produto IAP para plano do sistema';
COMMENT ON FUNCTION record_iap_purchase IS 'Registra uma compra IAP e atualiza o perfil do usuário';
COMMENT ON FUNCTION has_active_iap_purchase IS 'Verifica se usuário tem compra IAP ativa';
