
-- Tabela de logs de auditoria de sincronização AWS
CREATE TABLE public.api_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  building_id UUID,
  video_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('add', 'remove', 'audit')),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
  source TEXT NOT NULL CHECK (source IN ('manual', 'auto', 'cron', 'audit')),
  executed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  aws_response JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para consultas por pedido e data
CREATE INDEX idx_api_sync_logs_pedido ON public.api_sync_logs(pedido_id);
CREATE INDEX idx_api_sync_logs_created ON public.api_sync_logs(created_at DESC);

-- RLS: somente super_admin pode ler
ALTER TABLE public.api_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on api_sync_logs"
  ON public.api_sync_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Super admin can read api_sync_logs"
  ON public.api_sync_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
