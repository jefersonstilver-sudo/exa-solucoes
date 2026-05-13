
-- 1) Add new role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_master_video';

-- 2) Impersonation sessions
CREATE TABLE IF NOT EXISTS public.admin_impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  target_pedido_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  ended_at timestamptz,
  end_reason text CHECK (end_reason IN ('manual','expired','forced')),
  user_agent text,
  ip_address text
);
CREATE INDEX IF NOT EXISTS idx_aimps_admin ON public.admin_impersonation_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_aimps_target ON public.admin_impersonation_sessions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_aimps_active ON public.admin_impersonation_sessions(expires_at) WHERE ended_at IS NULL;

ALTER TABLE public.admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin all sessions"
  ON public.admin_impersonation_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::text))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::text));

CREATE POLICY "admin_master_video own sessions select"
  ON public.admin_impersonation_sessions FOR SELECT TO authenticated
  USING (admin_user_id = auth.uid() AND public.has_role(auth.uid(), 'admin_master_video'::text));

-- 3) Impersonation action log
CREATE TABLE IF NOT EXISTS public.admin_impersonation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.admin_impersonation_sessions(id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  pedido_id uuid,
  action text NOT NULL,
  entity_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aimpa_session ON public.admin_impersonation_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_aimpa_target ON public.admin_impersonation_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_aimpa_created ON public.admin_impersonation_actions(created_at DESC);

ALTER TABLE public.admin_impersonation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin all actions"
  ON public.admin_impersonation_actions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::text))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::text));

CREATE POLICY "admin_master_video own actions select"
  ON public.admin_impersonation_actions FOR SELECT TO authenticated
  USING (admin_user_id = auth.uid() AND public.has_role(auth.uid(), 'admin_master_video'::text));

-- 4) Onboarding acceptance
CREATE TABLE IF NOT EXISTS public.admin_master_video_onboarding (
  user_id uuid PRIMARY KEY,
  accepted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_master_video_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user own onboarding"
  ON public.admin_master_video_onboarding FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "super_admin view onboarding"
  ON public.admin_master_video_onboarding FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::text));
