-- Tabela para controle de notificações/lembretes de propostas
CREATE TABLE IF NOT EXISTS public.proposal_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  -- Controle de lembretes de expiração
  expire_reminders_muted BOOLEAN DEFAULT false,
  expire_reminders_muted_at TIMESTAMP WITH TIME ZONE,
  expire_reminders_muted_by TEXT,
  mute_reason TEXT, -- 'ja_enviei' | 'cliente_contactado' | 'descartado'
  -- Contadores
  reminders_sent_count INTEGER DEFAULT 0,
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(proposal_id)
);

-- Enable RLS
ALTER TABLE public.proposal_notification_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para admin
CREATE POLICY "Allow all for authenticated" ON public.proposal_notification_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_proposal_notification_settings_proposal_id ON proposal_notification_settings(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_notification_settings_muted ON proposal_notification_settings(expire_reminders_muted);

-- Trigger para updated_at
CREATE TRIGGER update_proposal_notification_settings_updated_at
  BEFORE UPDATE ON proposal_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();