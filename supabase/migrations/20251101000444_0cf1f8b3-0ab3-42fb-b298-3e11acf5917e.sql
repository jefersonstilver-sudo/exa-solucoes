-- ============================================================================
-- CRITICAL SECURITY FIXES - ERROR LEVEL ISSUES (Conditional)
-- ============================================================================

-- 1. CREATE USER ROLES TABLE (Fix: Privilege Escalation) - Conditional
-- ============================================================================

-- Create role enum only if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('client', 'admin', 'admin_marketing', 'super_admin', 'painel');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    granted_at timestamptz DEFAULT now(),
    granted_by uuid REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Migrate existing roles from users table to user_roles table
INSERT INTO public.user_roles (user_id, role, granted_at)
SELECT id, role::app_role, data_criacao
FROM public.users
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Drop and recreate RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
  )
);

-- 2. STRENGTHEN RLS POLICIES ON USERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_full_access" ON public.users;
DROP POLICY IF EXISTS "admins_can_select_all_users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON public.users;

CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"  
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all users"
ON public.users
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- 3. STRENGTHEN RLS ON PEDIDOS TABLE (Financial Data)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "super_admin_all_pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Users view own pedidos only" ON public.pedidos;
DROP POLICY IF EXISTS "Admins view all pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Only admins can manage pedidos" ON public.pedidos;

CREATE POLICY "Users view own pedidos only"
ON public.pedidos
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Admins view all pedidos"
ON public.pedidos
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Only admins can manage pedidos"
ON public.pedidos
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- 4. ADD INPUT VALIDATION FOR LEAD FORMS
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS validate_sindico_before_insert ON public.sindicos_interessados;
DROP TRIGGER IF EXISTS validate_linkae_before_insert ON public.leads_linkae;

-- Validation function for sindicos_interessados
CREATE OR REPLACE FUNCTION public.validate_sindico_lead()
RETURNS TRIGGER AS $$
BEGIN
  IF LENGTH(TRIM(NEW.nome_completo)) < 3 OR LENGTH(NEW.nome_completo) > 100 THEN
    RAISE EXCEPTION 'Nome deve ter entre 3 e 100 caracteres';
  END IF;
  
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Email inválido';
  END IF;
  
  IF NEW.celular !~ '^\+?[1-9][0-9]{10,14}$' THEN
    RAISE EXCEPTION 'Telefone inválido';
  END IF;
  
  IF NEW.numero_unidades < 1 OR NEW.numero_unidades > 10000 THEN
    RAISE EXCEPTION 'Número de unidades inválido';
  END IF;
  
  IF NEW.numero_andares < 1 OR NEW.numero_andares > 200 THEN
    RAISE EXCEPTION 'Número de andares inválido';
  END IF;
  
  NEW.nome_completo := regexp_replace(TRIM(NEW.nome_completo), '[<>\"'']', '', 'g');
  NEW.nome_predio := regexp_replace(TRIM(NEW.nome_predio), '[<>\"'']', '', 'g');
  NEW.endereco := regexp_replace(TRIM(NEW.endereco), '[<>\"'']', '', 'g');
  NEW.email := LOWER(TRIM(NEW.email));
  NEW.observacoes := LEFT(COALESCE(NEW.observacoes, ''), 1000);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER validate_sindico_before_insert
  BEFORE INSERT ON public.sindicos_interessados
  FOR EACH ROW EXECUTE FUNCTION validate_sindico_lead();

-- Validation function for leads_linkae
CREATE OR REPLACE FUNCTION public.validate_linkae_lead()
RETURNS TRIGGER AS $$
BEGIN
  IF LENGTH(TRIM(NEW.nome_completo)) < 3 OR LENGTH(NEW.nome_completo) > 100 THEN
    RAISE EXCEPTION 'Nome deve ter entre 3 e 100 caracteres';
  END IF;
  
  IF LENGTH(TRIM(NEW.nome_empresa)) < 2 OR LENGTH(NEW.nome_empresa) > 100 THEN
    RAISE EXCEPTION 'Nome da empresa inválido';
  END IF;
  
  IF NEW.whatsapp !~ '^\+?[1-9][0-9]{10,14}$' THEN
    RAISE EXCEPTION 'WhatsApp inválido';
  END IF;
  
  NEW.nome_completo := regexp_replace(TRIM(NEW.nome_completo), '[<>\"'']', '', 'g');
  NEW.nome_empresa := regexp_replace(TRIM(NEW.nome_empresa), '[<>\"'']', '', 'g');
  NEW.cargo := regexp_replace(TRIM(NEW.cargo), '[<>\"'']', '', 'g');
  NEW.objetivo := LEFT(COALESCE(NEW.objetivo, ''), 500);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER validate_linkae_before_insert
  BEFORE INSERT ON public.leads_linkae
  FOR EACH ROW EXECUTE FUNCTION validate_linkae_lead();

-- 5. CREATE AUDIT LOG FOR ROLE CHANGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  old_role app_role,
  new_role app_role,
  changed_by uuid REFERENCES auth.users(id),
  change_reason text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.role_change_audit;

CREATE POLICY "Super admins can view audit logs"
ON public.role_change_audit
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS audit_role_changes ON public.user_roles;

-- Trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_change_audit (user_id, new_role, changed_by)
    VALUES (NEW.user_id, NEW.role, NEW.granted_by);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_change_audit (user_id, old_role, changed_by)
    VALUES (OLD.user_id, OLD.role, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_role_changes
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION log_role_changes();

-- 6. UPDATE HELPER FUNCTIONS TO USE NEW ROLE SYSTEM
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin_simple()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(auth.uid(), 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(auth.uid(), 'super_admin');
$$;