-- TEMPORARY: Remover função do hook para permitir login
-- Esta função será recriada quando o sistema estiver estável

DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb) CASCADE;

-- Comentário de segurança: Hook temporariamente desabilitado
-- O sistema está usando busca direta da tabela user_roles
COMMENT ON TABLE public.user_roles IS 'Tabela de roles - Sistema usa busca direta enquanto hook está desabilitado';