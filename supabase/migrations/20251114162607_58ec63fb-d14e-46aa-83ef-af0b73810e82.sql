-- Corrigir função log_user_login para verificar se usuário existe em public.users
-- antes de tentar inserir em user_activity_logs

CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas registrar login se o usuário já existir em public.users
  -- Isso evita erro de foreign key durante o primeiro login/confirmação de email
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.user_activity_logs (
      user_id, 
      action_type, 
      action_description,
      ip_address,
      user_agent,
      created_at
    )
    VALUES (
      NEW.id,
      'login',
      'Usuário realizou login no sistema',
      NEW.raw_app_meta_data->>'ip_address',
      NEW.raw_app_meta_data->>'user_agent',
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Em caso de qualquer erro, apenas retornar NEW sem bloquear o login
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.log_user_login() IS 'Registra login do usuário apenas se ele já existir em public.users (evita erros de FK durante primeiro login)';