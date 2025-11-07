-- Fix search_path for notify_benefit_change function
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
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;