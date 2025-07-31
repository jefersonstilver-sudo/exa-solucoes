-- CRITICAL SECURITY FIX: Add search path protection to all database functions
-- This prevents SQL injection through search path manipulation

-- Fix function: admin_insert_user
CREATE OR REPLACE FUNCTION public.admin_insert_user(user_id uuid, user_email text, user_role text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  inserted_id UUID;
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (user_id, user_email, user_role)
  RETURNING id INTO inserted_id;
  
  RETURN inserted_id;
END;
$function$;

-- Fix function: get_approvals_stats
CREATE OR REPLACE FUNCTION public.get_approvals_stats()
 RETURNS TABLE(pago_pendente_video bigint, video_enviado bigint, video_aprovado bigint, video_rejeitado bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT 
    (SELECT COUNT(*) FROM public.pedidos WHERE status = 'pago_pendente_video'),
    (SELECT COUNT(*) FROM public.pedidos WHERE status = 'video_enviado'),
    (SELECT COUNT(*) FROM public.pedidos WHERE status = 'video_aprovado'),
    (SELECT COUNT(*) FROM public.pedidos WHERE status = 'video_rejeitado');
$function$;

-- Fix function: approve_video
CREATE OR REPLACE FUNCTION public.approve_video(p_pedido_video_id uuid, p_approved_by uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  UPDATE public.pedido_videos 
  SET 
    approval_status = 'approved',
    approved_by = p_approved_by,
    approved_at = now(),
    updated_at = now()
  WHERE id = p_pedido_video_id
  AND approval_status = 'pending';
  
  RETURN FOUND;
END;
$function$;

-- Fix function: generate_coupon_code
CREATE OR REPLACE FUNCTION public.generate_coupon_code(prefix text DEFAULT 'INDEXA'::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN := TRUE;
BEGIN
  WHILE code_exists LOOP
    -- Gerar código com prefixo + 4 dígitos aleatórios
    new_code := prefix || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Verificar se o código já existe
    SELECT EXISTS(SELECT 1 FROM public.cupons WHERE codigo = new_code) INTO code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$function$;

-- Fix function: admin_check_user_exists
CREATE OR REPLACE FUNCTION public.admin_check_user_exists(user_email text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE email = user_email
  );
$function$;

-- Fix function: activate_video
CREATE OR REPLACE FUNCTION public.activate_video(p_pedido_id uuid, p_pedido_video_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Verificar se o vídeo está aprovado
  IF NOT EXISTS (
    SELECT 1 FROM public.pedido_videos 
    WHERE id = p_pedido_video_id 
    AND pedido_id = p_pedido_id 
    AND approval_status = 'approved'
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Desativar todos os vídeos do pedido
  UPDATE public.pedido_videos 
  SET is_active = false, updated_at = now()
  WHERE pedido_id = p_pedido_id;
  
  -- Ativar o vídeo selecionado
  UPDATE public.pedido_videos 
  SET is_active = true, updated_at = now()
  WHERE id = p_pedido_video_id;
  
  RETURN TRUE;
END;
$function$;

-- Fix function: admin_get_all_user_ids
CREATE OR REPLACE FUNCTION public.admin_get_all_user_ids()
 RETURNS uuid[]
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT array_agg(id) FROM public.users;
$function$;

-- Fix function: can_access_order
CREATE OR REPLACE FUNCTION public.can_access_order(p_pedido_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  v_pedido RECORD;
  v_user_id UUID;
BEGIN
  -- Obter ID do usuário atual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Buscar pedido
  SELECT * INTO v_pedido 
  FROM public.pedidos 
  WHERE id = p_pedido_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verificar se é o dono do pedido
  IF v_pedido.client_id != v_user_id THEN
    -- Verificar se é admin
    IF NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = v_user_id 
      AND role IN ('admin', 'super_admin')
    ) THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Verificar status do pedido
  IF v_pedido.status IN ('cancelado_automaticamente', 'cancelado') THEN
    RETURN false;
  END IF;
  
  -- Para pedidos pendentes, verificar se não expirou
  IF v_pedido.status = 'pendente' AND v_pedido.created_at < NOW() - INTERVAL '24 hours' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

-- Fix function: auto_recovery_system
CREATE OR REPLACE FUNCTION public.auto_recovery_system()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  cleanup_result jsonb;
  health_check jsonb;
  recovery_steps text[] := '{}';
  result jsonb;
BEGIN
  -- Passo 1: Limpeza de órfãos
  SELECT cleanup_orphaned_users() INTO cleanup_result;
  recovery_steps := array_append(recovery_steps, 
    format('Limpeza de órfãos: %s', cleanup_result->>'message'));
  
  -- Passo 2: Verificação de saúde pós-limpeza
  SELECT monitor_system_health() INTO health_check;
  recovery_steps := array_append(recovery_steps, 
    format('Health check: %s', health_check->>'status'));
  
  result := jsonb_build_object(
    'success', true,
    'cleanup_result', cleanup_result,
    'final_health', health_check,
    'recovery_steps', recovery_steps,
    'system_ready', (health_check->>'health_score')::integer >= 90,
    'timestamp', now()
  );
  
  -- Log da recuperação
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'AUTO_RECOVERY_COMPLETED',
    format('Recuperação automática concluída. Sistema pronto: %s', 
           CASE WHEN (health_check->>'health_score')::integer >= 90 
           THEN 'SIM' ELSE 'NÃO' END)
  );
  
  RETURN result;
END;
$function$;

-- Fix function: get_coupon_stats
CREATE OR REPLACE FUNCTION public.get_coupon_stats()
 RETURNS TABLE(total_cupons bigint, cupons_ativos bigint, cupons_expirados bigint, total_usos bigint, receita_com_desconto numeric)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT 
    COUNT(*) as total_cupons,
    COUNT(*) FILTER (WHERE ativo = true AND (expira_em IS NULL OR expira_em > NOW())) as cupons_ativos,
    COUNT(*) FILTER (WHERE expira_em IS NOT NULL AND expira_em <= NOW()) as cupons_expirados,
    COALESCE(SUM(usos_atuais), 0) as total_usos,
    COALESCE((
      SELECT SUM(p.valor_total * (c.desconto_percentual / 100.0))
      FROM public.pedidos p
      JOIN public.cupons c ON c.id = p.cupom_id
      WHERE p.cupom_id IS NOT NULL
    ), 0) as receita_com_desconto
  FROM public.cupons;
$function$;