-- Create table for configurable confirmation buttons
CREATE TABLE public.panel_offline_alert_buttons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  emoji TEXT DEFAULT '✅',
  ordem INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for tracking confirmations
CREATE TABLE public.panel_offline_alert_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_history_id UUID REFERENCES public.panel_offline_alerts_history(id) ON DELETE SET NULL,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  device_name TEXT,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  button_id UUID REFERENCES public.panel_offline_alert_buttons(id) ON DELETE SET NULL,
  button_label TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ DEFAULT now(),
  message_id TEXT,
  reference_message_id TEXT,
  raw_webhook JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.panel_offline_alert_buttons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_offline_alert_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS policies for buttons
CREATE POLICY "Admins can manage alert buttons"
ON public.panel_offline_alert_buttons FOR ALL
USING (EXISTS (
  SELECT 1 FROM users WHERE users.id = auth.uid() 
  AND users.role IN ('admin', 'super_admin')
));

CREATE POLICY "Public read for alert buttons"
ON public.panel_offline_alert_buttons FOR SELECT
USING (true);

-- RLS policies for confirmations
CREATE POLICY "Admins can view confirmations"
ON public.panel_offline_alert_confirmations FOR ALL
USING (EXISTS (
  SELECT 1 FROM users WHERE users.id = auth.uid() 
  AND users.role IN ('admin', 'super_admin')
));

CREATE POLICY "System can insert confirmations"
ON public.panel_offline_alert_confirmations FOR INSERT
WITH CHECK (true);

-- Insert default buttons
INSERT INTO public.panel_offline_alert_buttons (label, emoji, ordem, ativo) VALUES
('Já estou verificando', '🔧', 1, true),
('Visualizei', '👁️', 2, true);

-- Create indexes
CREATE INDEX idx_confirmations_device ON public.panel_offline_alert_confirmations(device_id);
CREATE INDEX idx_confirmations_alert ON public.panel_offline_alert_confirmations(alert_history_id);
CREATE INDEX idx_confirmations_confirmed_at ON public.panel_offline_alert_confirmations(confirmed_at DESC);