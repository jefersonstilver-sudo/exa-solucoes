-- Remover trigger problemático
DROP TRIGGER IF EXISTS trigger_notify_benefit_change ON provider_benefits;
DROP FUNCTION IF EXISTS notify_benefit_change();

-- Comentário
COMMENT ON TABLE provider_benefits IS 'Trigger de notificações removido - será implementado de forma diferente';