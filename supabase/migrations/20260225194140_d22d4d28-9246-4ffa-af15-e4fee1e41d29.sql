-- Fix Security Definer Views (detected by Supabase linter)
-- Set security_invoker = true so views use the permissions of the querying user

ALTER VIEW IF EXISTS public.vw_fluxo_caixa_real SET (security_invoker = true);
ALTER VIEW IF EXISTS public.vw_custo_por_centro SET (security_invoker = true);

-- Fix critical functions without search_path (SECURITY DEFINER functions only)
-- These are the most dangerous as they can be exploited via schema poisoning

CREATE OR REPLACE FUNCTION public.user_autocomplete_upsert(
  p_user_id uuid,
  p_field_type text,
  p_value text,
  p_display_label text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_autocomplete_history (user_id, field_type, value, display_label, use_count, last_used_at)
  VALUES (p_user_id, p_field_type, p_value, p_display_label, 1, NOW())
  ON CONFLICT (user_id, field_type, value)
  DO UPDATE SET
    use_count = public.user_autocomplete_history.use_count + 1,
    last_used_at = NOW(),
    display_label = COALESCE(p_display_label, public.user_autocomplete_history.display_label);
END;
$$;