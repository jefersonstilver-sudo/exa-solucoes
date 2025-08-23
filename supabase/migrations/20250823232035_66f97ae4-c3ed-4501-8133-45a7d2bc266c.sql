-- Corrigir função para classificar pedidos com base em vídeos ativos, não apenas contagem total
CREATE OR REPLACE FUNCTION public.get_pedidos_com_status_correto()
RETURNS TABLE(
  id uuid,
  created_at timestamp with time zone,
  status text,
  valor_total numeric,
  lista_paineis text[],
  plano_meses integer,
  data_inicio date,
  data_fim date,
  client_id uuid,
  client_email text,
  client_name text,
  video_status text,
  video_count integer,
  correct_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.created_at,
    p.status,
    p.valor_total,
    p.lista_paineis,
    p.plano_meses,
    p.data_inicio,
    p.data_fim,
    p.client_id,
    COALESCE(u.email, p.email) as client_email,
    COALESCE(u.email, p.email) as client_name,
    CASE 
      WHEN p.status = 'pago' AND (SELECT COUNT(*) FROM pedido_videos pv WHERE pv.pedido_id = p.id AND pv.approval_status = 'approved' AND pv.is_active = true) = 0 
        THEN 'Aguardando Vídeo'
      WHEN p.status = 'video_enviado' THEN 'Vídeo Enviado'
      WHEN p.status = 'video_aprovado' THEN 'Vídeo Aprovado'
      WHEN p.status = 'video_rejeitado' THEN 'Vídeo Rejeitado'
      WHEN p.status = 'ativo' THEN 'Ativo'
      ELSE p.status
    END as video_status,
    (SELECT COUNT(*)::integer FROM pedido_videos pv WHERE pv.pedido_id = p.id) as video_count,
    CASE 
      -- Pedidos pagos SEM vídeos ativos/aprovados = pago_pendente_video
      WHEN p.status = 'pago' AND (SELECT COUNT(*) FROM pedido_videos pv WHERE pv.pedido_id = p.id AND pv.approval_status = 'approved' AND pv.is_active = true) = 0 
        THEN 'pago_pendente_video'
      -- Pedidos pagos COM vídeos ativos/aprovados = ativo
      WHEN p.status = 'pago' AND (SELECT COUNT(*) FROM pedido_videos pv WHERE pv.pedido_id = p.id AND pv.approval_status = 'approved' AND pv.is_active = true) > 0 
        THEN 'ativo'
      -- Outros status permanecem iguais
      ELSE p.status
    END as correct_status
  FROM public.pedidos p
  LEFT JOIN public.users u ON u.id = p.client_id
  WHERE EXISTS (
    SELECT 1 FROM public.users admin 
    WHERE admin.id = auth.uid() 
    AND admin.role IN ('admin', 'super_admin')
  )
  ORDER BY p.created_at DESC;
END;
$$;