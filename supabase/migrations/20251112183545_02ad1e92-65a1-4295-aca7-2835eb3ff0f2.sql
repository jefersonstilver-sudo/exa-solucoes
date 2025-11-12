-- Corrigir get_pedidos_com_clientes para buscar o nome correto
DROP FUNCTION IF EXISTS public.get_pedidos_com_clientes();

CREATE FUNCTION public.get_pedidos_com_clientes()
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
  cupom_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    COALESCE(au.email::text, 'Email não encontrado')::text as client_email,
    -- CORREÇÃO: Buscar 'name' ao invés de 'full_name'
    COALESCE((au.raw_user_meta_data->>'name')::text, 
             COALESCE(au.email::text, 'Nome não disponível')::text)::text as client_name,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.pedido_videos pv 
        WHERE pv.pedido_id = p.id 
        AND pv.approval_status = 'approved'
        AND pv.selected_for_display = true
      ) THEN 'video_ativo'::text
      WHEN EXISTS (
        SELECT 1 FROM public.pedido_videos pv 
        WHERE pv.pedido_id = p.id 
        AND pv.approval_status = 'approved'
      ) THEN 'video_aprovado'::text
      WHEN EXISTS (
        SELECT 1 FROM public.pedido_videos pv 
        WHERE pv.pedido_id = p.id 
        AND pv.approval_status = 'pending'
      ) THEN 'video_enviado'::text
      WHEN EXISTS (
        SELECT 1 FROM public.pedido_videos pv 
        WHERE pv.pedido_id = p.id 
        AND pv.approval_status = 'rejected'
      ) THEN 'video_rejeitado'::text
      ELSE 'sem_video'::text
    END::text as video_status,
    p.cupom_id
  FROM public.pedidos p
  LEFT JOIN auth.users au ON au.id = p.client_id
  ORDER BY p.created_at DESC;
END;
$$;