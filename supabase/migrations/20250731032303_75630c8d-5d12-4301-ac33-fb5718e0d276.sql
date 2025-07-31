-- Continue fixing remaining database functions with search path protection
-- Batch 3: Complete remaining critical functions

-- Fix function: get_paid_orders_without_video
CREATE OR REPLACE FUNCTION public.get_paid_orders_without_video()
 RETURNS TABLE(id uuid, created_at timestamp with time zone, valor_total numeric, lista_paineis text[], plano_meses integer, client_id uuid, client_email text, client_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.created_at,
    p.valor_total,
    p.lista_paineis,
    p.plano_meses,
    p.client_id,
    COALESCE(au.email, 'Email não encontrado') as client_email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Nome não disponível') as client_name
  FROM public.pedidos p
  LEFT JOIN auth.users au ON au.id = p.client_id
  WHERE p.status = 'pago_pendente_video'
  AND NOT EXISTS (
    SELECT 1 FROM public.pedido_videos pv WHERE pv.pedido_id = p.id
  )
  ORDER BY p.created_at DESC;
END;
$function$;

-- Fix function: get_panels_by_location
CREATE OR REPLACE FUNCTION public.get_panels_by_location(lat double precision, lng double precision, radius_meters double precision)
 RETURNS TABLE(id uuid, code text, building_id uuid, status text, ultima_sync timestamp with time zone, resolucao text, modo text, buildings jsonb)
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.code,
    p.building_id,
    p.status,
    p.ultima_sync,
    p.resolucao,
    p.modo,
    row_to_json(b.*)::jsonb AS buildings
  FROM 
    painels p
  JOIN 
    buildings b ON b.id = p.building_id
  WHERE 
    ST_DistanceSphere(
      ST_MakePoint(b.longitude, b.latitude),
      ST_MakePoint(lng, lat)
    ) <= radius_meters
    AND p.status IN ('online', 'offline', 'maintenance');
END;
$function$;

-- Fix function: get_monthly_comparison
CREATE OR REPLACE FUNCTION public.get_monthly_comparison(p_year integer, p_month integer)
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  WITH current_month AS (
    SELECT 
      (SELECT COUNT(*) FROM public.users 
       WHERE EXTRACT(YEAR FROM data_criacao) = p_year 
       AND EXTRACT(MONTH FROM data_criacao) = p_month) as total_users,
      (SELECT COUNT(*) FROM public.pedidos 
       WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado')
       AND EXTRACT(YEAR FROM created_at) = p_year 
       AND EXTRACT(MONTH FROM created_at) = p_month) as total_buildings,
      (SELECT COUNT(*) FROM public.pedidos 
       WHERE EXTRACT(YEAR FROM created_at) = p_year 
       AND EXTRACT(MONTH FROM created_at) = p_month) as total_orders,
      (SELECT COALESCE(SUM(valor_total), 0) FROM public.pedidos 
       WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado')
       AND EXTRACT(YEAR FROM created_at) = p_year 
       AND EXTRACT(MONTH FROM created_at) = p_month) as monthly_revenue
  ),
  previous_month AS (
    SELECT 
      (SELECT COUNT(*) FROM public.users 
       WHERE EXTRACT(YEAR FROM data_criacao) = CASE 
         WHEN p_month = 1 THEN p_year - 1 
         ELSE p_year 
       END
       AND EXTRACT(MONTH FROM data_criacao) = CASE 
         WHEN p_month = 1 THEN 12 
         ELSE p_month - 1 
       END) as total_users,
      (SELECT COUNT(*) FROM public.pedidos 
       WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado')
       AND EXTRACT(YEAR FROM created_at) = CASE 
         WHEN p_month = 1 THEN p_year - 1 
         ELSE p_year 
       END
       AND EXTRACT(MONTH FROM created_at) = CASE 
         WHEN p_month = 1 THEN 12 
         ELSE p_month - 1 
       END) as total_buildings,
      (SELECT COUNT(*) FROM public.pedidos 
       WHERE EXTRACT(YEAR FROM created_at) = CASE 
         WHEN p_month = 1 THEN p_year - 1 
         ELSE p_year 
       END
       AND EXTRACT(MONTH FROM created_at) = CASE 
         WHEN p_month = 1 THEN 12 
         ELSE p_month - 1 
       END) as total_orders,
      (SELECT COALESCE(SUM(valor_total), 0) FROM public.pedidos 
       WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado')
       AND EXTRACT(YEAR FROM created_at) = CASE 
         WHEN p_month = 1 THEN p_year - 1 
         ELSE p_year 
       END
       AND EXTRACT(MONTH FROM created_at) = CASE 
         WHEN p_month = 1 THEN 12 
         ELSE p_month - 1 
       END) as monthly_revenue
  )
  SELECT json_build_object(
    'current', json_build_object(
      'total_users', c.total_users,
      'total_buildings', c.total_buildings,
      'total_orders', c.total_orders,
      'monthly_revenue', c.monthly_revenue
    ),
    'previous', json_build_object(
      'total_users', p.total_users,
      'total_buildings', p.total_buildings,
      'total_orders', p.total_orders,
      'monthly_revenue', p.monthly_revenue
    )
  )
  FROM current_month c, previous_month p;
$function$;

-- Fix function: get_last_12_months_stats
CREATE OR REPLACE FUNCTION public.get_last_12_months_stats()
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  WITH monthly_data AS (
    SELECT 
      DATE_TRUNC('month', created_at) as month_date,
      EXTRACT(YEAR FROM created_at) as year,
      EXTRACT(MONTH FROM created_at) as month,
      COUNT(*) as total_orders,
      COALESCE(SUM(CASE WHEN status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado') THEN valor_total ELSE 0 END), 0) as monthly_revenue,
      COUNT(*) FILTER (WHERE status IN ('ativo', 'video_aprovado')) as active_orders,
      COUNT(*) FILTER (WHERE status IN ('pendente', 'pago_pendente_video')) as pending_orders
    FROM public.pedidos 
    WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
    GROUP BY DATE_TRUNC('month', created_at), EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
    ORDER BY month_date DESC
  ),
  user_data AS (
    SELECT 
      DATE_TRUNC('month', data_criacao) as month_date,
      COUNT(*) as total_users,
      SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', data_criacao) ROWS UNBOUNDED PRECEDING) as total_users_accumulated
    FROM public.users 
    WHERE data_criacao >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
    GROUP BY DATE_TRUNC('month', data_criacao)
  ),
  building_data AS (
    SELECT 
      DATE_TRUNC('month', created_at) as month_date,
      COUNT(*) as total_buildings,
      SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at) ROWS UNBOUNDED PRECEDING) as total_buildings_accumulated
    FROM public.buildings 
    WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
    GROUP BY DATE_TRUNC('month', created_at)
  ),
  panel_data AS (
    SELECT 
      DATE_TRUNC('month', created_at) as month_date,
      COUNT(*) as total_panels,
      SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at) ROWS UNBOUNDED PRECEDING) as total_panels_accumulated,
      COUNT(*) FILTER (WHERE status = 'online') as online_panels
    FROM public.painels 
    WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
    GROUP BY DATE_TRUNC('month', created_at)
  )
  SELECT json_build_object(
    'months', COALESCE(json_agg(
      json_build_object(
        'month_year', TO_CHAR(md.month_date, 'YYYY-MM'),
        'total_orders', COALESCE(md.total_orders, 0),
        'monthly_revenue', COALESCE(md.monthly_revenue, 0),
        'active_orders', COALESCE(md.active_orders, 0),
        'pending_orders', COALESCE(md.pending_orders, 0),
        'total_users', COALESCE(ud.total_users, 0),
        'total_users_accumulated', COALESCE(ud.total_users_accumulated, 0),
        'total_buildings', COALESCE(bd.total_buildings, 0),
        'total_buildings_accumulated', COALESCE(bd.total_buildings_accumulated, 0),
        'total_panels', COALESCE(pd.total_panels, 0),
        'total_panels_accumulated', COALESCE(pd.total_panels_accumulated, 0),
        'online_panels', COALESCE(pd.online_panels, 0)
      ) ORDER BY md.month_date DESC
    ), '[]'::json)
  )
  FROM monthly_data md
  FULL OUTER JOIN user_data ud ON md.month_date = ud.month_date
  FULL OUTER JOIN building_data bd ON md.month_date = bd.month_date
  FULL OUTER JOIN panel_data pd ON md.month_date = pd.month_date;
$function$;

-- Fix function: get_pending_approval_videos
CREATE OR REPLACE FUNCTION public.get_pending_approval_videos()
 RETURNS TABLE(id uuid, pedido_id uuid, video_id uuid, slot_position integer, created_at timestamp with time zone, client_email text, client_name text, pedido_valor numeric, video_nome text, video_url text, video_duracao integer, video_orientacao text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pv.id,
    pv.pedido_id,
    pv.video_id,
    pv.slot_position,
    pv.created_at,
    COALESCE(au.email, 'Email não encontrado') as client_email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Nome não disponível') as client_name,
    p.valor_total as pedido_valor,
    v.nome as video_nome,
    v.url as video_url,
    v.duracao as video_duracao,
    v.orientacao as video_orientacao
  FROM public.pedido_videos pv
  JOIN public.pedidos p ON p.id = pv.pedido_id
  JOIN public.videos v ON v.id = pv.video_id
  LEFT JOIN auth.users au ON au.id = p.client_id
  WHERE pv.approval_status = 'pending'
  ORDER BY pv.created_at DESC;
END;
$function$;

-- Fix function: mercadopago_reconciliation_check
CREATE OR REPLACE FUNCTION public.mercadopago_reconciliation_check()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

-- Fix function: log_building_action
CREATE OR REPLACE FUNCTION public.log_building_action(p_building_id uuid, p_action_type text, p_description text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

-- Fix function: get_unread_notifications_count
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.notifications 
    WHERE user_id = auth.uid() 
    AND is_read = false
  );
END;
$function$;