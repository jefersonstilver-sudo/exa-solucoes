-- Pedidos vendidos pela Sofia ficam em 'aguardando_video' depois do contrato assinado (pagos, esperando o video).
-- O gatilho de pedido_videos so aceitava 'pago', 'pago_pendente_video', 'video_aprovado', 'ativo',
-- entao o video aprovado pelo cliente no WhatsApp nao conseguia ser ligado ao pedido.
create or replace function public.validate_video_upload_permission(p_pedido_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_pedido_status text;
begin
  select status into v_pedido_status from public.pedidos where id = p_pedido_id;
  if v_pedido_status is null then
    return false;
  end if;
  -- somente pedidos pagos (inclui os estados de espera de video)
  return v_pedido_status in ('pago', 'pago_pendente_video', 'aguardando_video', 'video_enviado', 'video_aprovado', 'ativo');
end;
$function$;
