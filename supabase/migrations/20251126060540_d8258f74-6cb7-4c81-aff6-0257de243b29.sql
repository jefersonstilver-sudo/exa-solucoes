-- Enable Row Level Security on tables that currently have it disabled
-- This addresses the critical security finding: RLS Disabled in Public

ALTER TABLE public.agent_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_modification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_preview_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diretores_autorizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_console_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

-- Create policies for system/internal tables (restrict to service role only)
CREATE POLICY "Service role only access" ON public.agent_context
FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only access" ON public.agent_modification_logs
FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only access" ON public.agent_performance_metrics
FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only access" ON public.agent_preview_conversations
FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only access" ON public.agent_topics
FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only access" ON public.analyses
FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only access" ON public.conversation_analytics
FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only access" ON public.device_alerts
FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only access" ON public.devices
FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only access" ON public.directors
FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only access" ON public.diretores_autorizados
FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only access" ON public.ia_console_messages
FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only access" ON public.lead_qualifications
FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role only access" ON public.sync_runs
FOR ALL USING (auth.jwt()->>'role' = 'service_role');