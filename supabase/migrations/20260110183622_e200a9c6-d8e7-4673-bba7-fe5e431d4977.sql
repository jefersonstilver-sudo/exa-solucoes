-- =====================================================
-- CRIAR FUNÇÃO has_any_admin_role SE NÃO EXISTIR
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_any_admin_role(_user_id uuid)
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
      AND role IN ('admin', 'super_admin', 'admin_marketing', 'admin_financeiro')
  )
$$;