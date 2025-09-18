-- Atualizar tabela avisos para suportar notificações agendadas

-- Adicionar campo para agendamento
ALTER TABLE avisos ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Adicionar campo para controle de envio
ALTER TABLE avisos ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campo para tipo de agendamento
ALTER TABLE avisos ADD COLUMN IF NOT EXISTS schedule_type VARCHAR(50) DEFAULT 'immediate';
-- Valores possíveis: 'immediate', 'scheduled', 'recurring_daily', 'recurring_weekly', 'recurring_monthly'

-- Adicionar campo para dados de recorrência
ALTER TABLE avisos ADD COLUMN IF NOT EXISTS recurrence_config JSONB DEFAULT '{}';

-- Índices para performance de consultas agendadas
CREATE INDEX IF NOT EXISTS idx_avisos_scheduled_for ON avisos(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_avisos_pending_scheduled ON avisos(scheduled_for, sent_at) 
  WHERE scheduled_for IS NOT NULL AND sent_at IS NULL AND ativo = true;

-- Comentários para documentação
COMMENT ON COLUMN avisos.scheduled_for IS 'Data e hora para envio da notificação (NULL = envio imediato)';
COMMENT ON COLUMN avisos.sent_at IS 'Data e hora em que a notificação foi enviada';
COMMENT ON COLUMN avisos.schedule_type IS 'Tipo de agendamento: immediate, scheduled, recurring_*';
COMMENT ON COLUMN avisos.recurrence_config IS 'Configurações de recorrência em JSON';

-- Função para buscar notificações pendentes para envio
CREATE OR REPLACE FUNCTION get_pending_scheduled_notifications()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  aviso_tipo TEXT,
  titulo TEXT,
  descricao TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  schedule_type TEXT,
  recurrence_config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.aviso_tipo,
    a.titulo,
    a.descricao,
    a.scheduled_for,
    a.schedule_type,
    a.recurrence_config
  FROM avisos a
  WHERE 
    a.ativo = true 
    AND a.sent_at IS NULL 
    AND a.scheduled_for IS NOT NULL 
    AND a.scheduled_for <= NOW()
  ORDER BY a.scheduled_for ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar notificação como enviada
CREATE OR REPLACE FUNCTION mark_notification_as_sent(notification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE avisos 
  SET 
    sent_at = NOW(),
    atualizado_em = NOW()
  WHERE id = notification_id;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar notificação recorrente
CREATE OR REPLACE FUNCTION create_recurring_notification(
  p_user_id UUID,
  p_aviso_tipo TEXT,
  p_titulo TEXT,
  p_descricao TEXT,
  p_schedule_type TEXT,
  p_recurrence_config JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
  next_scheduled TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calcular próxima data baseada no tipo de recorrência
  CASE p_schedule_type
    WHEN 'recurring_daily' THEN
      next_scheduled := NOW() + INTERVAL '1 day';
    WHEN 'recurring_weekly' THEN
      next_scheduled := NOW() + INTERVAL '1 week';
    WHEN 'recurring_monthly' THEN
      next_scheduled := NOW() + INTERVAL '1 month';
    ELSE
      next_scheduled := NOW();
  END CASE;

  INSERT INTO avisos (
    user_id,
    aviso_tipo,
    titulo,
    descricao,
    ativo,
    schedule_type,
    scheduled_for,
    recurrence_config,
    criado_em,
    atualizado_em
  ) VALUES (
    p_user_id,
    p_aviso_tipo,
    p_titulo,
    p_descricao,
    true,
    p_schedule_type,
    next_scheduled,
    p_recurrence_config,
    NOW(),
    NOW()
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
