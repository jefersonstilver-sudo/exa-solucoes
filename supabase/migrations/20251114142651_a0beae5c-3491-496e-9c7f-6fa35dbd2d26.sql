-- Adicionar campos de auditoria aos pedidos (IP e device info)
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS ip_origem TEXT,
ADD COLUMN IF NOT EXISTS device_info JSONB,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Criar tabela de log para pedidos cancelados automaticamente
CREATE TABLE IF NOT EXISTS pedidos_cancelados_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL,
  client_id UUID,
  motivo TEXT NOT NULL DEFAULT 'auto_cancelamento_2_dias',
  valor_total NUMERIC(10,2),
  status_anterior TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_origem TEXT,
  device_info JSONB,
  dados_pedido JSONB NOT NULL
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_expires_at ON pedidos(expires_at) WHERE status = 'pendente';
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_log_cancelado_em ON pedidos_cancelados_log(cancelado_em);
CREATE INDEX IF NOT EXISTS idx_pedidos_cancelados_log_client_id ON pedidos_cancelados_log(client_id);

-- Atualizar pedidos pendentes existentes com data de expiração (2 dias)
UPDATE pedidos 
SET expires_at = created_at + INTERVAL '2 days'
WHERE status = 'pendente' AND expires_at IS NULL;

-- Criar função para auto-cancelamento de pedidos expirados
CREATE OR REPLACE FUNCTION auto_cancel_expired_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  canceled_count INTEGER := 0;
  order_record RECORD;
BEGIN
  -- Buscar pedidos pendentes expirados
  FOR order_record IN
    SELECT *
    FROM pedidos
    WHERE status = 'pendente'
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
  LOOP
    -- Inserir no log antes de cancelar
    INSERT INTO pedidos_cancelados_log (
      pedido_id,
      client_id,
      motivo,
      valor_total,
      status_anterior,
      created_at,
      ip_origem,
      device_info,
      dados_pedido
    ) VALUES (
      order_record.id,
      order_record.client_id,
      'auto_cancelamento_2_dias',
      order_record.valor_total,
      order_record.status,
      order_record.created_at,
      order_record.ip_origem,
      order_record.device_info,
      jsonb_build_object(
        'id', order_record.id,
        'nome_pedido', order_record.nome_pedido,
        'valor_total', order_record.valor_total,
        'plano_meses', order_record.plano_meses,
        'lista_paineis', order_record.lista_paineis,
        'created_at', order_record.created_at,
        'expires_at', order_record.expires_at
      )
    );

    -- Cancelar o pedido
    UPDATE pedidos
    SET status = 'cancelado',
        updated_at = NOW()
    WHERE id = order_record.id;

    canceled_count := canceled_count + 1;
  END LOOP;

  -- Log do resultado
  INSERT INTO log_eventos_sistema (
    tipo_evento,
    descricao,
    metadata
  ) VALUES (
    'AUTO_CANCEL_ORDERS',
    format('Cancelados automaticamente %s pedidos expirados', canceled_count),
    jsonb_build_object(
      'canceled_count', canceled_count,
      'execution_time', NOW()
    )
  );

  RETURN canceled_count;
END;
$$;

-- Criar trigger para definir expires_at automaticamente em novos pedidos pendentes
CREATE OR REPLACE FUNCTION set_order_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'pendente' AND NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + INTERVAL '2 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_order_expiration ON pedidos;
CREATE TRIGGER trigger_set_order_expiration
  BEFORE INSERT OR UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION set_order_expiration();

COMMENT ON TABLE pedidos_cancelados_log IS 'Log de pedidos cancelados automaticamente após 2 dias sem pagamento';
COMMENT ON COLUMN pedidos.ip_origem IS 'IP de origem da compra para auditoria';
COMMENT ON COLUMN pedidos.device_info IS 'Informações do dispositivo usado na compra (user agent, OS, browser, etc)';
COMMENT ON COLUMN pedidos.expires_at IS 'Data/hora de expiração do pedido pendente (2 dias após criação)';
