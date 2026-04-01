
-- Tabela de logs de reprodução real de vídeos nos elevadores
CREATE TABLE public.video_playback_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
  duration_seconds numeric NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes para queries de relatório
CREATE INDEX idx_playback_logs_video_started ON public.video_playback_logs (video_id, started_at);
CREATE INDEX idx_playback_logs_building_started ON public.video_playback_logs (building_id, started_at);
CREATE INDEX idx_playback_logs_pedido_started ON public.video_playback_logs (pedido_id, started_at);

-- RLS
ALTER TABLE public.video_playback_logs ENABLE ROW LEVEL SECURITY;

-- Admins podem ver tudo
CREATE POLICY "Admins can view all playback logs"
ON public.video_playback_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Clientes podem ver logs dos seus pedidos
CREATE POLICY "Clients can view own playback logs"
ON public.video_playback_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = video_playback_logs.pedido_id
    AND p.client_id = auth.uid()
  )
);

-- Sem INSERT/UPDATE/DELETE público (inserção via Edge Function com service_role)
