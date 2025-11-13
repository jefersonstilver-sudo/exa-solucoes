
-- CORREÇÃO URGENTE: Reverter pedidos marcados como pagos incorretamente
UPDATE pedidos
SET status = 'pendente',
    updated_at = NOW()
WHERE id IN ('03903561-34c5-4225-b19d-b3cce013d5ad', '5f4e53d5-87f5-4bd9-a6ff-8d740d60885d')
  AND client_id = '0100a648-7cc0-41be-98a8-97c0743da96e';

-- SEGURANÇA CRÍTICA: Impedir que clientes marquem pedidos como pagos diretamente
-- Criar função de validação para updates de status
CREATE OR REPLACE FUNCTION validate_pedido_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Pegar role do usuário atual
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') INTO user_role;
  
  -- Se o status está mudando para um status "pago"
  IF NEW.status IN ('pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo')
     AND OLD.status IN ('pendente', 'aguardando_pagamento')
  THEN
    -- Apenas service_role, admin ou super_admin podem fazer essa mudança
    IF user_role NOT IN ('admin', 'super_admin') AND auth.role() != 'service_role' THEN
      RAISE EXCEPTION 'Não autorizado: Apenas edge functions podem marcar pedidos como pagos';
    END IF;
    
    -- Verificar se tem log de pagamento válido
    IF NEW.log_pagamento IS NULL OR 
       (NEW.log_pagamento::jsonb -> 'pixData' IS NULL AND 
        NEW.log_pagamento::jsonb -> 'pix_data' IS NULL AND
        NEW.log_pagamento::jsonb -> 'payment_preference_id' IS NULL) THEN
      RAISE EXCEPTION 'Não é possível marcar pedido como pago sem dados de pagamento válidos';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger
DROP TRIGGER IF EXISTS validate_pedido_status_change_trigger ON pedidos;
CREATE TRIGGER validate_pedido_status_change_trigger
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION validate_pedido_status_change();

-- Registrar correção no log
INSERT INTO log_eventos_sistema (tipo_evento, descricao, ip)
VALUES (
  'SECURITY_FIX',
  'Corrigidos 2 pedidos marcados incorretamente como pagos. IDs: 03903561-34c5-4225-b19d-b3cce013d5ad, 5f4e53d5-87f5-4bd9-a6ff-8d740d60885d. Adicionada validação de segurança para evitar mudanças não autorizadas de status.',
  'system'
);

COMMENT ON FUNCTION validate_pedido_status_change() IS 
'SEGURANÇA CRÍTICA: Valida mudanças de status de pedidos para evitar que clientes marquem pedidos como pagos sem verificação de pagamento';
