-- Tabela para armazenar tokens de dispositivos para push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'ios' ou 'android'
  device_info JSONB DEFAULT '{}', -- informações extras do dispositivo
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON device_tokens(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_unique ON device_tokens(user_id, expo_push_token);

-- RLS (Row Level Security)
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar seus próprios tokens
CREATE POLICY "Users can view own device tokens" ON device_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own device tokens" ON device_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own device tokens" ON device_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own device tokens" ON device_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Política para service role (Edge Functions)
CREATE POLICY "Service role can manage all device tokens" ON device_tokens
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_device_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_device_tokens_updated_at ON device_tokens;
CREATE TRIGGER trigger_update_device_tokens_updated_at
  BEFORE UPDATE ON device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_device_tokens_updated_at();

-- Comentários para documentação
COMMENT ON TABLE device_tokens IS 'Armazena tokens de dispositivos para push notifications';
COMMENT ON COLUMN device_tokens.expo_push_token IS 'Token do Expo para enviar push notifications';
COMMENT ON COLUMN device_tokens.device_type IS 'Tipo do dispositivo: ios ou android';
COMMENT ON COLUMN device_tokens.device_info IS 'Informações extras do dispositivo em JSON';
COMMENT ON COLUMN device_tokens.is_active IS 'Se o token está ativo para receber notificações';
