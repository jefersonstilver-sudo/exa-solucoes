-- =====================================================
-- CORREÇÃO DOS ERROS IDENTIFICADOS NOS LOGS
-- =====================================================

-- 1. Adicionar coluna manychat_config à tabela agents
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS manychat_config JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.agents.manychat_config IS 
'Configurações de integração com ManyChat (API key, webhook URLs, etc)';

-- 2. Adicionar política RLS para log_eventos_sistema permitir service_role
-- Primeiro, remover se existir
DROP POLICY IF EXISTS "Service role can insert system logs" ON public.log_eventos_sistema;

CREATE POLICY "Service role can insert system logs"
ON public.log_eventos_sistema
FOR INSERT
TO service_role
WITH CHECK (true);

COMMENT ON POLICY "Service role can insert system logs" ON public.log_eventos_sistema IS 
'Permite que edge functions (via service_role) insiram logs no sistema';

-- 3. Adicionar políticas RLS para pedido_videos permitir service_role
-- Remover se existirem
DROP POLICY IF EXISTS "Service role can read pedido_videos" ON public.pedido_videos;
DROP POLICY IF EXISTS "Service role can update pedido_videos" ON public.pedido_videos;

CREATE POLICY "Service role can read pedido_videos"
ON public.pedido_videos
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can update pedido_videos"
ON public.pedido_videos
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

COMMENT ON POLICY "Service role can read pedido_videos" ON public.pedido_videos IS 
'Permite que edge functions acessem dados de vídeos de pedidos';

COMMENT ON POLICY "Service role can update pedido_videos" ON public.pedido_videos IS 
'Permite que edge functions atualizem dados de vídeos de pedidos';