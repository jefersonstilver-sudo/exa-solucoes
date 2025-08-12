-- Secure leads_produtora submissions without breaking public form
-- 1) Remove public insert policy and restrict direct table inserts
DROP POLICY IF EXISTS "Qualquer um pode inserir leads" ON public.leads_produtora;

-- Optional: allow admins to insert directly if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'leads_produtora' AND policyname = 'Apenas admins podem inserir leads'
  ) THEN
    CREATE POLICY "Apenas admins podem inserir leads"
    ON public.leads_produtora
    FOR INSERT
    WITH CHECK (is_admin_user());
  END IF;
END $$;

-- 2) Create a SECURITY DEFINER RPC to accept validated public submissions
CREATE OR REPLACE FUNCTION public.submit_lead_produtora(
  p_nome text,
  p_email text,
  p_whatsapp text,
  p_empresa text DEFAULT NULL,
  p_tipo_video text DEFAULT NULL,
  p_objetivo text DEFAULT NULL,
  p_agendar_cafe boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_count integer;
  v_id uuid;
  v_nome text := trim(coalesce(p_nome, ''));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_whatsapp text := regexp_replace(coalesce(p_whatsapp, ''), '\\D', '', 'g');
  v_empresa text := nullif(trim(coalesce(p_empresa, '')), '');
  v_tipo_video text := nullif(trim(coalesce(p_tipo_video, '')), '');
  v_objetivo text := nullif(trim(coalesce(p_objetivo, '')), '');
BEGIN
  -- Basic validation
  IF length(v_nome) < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_name');
  END IF;
  IF position('@' in v_email) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_email');
  END IF;
  IF length(v_whatsapp) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_whatsapp');
  END IF;

  -- Simple anti-spam: limit to 3 submissions per hour per email/whatsapp
  SELECT COUNT(*) INTO v_count
  FROM public.leads_produtora
  WHERE created_at > now() - interval '1 hour'
    AND (email = v_email OR whatsapp = v_whatsapp);

  IF v_count >= 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'rate_limited');
  END IF;

  -- Insert lead
  INSERT INTO public.leads_produtora (
    nome, email, whatsapp, empresa, tipo_video, objetivo, agendar_cafe
  ) VALUES (
    v_nome, v_email, v_whatsapp, v_empresa, v_tipo_video, v_objetivo, coalesce(p_agendar_cafe, false)
  ) RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$function$;

-- 3) Allow calling the RPC from both anon and authenticated contexts (front-end form)
GRANT EXECUTE ON FUNCTION public.submit_lead_produtora(text, text, text, text, text, text, boolean)
TO anon, authenticated;