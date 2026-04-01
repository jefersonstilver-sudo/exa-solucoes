DROP FUNCTION IF EXISTS public.get_approved_videos_by_period(date, date);

CREATE OR REPLACE FUNCTION public.get_approved_videos_by_period(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE(
  pedido_video_id uuid,
  video_id uuid,
  video_name text,
  video_url text,
  slot_position integer,
  approved_at timestamp with time zone,
  pedido_id uuid,
  client_id uuid,
  client_email text,
  client_name text,
  valor_total numeric,
  lista_paineis text[],
  plano_meses integer,
  data_inicio date,
  data_fim date,
  approved_by uuid,
  approver_email text,
  approver_name text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role text;
BEGIN
  SELECT role INTO v_user_role FROM public.users WHERE id = auth.uid();
  IF v_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: Only super admins can access approved videos';
  END IF;
  IF p_start_date IS NULL AND p_end_date IS NULL THEN
    p_start_date := CURRENT_DATE - INTERVAL '30 days';
    p_end_date := CURRENT_DATE;
  END IF;
  IF p_start_date IS NOT NULL AND p_end_date IS NULL THEN
    p_end_date := CURRENT_DATE;
  END IF;
  IF p_start_date IS NULL AND p_end_date IS NOT NULL THEN
    p_start_date := p_end_date - INTERVAL '30 days';
  END IF;
  RETURN QUERY
  SELECT 
    pv.id as pedido_video_id, pv.video_id,
    COALESCE(v.nome, 'Vídeo sem nome'::text) as video_name,
    v.url as video_url,
    pv.slot_position, pv.approved_at, pv.pedido_id, p.client_id,
    u_client.email as client_email,
    COALESCE(u_client.email, 'Cliente não encontrado'::text) as client_name,
    p.valor_total, p.lista_paineis, p.plano_meses, p.data_inicio, p.data_fim,
    pv.approved_by, u_approver.email as approver_email,
    COALESCE(u_approver.email, 'Aprovador não encontrado'::text) as approver_name,
    pv.created_at
  FROM public.pedido_videos pv
  JOIN public.pedidos p ON p.id = pv.pedido_id
  LEFT JOIN public.videos v ON v.id = pv.video_id
  LEFT JOIN public.users u_client ON u_client.id = p.client_id
  LEFT JOIN public.users u_approver ON u_approver.id = pv.approved_by
  WHERE pv.approval_status = 'approved'
    AND pv.approved_at IS NOT NULL
    AND DATE(pv.approved_at) BETWEEN p_start_date AND p_end_date
  ORDER BY pv.approved_at DESC;
END;
$$;