-- Criar função para chamar edge function de notificações de benefícios
CREATE OR REPLACE FUNCTION notify_benefit_change()
RETURNS TRIGGER AS $$
DECLARE
  benefit_id_val UUID;
  event_type_val TEXT;
BEGIN
  -- Determinar o ID do benefício e tipo de evento
  IF TG_OP = 'INSERT' THEN
    benefit_id_val := NEW.id;
    event_type_val := 'INSERT';
  ELSIF TG_OP = 'UPDATE' THEN
    benefit_id_val := NEW.id;
    event_type_val := 'UPDATE';
  ELSIF TG_OP = 'DELETE' THEN
    benefit_id_val := OLD.id;
    event_type_val := 'DELETE';
  END IF;

  -- Chamar edge function de forma assíncrona
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/create-benefit-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'benefit_id', benefit_id_val,
      'event_type', event_type_val,
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
      'new_record', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger na tabela provider_benefits
DROP TRIGGER IF EXISTS trigger_notify_benefit_change ON provider_benefits;
CREATE TRIGGER trigger_notify_benefit_change
  AFTER INSERT OR UPDATE ON provider_benefits
  FOR EACH ROW
  EXECUTE FUNCTION notify_benefit_change();

-- Comentário explicativo
COMMENT ON FUNCTION notify_benefit_change() IS 'Função que notifica mudanças em benefícios de prestadores via edge function';
COMMENT ON TRIGGER trigger_notify_benefit_change ON provider_benefits IS 'Trigger que chama função de notificação quando benefícios são criados ou atualizados';