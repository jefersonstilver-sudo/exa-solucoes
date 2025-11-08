-- FASE 2 & 5: Sistema de Registro de Último Acesso e Auditoria Completa

-- 1. Criar função para registrar login automaticamente
CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS TRIGGER AS $$
BEGIN
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
    'Usuário autenticado no sistema',
    NEW.last_sign_in_at::text, -- Placeholder para IP (será preenchido via edge function se necessário)
    NULL,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Criar trigger para registrar cada login
DROP TRIGGER IF EXISTS on_user_login ON auth.users;
CREATE TRIGGER on_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.log_user_login();

-- 3. Criar view otimizada que combina users com último acesso
CREATE OR REPLACE VIEW public.users_with_last_access AS
SELECT 
  u.id,
  u.email,
  u.nome,
  u.cpf,
  u.telefone,
  u.avatar_url,
  u.role,
  u.data_criacao,
  u.email_verified_at,
  u.terms_accepted_at,
  u.privacy_accepted_at,
  u.documento_estrangeiro,
  u.documento_frente_url,
  u.documento_verso_url,
  u.tipo_documento,
  au.last_sign_in_at,
  au.email_confirmed_at,
  au.raw_user_meta_data,
  COALESCE(
    (SELECT MAX(ual.created_at) 
     FROM user_activity_logs ual 
     WHERE ual.user_id = u.id AND ual.action_type = 'login'),
    au.last_sign_in_at
  ) as last_access_at
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id;

-- 4. Criar função para registrar mudanças de permissões (AUDITORIA)
CREATE OR REPLACE FUNCTION public.log_permission_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar no log de atividades
  INSERT INTO public.user_activity_logs (
    user_id,
    action_type,
    action_description,
    metadata,
    created_at
  )
  VALUES (
    NEW.user_id,
    'permission_change',
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Permissão customizada adicionada'
      WHEN TG_OP = 'UPDATE' THEN 'Permissão customizada atualizada'
      WHEN TG_OP = 'DELETE' THEN 'Permissão customizada removida'
    END,
    jsonb_build_object(
      'operation', TG_OP,
      'old_permissions', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
      'new_permissions', CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
      'changed_by', auth.uid()
    ),
    NOW()
  );
  
  -- Registrar no log específico de permissões
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    INSERT INTO public.permission_change_logs (
      user_id,
      changed_by,
      old_permissions,
      new_permissions,
      change_reason,
      ip_address
    )
    VALUES (
      NEW.user_id,
      auth.uid(),
      CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      to_jsonb(NEW),
      'Alteração via interface administrativa',
      NULL -- Será preenchido via application level
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Criar trigger para auditoria de permissões customizadas
DROP TRIGGER IF EXISTS on_custom_permission_change ON public.user_custom_permissions;
CREATE TRIGGER on_custom_permission_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_custom_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_permission_change();

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_login 
  ON public.user_activity_logs(user_id, action_type, created_at DESC)
  WHERE action_type = 'login';

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_recent 
  ON public.user_activity_logs(user_id, created_at DESC);

-- 7. Grant permissions para a view
GRANT SELECT ON public.users_with_last_access TO authenticated;

COMMENT ON VIEW public.users_with_last_access IS 'View otimizada que combina dados de users com informações de autenticação e último acesso';
COMMENT ON FUNCTION public.log_user_login() IS 'Registra automaticamente cada login de usuário na tabela user_activity_logs';
COMMENT ON FUNCTION public.log_permission_change() IS 'Auditoria completa de mudanças em permissões customizadas de usuários';