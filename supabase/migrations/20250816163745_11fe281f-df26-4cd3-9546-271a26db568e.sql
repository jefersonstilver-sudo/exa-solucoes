-- Fix get_approved_videos_with_details: use v.nome instead of v.name
CREATE OR REPLACE FUNCTION public.get_approved_videos_with_details()
RETURNS TABLE(
  pedido_video_id uuid,
  video_id uuid,
  video_name text,
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
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log access attempt for audit trail
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'APPROVED_VIDEOS_ACCESS',
    format('Super admin %s accessed approved videos list', auth.uid())
  );

  -- Only super_admins can access this function
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only super admins can access approved videos details';
  END IF;

  RETURN QUERY
  SELECT 
    pv.id as pedido_video_id,
    pv.video_id,
    v.nome as video_name, -- fixed column name
    pv.slot_position,
    pv.approved_at,
    p.id as pedido_id,
    p.client_id,
    COALESCE(client_users.email, 'Email não encontrado') as client_email,
    COALESCE(client_users.raw_user_meta_data->>'name', 'Nome não encontrado') as client_name,
    p.valor_total,
    p.lista_paineis,
    p.plano_meses,
    p.data_inicio,
    p.data_fim,
    pv.approved_by,
    COALESCE(admin_users.email, 'Admin não encontrado') as approver_email,
    COALESCE(admin_users.raw_user_meta_data->>'name', 'Admin não encontrado') as approver_name,
    pv.created_at
  FROM public.pedido_videos pv
  JOIN public.videos v ON v.id = pv.video_id
  JOIN public.pedidos p ON p.id = pv.pedido_id
  LEFT JOIN auth.users client_users ON client_users.id = p.client_id
  LEFT JOIN auth.users admin_users ON admin_users.id = pv.approved_by
  WHERE pv.approval_status = 'approved'
    AND pv.approved_at IS NOT NULL
  ORDER BY pv.approved_at DESC
  LIMIT 50; -- Limit for performance
END;
$function$;