-- Tabela de configuração da conexão Zoho
CREATE TABLE public.zoho_email_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Log de emails processados
CREATE TABLE public.email_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT UNIQUE,
  from_email TEXT,
  from_name TEXT,
  subject TEXT,
  received_at TIMESTAMPTZ,
  is_curriculum BOOLEAN DEFAULT false,
  candidate_data JSONB,
  ai_analysis TEXT,
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ DEFAULT now(),
  error_message TEXT
);

-- Configuração de alertas de currículo
CREATE TABLE public.curriculum_alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir configuração inicial do destinatário
INSERT INTO public.curriculum_alert_config (recipient_phone, recipient_name, is_active)
VALUES ('5545998090000', 'Jeferson', true);

-- RLS
ALTER TABLE public.zoho_email_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_processing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_alert_config ENABLE ROW LEVEL SECURITY;

-- Policies para admins
CREATE POLICY "Admins can manage zoho config" ON public.zoho_email_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can view email logs" ON public.email_processing_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage alert config" ON public.curriculum_alert_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Triggers para updated_at
CREATE TRIGGER update_zoho_email_config_updated_at
  BEFORE UPDATE ON public.zoho_email_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_curriculum_alert_config_updated_at
  BEFORE UPDATE ON public.curriculum_alert_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();