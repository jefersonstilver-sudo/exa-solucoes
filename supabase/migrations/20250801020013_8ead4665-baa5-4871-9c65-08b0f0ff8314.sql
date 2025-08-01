-- Continue fixing search_path for all remaining database functions
CREATE OR REPLACE FUNCTION public.mercadopago_reconciliation_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_supabase_total numeric;
  v_webhook_transactions integer;
  v_missing_transactions integer;
  v_lost_revenue numeric := 0;
  v_result jsonb;
  v_transaction RECORD;
BEGIN
  -- Calculate today's totals in Supabase
  SELECT COALESCE(SUM(valor_total), 0) INTO v_supabase_total
  FROM public.pedidos
  WHERE DATE(created_at) = CURRENT_DATE
  AND status IN ('pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado');
  
  -- Count webhook transactions received today
  SELECT COUNT(*) INTO v_webhook_transactions
  FROM public.webhook_logs
  WHERE DATE(created_at) = CURRENT_DATE
  AND origem LIKE '%mercadopago%'
  AND status = 'success';
  
  -- Identify potential missing transactions (webhooks without corresponding pedidos)
  SELECT COUNT(*) INTO v_missing_transactions
  FROM public.webhook_logs w
  WHERE DATE(w.created_at) = CURRENT_DATE
  AND w.origem LIKE '%mercadopago%'
  AND w.status = 'success'
  AND NOT EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE DATE(p.created_at) = DATE(w.created_at)
    AND p.status IN ('pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado')
  );
  
  v_result := jsonb_build_object(
    'reconciliation_date', CURRENT_DATE,
    'supabase_total', v_supabase_total,
    'webhook_transactions', v_webhook_transactions,
    'missing_transactions', v_missing_transactions,
    'lost_revenue_estimate', v_lost_revenue,
    'discrepancy_detected', v_missing_transactions > 0,
    'reconciliation_status', CASE 
      WHEN v_missing_transactions = 0 THEN 'RECONCILED'
      WHEN v_missing_transactions <= 2 THEN 'MINOR_DISCREPANCY'
      ELSE 'MAJOR_DISCREPANCY'
    END,
    'timestamp', now()
  );
  
  -- Log reconciliation check
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'MERCADOPAGO_RECONCILIATION_CHECK',
    format('Reconciliation check completed: %s', v_result::text)
  );
  
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_building_action(p_building_id uuid, p_action_type text, p_description text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.building_action_logs (
    building_id,
    user_id,
    action_type,
    action_description,
    old_values,
    new_values
  ) VALUES (
    p_building_id,
    auth.uid(),
    p_action_type,
    p_description,
    p_old_values,
    p_new_values
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_unread_notifications_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.notifications 
    WHERE user_id = auth.uid() 
    AND is_read = false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_approvals_stats()
RETURNS TABLE(pago_pendente_video bigint, video_enviado bigint, video_aprovado bigint, video_rejeitado bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.pedidos WHERE status = 'pago_pendente_video'),
    (SELECT COUNT(*) FROM public.pedidos WHERE status = 'video_enviado'),
    (SELECT COUNT(*) FROM public.pedidos WHERE status = 'video_aprovado'),
    (SELECT COUNT(*) FROM public.pedidos WHERE status = 'video_rejeitado');
$$;

CREATE OR REPLACE FUNCTION public.approve_video(p_pedido_video_id uuid, p_approved_by uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;