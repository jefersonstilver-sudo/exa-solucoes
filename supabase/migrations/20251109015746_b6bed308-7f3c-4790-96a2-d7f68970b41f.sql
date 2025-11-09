
-- DROP da função antiga
DROP FUNCTION IF EXISTS public.get_pedidos_com_status_correto();

-- Recriar função corrigida incluindo admin_financeiro e novos campos
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
  correct_status text,
  cupom_id uuid,
  coupon_code text,
  client_phone text,
  client_cpf text
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
    COALESCE(u.nome, p.nome_pedido) as client_name,
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
      WHEN p.status = 'pago' AND (SELECT COUNT(*) FROM pedido_videos pv WHERE pv.pedido_id = p.id AND pv.approval_status = 'approved' AND pv.is_active = true) = 0 
        THEN 'pago_pendente_video'
      WHEN p.status = 'pago' AND (SELECT COUNT(*) FROM pedido_videos pv WHERE pv.pedido_id = p.id AND pv.approval_status = 'approved' AND pv.is_active = true) > 0 
        THEN 'ativo'
      ELSE p.status
    END as correct_status,
    p.cupom_id,
    c.codigo as coupon_code,
    u.telefone as client_phone,
    u.cpf as client_cpf
  FROM public.pedidos p
  LEFT JOIN public.users u ON u.id = p.client_id
  LEFT JOIN public.cupons c ON c.id = p.cupom_id
  WHERE EXISTS (
    SELECT 1 FROM public.users admin 
    WHERE admin.id = auth.uid() 
    AND admin.role IN ('admin', 'super_admin', 'admin_financeiro', 'admin_marketing')
  )
  ORDER BY p.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_pedidos_com_status_correto() IS 'Retorna pedidos com status correto calculado baseado em vídeos. Acessível por admin, super_admin, admin_financeiro e admin_marketing.';
