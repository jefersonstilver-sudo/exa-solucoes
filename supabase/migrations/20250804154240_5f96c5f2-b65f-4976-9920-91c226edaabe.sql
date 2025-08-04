-- Update the handle_new_user function to call the external webhook
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_name text;
BEGIN
  -- Extract user name from metadata, fallback to email if not available
  user_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name', 
    split_part(NEW.email, '@', 1)
  );

  -- Insert into public.users table (existing functionality)
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'client');

  -- Call the edge function to create external client
  PERFORM
    net.http_post(
      url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/create-external-client',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'userId', NEW.id::text,
        'userName', user_name
      )
    );

  -- Log the attempt
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'USER_REGISTRATION_WEBHOOK_TRIGGERED',
    format('Triggered external client creation for user: %s (%s)', NEW.email, user_name)
  );

  RETURN NEW;
END;
$$;