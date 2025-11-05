-- ============================================
-- PARTE 2: ATUALIZAR RLS POLICIES PARA admin_financeiro
-- ============================================

-- Política para provider_benefits (acesso a benefícios)
DROP POLICY IF EXISTS "Admins can view all benefits" ON public.provider_benefits;
CREATE POLICY "Admins can view all benefits"
ON public.provider_benefits
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'admin_financeiro'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can insert benefits" ON public.provider_benefits;
CREATE POLICY "Admins can insert benefits"
ON public.provider_benefits
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'admin_financeiro'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can update benefits" ON public.provider_benefits;
CREATE POLICY "Admins can update benefits"
ON public.provider_benefits
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'admin_financeiro'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Política para pedidos (acesso a vendas)
DROP POLICY IF EXISTS "Admins view all pedidos" ON public.pedidos;
CREATE POLICY "Admins view all pedidos"
ON public.pedidos
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'admin_financeiro'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Política READ-ONLY para financeiro visualizar cupons
CREATE POLICY "Financeiro can view coupons"
ON public.cupons
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin_financeiro'::app_role)
);

-- Comentários explicativos
COMMENT ON POLICY "Admins can view all benefits" ON public.provider_benefits IS 
'Permite admin, admin_financeiro e super_admin visualizarem benefícios de prestadores';

COMMENT ON POLICY "Financeiro can view coupons" ON public.cupons IS 
'Permite admin_financeiro visualizar cupons (mas não criar/editar)';