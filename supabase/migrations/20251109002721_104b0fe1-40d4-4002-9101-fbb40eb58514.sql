-- ==========================================
-- MIGRATION: Secure Role System with user_roles table
-- ==========================================

-- 1. Create the app_role enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'admin_marketing', 'admin_financeiro', 'client', 'painel');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create the user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create the SECURITY DEFINER function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create simple admin check functions
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin_simple()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  )
$$;

-- 6. Migrate existing roles from users table to user_roles (only if not already present)
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  u.role::app_role
FROM public.users u
WHERE u.role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
  );

-- 7. RLS Policies for user_roles table
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin') OR 
  has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;
CREATE POLICY "System can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 8. Create trigger to keep users.role in sync (for backward compatibility)
CREATE OR REPLACE FUNCTION public.sync_user_role_to_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET role = NEW.role::text
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_role_to_users ON public.user_roles;
CREATE TRIGGER sync_role_to_users
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_to_users();

-- 9. Create trigger to update user_roles when users.role changes (temporary compatibility)
CREATE OR REPLACE FUNCTION public.sync_users_role_to_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NEW.role::app_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = EXCLUDED.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_users_to_user_roles ON public.users;
CREATE TRIGGER sync_users_to_user_roles
AFTER INSERT OR UPDATE OF role ON public.users
FOR EACH ROW
WHEN (NEW.role IS NOT NULL)
EXECUTE FUNCTION public.sync_users_role_to_user_roles();

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin_simple TO authenticated;