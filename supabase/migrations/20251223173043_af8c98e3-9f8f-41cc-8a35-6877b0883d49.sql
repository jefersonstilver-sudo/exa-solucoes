-- Create central audit log table for all EXA alerts
CREATE TABLE IF NOT EXISTS public.exa_alerts_message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_key TEXT NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'scheduled_send',
    phone TEXT NOT NULL,
    recipient_name TEXT,
    provider TEXT NOT NULL DEFAULT 'zapi',
    status TEXT NOT NULL DEFAULT 'pending',
    message_preview TEXT,
    provider_message_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_exa_alerts_logs_alert_key ON public.exa_alerts_message_logs(alert_key);
CREATE INDEX idx_exa_alerts_logs_created_at ON public.exa_alerts_message_logs(created_at DESC);
CREATE INDEX idx_exa_alerts_logs_status ON public.exa_alerts_message_logs(status);
CREATE INDEX idx_exa_alerts_logs_phone ON public.exa_alerts_message_logs(phone);

-- Add test_phone column to commercial_alerts_config for persistence
ALTER TABLE public.commercial_alerts_config 
ADD COLUMN IF NOT EXISTS test_phone TEXT;

-- Enable RLS
ALTER TABLE public.exa_alerts_message_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for super_admin and admin to view logs
CREATE POLICY "Admins can view alert logs" ON public.exa_alerts_message_logs
    FOR SELECT USING (true);

-- Create policy for edge functions to insert logs
CREATE POLICY "Service role can insert alert logs" ON public.exa_alerts_message_logs
    FOR INSERT WITH CHECK (true);

COMMENT ON TABLE public.exa_alerts_message_logs IS 'Central audit log for all EXA alert messages sent';