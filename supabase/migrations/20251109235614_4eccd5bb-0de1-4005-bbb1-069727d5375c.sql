-- Criar políticas públicas de leitura para o painel de exibição

-- 1. Permitir leitura pública de prédios (apenas dados básicos necessários)
CREATE POLICY "public_read_buildings_for_display" ON public.buildings
FOR SELECT
USING (true);

-- 2. Permitir leitura pública de pedidos ativos (necessário para buscar vídeos do prédio)
CREATE POLICY "public_read_active_pedidos" ON public.pedidos
FOR SELECT
USING (status IN ('ativo', 'video_aprovado', 'pago_pendente_video', 'video_enviado', 'pago'));

-- 3. Permitir leitura pública de vídeos (URLs e informações dos vídeos)
CREATE POLICY "public_read_videos_for_display" ON public.videos
FOR SELECT
USING (true);

-- 4. Permitir leitura pública da relação pedido_videos
CREATE POLICY "public_read_pedido_videos" ON public.pedido_videos
FOR SELECT
USING (true);

-- 5. Permitir leitura pública de regras de agendamento ativas
CREATE POLICY "public_read_schedule_rules" ON public.campaign_schedule_rules
FOR SELECT
USING (is_active = true);

-- 6. Permitir leitura pública de agendamentos de vídeos
CREATE POLICY "public_read_video_schedules" ON public.campaign_video_schedules
FOR SELECT
USING (true);

-- 7. Garantir que a função RPC get_current_display_videos_batch possa ser executada publicamente
-- (a função já existe, só precisamos garantir que está acessível)
GRANT EXECUTE ON FUNCTION public.get_current_display_videos_batch(uuid[]) TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_display_videos_batch(uuid[]) TO authenticated;