
CREATE TABLE public.evolution_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collaborator_name TEXT NOT NULL,
  collaborator_phone TEXT,
  instance_name TEXT NOT NULL UNIQUE,
  instance_id TEXT,
  instance_token TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  owner_jid TEXT,
  profile_name TEXT,
  profile_picture_url TEXT,
  last_connected_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evolution_instances TO authenticated;
GRANT ALL ON public.evolution_instances TO service_role;

ALTER TABLE public.evolution_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view evolution instances"
ON public.evolution_instances FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert evolution instances"
ON public.evolution_instances FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update evolution instances"
ON public.evolution_instances FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admin can delete evolution instances"
ON public.evolution_instances FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_evolution_instances_updated_at
BEFORE UPDATE ON public.evolution_instances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
