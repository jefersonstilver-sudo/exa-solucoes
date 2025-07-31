-- Final batch: Complete all remaining database functions with search path protection

-- Fix remaining functions with missing search paths

-- Fix notify_contracts_expiring_soon
CREATE OR REPLACE FUNCTION public.notify_contracts_expiring_soon()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  v_pedido RECORD;
  v_admin_user_id UUID;
  v_notifications_sent integer := 0;
BEGIN
  -- Buscar contratos expirando em 7 dias ou menos
  FOR v_pedido IN 
    SELECT p.id, p.client_id, p.data_fim, p.valor_total,
           au.email as client_email
    FROM public.pedidos p
    LEFT JOIN auth.users au ON au.id = p.client_id
    WHERE p.data_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    AND p.status IN ('pago', 'pago_pendente_video', 'video_aprovado', 'ativo')
  LOOP
    -- Notificar o cliente
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      v_pedido.client_id,
      'contract_expiring',
      'Contrato Expirando em Breve',
      'Seu contrato expira em ' || (v_pedido.data_fim - CURRENT_DATE) || ' dias. Renove para manter sua campanha ativa.',
      jsonb_build_object(
        'pedido_id', v_pedido.id,
        'days_remaining', v_pedido.data_fim - CURRENT_DATE,
        'expiry_date', v_pedido.data_fim
      )
    );
    
    -- Notificar todos os admins
    FOR v_admin_user_id IN 
      SELECT u.id FROM public.users u 
      WHERE u.role IN ('admin', 'super_admin')
    LOOP
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        metadata
      ) VALUES (
        v_admin_user_id,
        'contract_expiring_admin',
        'Contrato de Cliente Expirando',
        'Contrato do cliente ' || COALESCE(v_pedido.client_email, 'Email não disponível') || ' expira em ' || (v_pedido.data_fim - CURRENT_DATE) || ' dias.',
        jsonb_build_object(
          'pedido_id', v_pedido.id,
          'client_id', v_pedido.client_id,
          'client_email', v_pedido.client_email,
          'days_remaining', v_pedido.data_fim - CURRENT_DATE,
          'valor_total', v_pedido.valor_total
        )
      );
    END LOOP;
    
    v_notifications_sent := v_notifications_sent + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'contracts_notified', v_notifications_sent,
    'message', format('%s contratos próximos da expiração notificados', v_notifications_sent)
  );
END;
$function$;

-- Fix get_real_approval_stats
CREATE OR REPLACE FUNCTION public.get_real_approval_stats()
 RETURNS TABLE(paid_without_video bigint, pending_approval bigint, approved bigint, rejected bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT 
    (SELECT COUNT(*) FROM public.pedidos WHERE status = 'pago_pendente_video'),
    (SELECT COUNT(*) FROM public.pedido_videos WHERE approval_status = 'pending'),
    (SELECT COUNT(*) FROM public.pedido_videos WHERE approval_status = 'approved'),
    (SELECT COUNT(*) FROM public.pedido_videos WHERE approval_status = 'rejected');
$function$;

-- Fix get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN (
    SELECT raw_user_meta_data ->> 'role'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$function$;

-- Fix get_real_revenue
CREATE OR REPLACE FUNCTION public.get_real_revenue()
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT COALESCE(SUM(valor_total), 0)
  FROM public.pedidos 
  WHERE status = 'pago';
$function$;

-- Fix is_super_admin_secure
CREATE OR REPLACE FUNCTION public.is_super_admin_secure()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'jefersonstilver@gmail.com'
    AND raw_user_meta_data->>'role' = 'super_admin'
  );
$function$;

-- Fix is_super_admin_simple
CREATE OR REPLACE FUNCTION public.is_super_admin_simple()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT auth.email() = 'jefersonstilver@gmail.com';
$function$;

-- Fix mark_notification_read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  UPDATE public.notifications 
  SET 
    is_read = true,
    read_at = now()
  WHERE id = notification_id 
  AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$function$;

-- Fix is_admin_user
CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
$function$;

-- Fix increment_cupom_uso
CREATE OR REPLACE FUNCTION public.increment_cupom_uso()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  UPDATE public.cupons
  SET usos_atuais = usos_atuais + 1
  WHERE id = NEW.cupom_id;
  
  RETURN NEW;
END;
$function$;

-- Fix is_super_admin_user
CREATE OR REPLACE FUNCTION public.is_super_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND email = 'jefersonstilver@gmail.com' 
    AND role = 'super_admin'
  );
$function$;

-- Fix is_emergency_mode
CREATE OR REPLACE FUNCTION public.is_emergency_mode()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT modo_emergencia FROM public.configuracoes_sistema LIMIT 1;
$function$;

-- Fix is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND email = 'jefersonstilver@gmail.com' 
    AND role = 'super_admin'
  );
$function$;

-- Fix select_video_for_display
CREATE OR REPLACE FUNCTION public.select_video_for_display(p_pedido_video_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  v_pedido_id uuid;
  v_approval_status text;
BEGIN
  -- Verificar se o vídeo existe e obter dados necessários
  SELECT pedido_id, approval_status 
  INTO v_pedido_id, v_approval_status
  FROM public.pedido_videos 
  WHERE id = p_pedido_video_id;
  
  -- Verificar se o vídeo foi encontrado
  IF v_pedido_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- VALIDAÇÃO CRÍTICA: Apenas vídeos aprovados podem ser selecionados
  IF v_approval_status != 'approved' THEN
    RETURN FALSE;
  END IF;
  
  -- Desmarcar todos os vídeos do pedido (permitindo troca)
  UPDATE public.pedido_videos 
  SET selected_for_display = false, updated_at = now()
  WHERE pedido_id = v_pedido_id;
  
  -- Marcar o vídeo selecionado como ativo para exibição
  UPDATE public.pedido_videos 
  SET selected_for_display = true, updated_at = now()
  WHERE id = p_pedido_video_id;
  
  RETURN FOUND;
END;
$function$;