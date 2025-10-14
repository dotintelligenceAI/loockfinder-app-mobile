-- 🆕 Criar perfil automaticamente quando usuário se cadastra
-- Este script cria um trigger que registra o usuário na tabela profiles
-- com plano FREE ao criar conta no app

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir novo perfil com plano free
  INSERT INTO public.profiles (
    id,
    name,
    avatar_url,
    created_at,
    updated_at,
    user_type,
    subscription_status,
    current_plan_id,
    subscription_expires_at,
    is_trial,
    trial_expires_at,
    user_id,
    bio,
    instagram
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    NULL,
    NOW(),
    NOW(),
    'standard',
    'free',
    'a08937af-188f-4c46-af71-5d9688e00b76', -- ID do plano "Finder Free"
    NULL,
    false,
    NULL,
    NULL,
    NULL,
    NULL
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar a função quando novo usuário for criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentário para documentação
COMMENT ON FUNCTION public.handle_new_user IS 'Cria automaticamente um perfil com plano FREE quando novo usuário se cadastra';

-- Verificar se a tabela profiles tem as colunas necessárias
-- Se não tiver, você pode criar/atualizar com este SQL:

/*
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS current_plan_id UUID REFERENCES subscription_plans(id),
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_current_plan_id ON profiles(current_plan_id);
CREATE INDEX IF NOT EXISTS idx_profiles_expires_at ON profiles(subscription_expires_at);
*/

-- ✅ O plano 'Finder Free' já existe na sua tabela subscription_plans
-- ID: a08937af-188f-4c46-af71-5d9688e00b76
-- Slug: free

-- Se precisar verificar:
-- SELECT * FROM subscription_plans WHERE slug = 'free';

