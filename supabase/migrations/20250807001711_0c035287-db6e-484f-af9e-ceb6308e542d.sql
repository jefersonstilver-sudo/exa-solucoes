-- Corrigir função get_paid_orders_without_video com cast explícito para text
CREATE OR REPLACE FUNCTION public.get_paid_orders_without_video()
 RETURNS TABLE(id uuid, created_at timestamp with time zone, valor_total numeric, lista_paineis text[], plano_meses integer, client_id uuid, client_email text, client_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
    COALESCE(au.email, 'Email não encontrado')::text as client_email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Nome não disponível')::text as client_name
  FROM public.pedidos p
  LEFT JOIN auth.users au ON au.id = p.client_id
  WHERE p.status = 'pago_pendente_video'
  AND NOT EXISTS (
    SELECT 1 FROM public.pedido_videos pv WHERE pv.pedido_id = p.id
  )
  ORDER BY p.created_at DESC;
END;
$function$