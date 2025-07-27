-- Create advanced campaigns table
CREATE TABLE public.campaigns_advanced (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  pedido_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign video schedules table
CREATE TABLE public.campaign_video_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns_advanced(id) ON DELETE CASCADE,
  video_id UUID NOT NULL,
  slot_position INTEGER NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign schedule rules table
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

-- Enable Row Level Security
ALTER TABLE public.campaigns_advanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_video_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_schedule_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for campaigns_advanced
CREATE POLICY "Users can view their own campaigns" 
ON public.campaigns_advanced 
FOR SELECT 
USING (auth.uid() = client_id);

CREATE POLICY "Users can create their own campaigns" 
ON public.campaigns_advanced 
FOR INSERT 
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own campaigns" 
ON public.campaigns_advanced 
FOR UPDATE 
USING (auth.uid() = client_id);

CREATE POLICY "Users can delete their own campaigns" 
ON public.campaigns_advanced 
FOR DELETE 
USING (auth.uid() = client_id);

CREATE POLICY "Admins can manage all campaigns" 
ON public.campaigns_advanced 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'super_admin')
));

-- Create policies for campaign_video_schedules
CREATE POLICY "Users can access schedules of their campaigns" 
ON public.campaign_video_schedules 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.campaigns_advanced ca 
  WHERE ca.id = campaign_video_schedules.campaign_id 
  AND ca.client_id = auth.uid()
));

CREATE POLICY "Admins can manage all video schedules" 
ON public.campaign_video_schedules 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'super_admin')
));

-- Create policies for campaign_schedule_rules
CREATE POLICY "Users can access rules of their campaigns" 
ON public.campaign_schedule_rules 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.campaign_video_schedules cvs
  JOIN public.campaigns_advanced ca ON ca.id = cvs.campaign_id
  WHERE cvs.id = campaign_schedule_rules.campaign_video_schedule_id 
  AND ca.client_id = auth.uid()
));

CREATE POLICY "Admins can manage all schedule rules" 
ON public.campaign_schedule_rules 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'super_admin')
));

-- Create triggers for updated_at columns
CREATE TRIGGER update_campaigns_advanced_updated_at
BEFORE UPDATE ON public.campaigns_advanced
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_video_schedules_updated_at
BEFORE UPDATE ON public.campaign_video_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_schedule_rules_updated_at
BEFORE UPDATE ON public.campaign_schedule_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_campaigns_advanced_client_id ON public.campaigns_advanced(client_id);
CREATE INDEX idx_campaigns_advanced_pedido_id ON public.campaigns_advanced(pedido_id);
CREATE INDEX idx_campaign_video_schedules_campaign_id ON public.campaign_video_schedules(campaign_id);
CREATE INDEX idx_campaign_schedule_rules_video_schedule_id ON public.campaign_schedule_rules(campaign_video_schedule_id);