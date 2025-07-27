-- Criar tabelas para sistema de agendamento avançado de campanhas

-- Tabela para agendamento de vídeos em campanhas
CREATE TABLE public.campaign_video_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns_advanced(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  slot_position INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para regras de horários específicos
CREATE TABLE public.campaign_schedule_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_video_schedule_id UUID NOT NULL REFERENCES public.campaign_video_schedules(id) ON DELETE CASCADE,
  days_of_week INTEGER[] NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_video_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_schedule_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies para campaign_video_schedules
CREATE POLICY "Users can access schedules of their campaigns"
  ON public.campaign_video_schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns_advanced ca
      WHERE ca.id = campaign_video_schedules.campaign_id
      AND ca.client_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all video schedules"
  ON public.campaign_video_schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies para campaign_schedule_rules
CREATE POLICY "Users can access rules of their campaigns"
  ON public.campaign_schedule_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_video_schedules cvs
      JOIN public.campaigns_advanced ca ON ca.id = cvs.campaign_id
      WHERE cvs.id = campaign_schedule_rules.campaign_video_schedule_id
      AND ca.client_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all schedule rules"
  ON public.campaign_schedule_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_video_schedules_updated_at
  BEFORE UPDATE ON public.campaign_video_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_schedule_rules_updated_at
  BEFORE UPDATE ON public.campaign_schedule_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();