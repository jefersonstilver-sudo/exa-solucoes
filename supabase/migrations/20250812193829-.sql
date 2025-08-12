-- Secure coupons: restrict direct reads and enforce auth-only validation via RPC

-- 1) Tighten RLS on public.cupons: drop permissive SELECT policies for general users
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.cupons;
DROP POLICY IF EXISTS "Users can validate active coupons" ON public.cupons;
DROP POLICY IF EXISTS "authenticated_view_cupons" ON public.cupons;

-- Keep existing admin/super_admin manage policies as-is

-- 2) Harden coupon validation into a SECURITY DEFINER function that requires authentication
CREATE OR REPLACE FUNCTION public.validate_cupom(
  p_codigo text,
  p_meses integer
)
RETURNS TABLE(
  valid boolean,
  message text,
  id uuid,
  desconto_percentual integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_coupon RECORD;
  v_user_id uuid;
  v_user_usage_count integer := 0;
BEGIN
  -- Require authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    valid := false; message := 'auth_required'; id := NULL; desconto_percentual := 0; RETURN NEXT; RETURN;
  END IF;

  -- Find active and eligible coupon by code
  SELECT c.* INTO v_coupon
  FROM public.cupons c
  WHERE upper(c.codigo) = upper(p_codigo)
    AND c.ativo = true
    AND (c.data_inicio IS NULL OR c.data_inicio <= now())
    AND (c.expira_em IS NULL OR c.expira_em > now())
    AND c.min_meses <= COALESCE(p_meses, 0)
  LIMIT 1;

  IF NOT FOUND THEN
    valid := false; message := 'Cupom inválido ou expirado'; id := NULL; desconto_percentual := 0; RETURN NEXT; RETURN;
  END IF;

  -- Check global usage cap
  IF COALESCE(v_coupon.max_usos, 0) > 0 AND v_coupon.usos_atuais >= v_coupon.max_usos THEN
    valid := false; message := 'Limite de usos atingido'; id := NULL; desconto_percentual := 0; RETURN NEXT; RETURN;
  END IF;

  -- Enforce per-user usage limit when configured
  IF v_coupon.uso_por_usuario IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage_count
    FROM public.pedidos p
    WHERE p.client_id = v_user_id
      AND p.cupom_id = v_coupon.id;

    IF v_user_usage_count >= v_coupon.uso_por_usuario THEN
      valid := false; message := 'Limite de usos por usuário atingido'; id := NULL; desconto_percentual := 0; RETURN NEXT; RETURN;
    END IF;
  END IF;

  -- Success
  valid := true; message := 'Cupom válido'; id := v_coupon.id; desconto_percentual := v_coupon.desconto_percentual;
  RETURN NEXT;
END;
$$;

-- Optional: document intention via comment
COMMENT ON FUNCTION public.validate_cupom(text, integer)
IS 'Validates a coupon by code for the current authenticated user without exposing coupon listings. Enforces activity, dates, min_meses, global and per-user limits.';