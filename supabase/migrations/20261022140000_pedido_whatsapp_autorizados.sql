-- WhatsApps autorizados por pedido.
-- O gestor e o WhatsApp do proprio pedido (pedidos.whatsapp). Esta tabela guarda ate 2 pessoas
-- a mais que podem administrar o pedido pela Sofia, com o mesmo poder do gestor. Todo acesso
-- pelo WhatsApp exige o codigo de 6 digitos enviado ao e-mail do gestor da conta.

create table if not exists public.pedido_whatsapp_autorizados (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  telefone text not null,
  nome text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (pedido_id, telefone)
);

-- normaliza o numero (55 + DDD + numero) e limita a 2 autorizados por pedido,
-- sem repetir o WhatsApp do gestor
create or replace function public.pedido_whatsapp_autorizados_check()
returns trigger language plpgsql set search_path to 'public' as $$
declare v_total int; v_gestor text; v_d text;
begin
  -- 55 + DDD + numero (aceita com ou sem o 55 na frente)
  v_d := regexp_replace(coalesce(new.telefone, ''), '\D', '', 'g');
  new.telefone := case
    when v_d ~ '^55' and length(v_d) in (12, 13) then v_d
    when length(v_d) in (10, 11) then '55' || v_d
    else null end;
  if new.telefone is null then
    raise exception 'Telefone invalido: informe DDD + numero';
  end if;
  -- trava o pedido para dois cadastros simultaneos nao passarem do limite
  select whatsapp into v_gestor from public.pedidos where id = new.pedido_id for update;
  if v_gestor is not null and right(v_gestor, 8) = right(new.telefone, 8) then
    raise exception 'Este numero ja e o WhatsApp do gestor do pedido';
  end if;
  select count(*) into v_total from public.pedido_whatsapp_autorizados
   where pedido_id = new.pedido_id and id <> new.id;
  if v_total >= 2 then
    raise exception 'Limite de 2 WhatsApps autorizados por pedido (alem do gestor)';
  end if;
  return new;
end $$;

drop trigger if exists trg_pedido_whatsapp_autorizados_check on public.pedido_whatsapp_autorizados;
create trigger trg_pedido_whatsapp_autorizados_check
  before insert or update on public.pedido_whatsapp_autorizados
  for each row execute function public.pedido_whatsapp_autorizados_check();

alter table public.pedido_whatsapp_autorizados enable row level security;

drop policy if exists "Admins gerenciam whatsapps autorizados" on public.pedido_whatsapp_autorizados;
create policy "Admins gerenciam whatsapps autorizados" on public.pedido_whatsapp_autorizados
  for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin'::app_role) or public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'super_admin'::app_role) or public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Financeiro ve whatsapps autorizados" on public.pedido_whatsapp_autorizados;
create policy "Financeiro ve whatsapps autorizados" on public.pedido_whatsapp_autorizados
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin_financeiro'::app_role));
