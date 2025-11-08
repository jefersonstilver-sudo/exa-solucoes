-- Create user activity log table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_description TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Admins can view activity logs"
ON public.user_activity_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- System can insert activity logs
CREATE POLICY "System can insert activity logs"
ON public.user_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON public.user_activity_logs(created_at DESC);

-- Create RPC function to get user activity with details
CREATE OR REPLACE FUNCTION get_user_activity_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_actions', COUNT(*)::INT,
    'last_action_at', MAX(created_at),
    'recent_actions', json_agg(
      json_build_object(
        'action_type', action_type,
        'action_description', action_description,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')
  ) INTO result
  FROM public.user_activity_logs
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(result, '{"total_actions": 0, "last_action_at": null, "recent_actions": []}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';