-- Criar tabela de logs de API
CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  request_payload JSONB,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_api_logs_api_name ON public.api_logs(api_name);
CREATE INDEX idx_api_logs_created_at ON public.api_logs(created_at DESC);
CREATE INDEX idx_api_logs_success ON public.api_logs(success);

-- RLS Policies
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view api logs"
  ON public.api_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert api logs"
  ON public.api_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Atualizar agente Eduardo com configuração ManyChat
UPDATE public.agents 
SET 
  whatsapp_number = '+5545991415856',
  manychat_connected = true,
  manychat_config = jsonb_build_object(
    'webhook_url', 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/webhook-manychat/eduardo',
    'channelId', 'eduardo_commercial',
    'phoneNumber', '+5545991415856'
  )
WHERE key = 'eduardo';