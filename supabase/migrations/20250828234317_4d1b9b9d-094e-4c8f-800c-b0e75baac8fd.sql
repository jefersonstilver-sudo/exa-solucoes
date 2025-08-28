-- Criar tabela principal de atividades do sistema
CREATE TABLE public.system_activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('user_action', 'admin_action', 'system_event')),
  action TEXT NOT NULL,
  entity_type TEXT, -- 'pedido', 'video', 'user', 'building', 'painel', etc.
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE public.system_activity_feed ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: apenas admins podem acessar
CREATE POLICY "Admins can view all activities" 
ON public.system_activity_feed 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "System can insert activities" 
ON public.system_activity_feed 
FOR INSERT 
WITH CHECK (true); -- Permite inserções do sistema

-- Criar índices para performance
CREATE INDEX idx_system_activity_feed_created_at ON public.system_activity_feed(created_at DESC);
CREATE INDEX idx_system_activity_feed_activity_type ON public.system_activity_feed(activity_type);
CREATE INDEX idx_system_activity_feed_action ON public.system_activity_feed(action);
CREATE INDEX idx_system_activity_feed_user_id ON public.system_activity_feed(user_id);
CREATE INDEX idx_system_activity_feed_severity ON public.system_activity_feed(severity);

-- Função helper para registrar atividades
CREATE OR REPLACE FUNCTION public.log_system_activity(
  p_user_id UUID DEFAULT NULL,
  p_activity_type TEXT DEFAULT 'system_event',
  p_action TEXT DEFAULT '',
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.system_activity_feed (
    user_id,
    activity_type,
    action,
    entity_type,
    entity_id,
    details,
    ip_address,
    user_agent,
    severity
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_action,
    p_entity_type,
    p_entity_id,
    p_details,
    p_ip_address,
    p_user_agent,
    p_severity
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

-- Função para buscar atividades recentes (últimas 50)
CREATE OR REPLACE FUNCTION public.get_recent_activities(p_limit INTEGER DEFAULT 50)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  activity_type TEXT,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  severity TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Apenas admins podem acessar
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can view activities';
  END IF;

  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    COALESCE(au.email, 'Sistema') as user_email,
    COALESCE(au.raw_user_meta_data->>'name', 'Sistema') as user_name,
    a.activity_type,
    a.action,
    a.entity_type,
    a.entity_id,
    a.details,
    a.severity,
    a.created_at
  FROM public.system_activity_feed a
  LEFT JOIN auth.users au ON au.id = a.user_id
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Registrar primeira atividade do sistema
SELECT public.log_system_activity(
  NULL,
  'system_event',
  'system_monitoring_initialized',
  'system',
  NULL,
  '{"message": "Sistema de monitoramento de atividades inicializado com sucesso"}'::jsonb,
  NULL,
  NULL,
  'info'
);