-- Fix search_path for all remaining database functions to prevent SQL injection
CREATE OR REPLACE FUNCTION public.activate_video(p_pedido_id uuid, p_pedido_video_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.check_user_data_integrity()
RETURNS TABLE(user_id uuid, email text, users_role text, metadata_role text, is_consistent boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    users.role as users_role,
    au.raw_user_meta_data->>'role' as metadata_role,
    (users.role = au.raw_user_meta_data->>'role') as is_consistent
  FROM auth.users au
  LEFT JOIN public.users ON users.id = au.id
  WHERE au.email IS NOT NULL
  ORDER BY au.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_panel_availability(p_panel_id uuid, p_start_date date, p_end_date date)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.campanhas
    WHERE painel_id = p_panel_id
    AND status IN ('pendente', 'ativo')
    AND (
      (data_inicio <= p_end_date AND data_fim >= p_start_date)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_last_12_months_stats()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;