-- 04/11/2026: pedido só leva prédios que existem e estão ativos (ou internos da EXA) na página de Prédios.
-- Prédio inativado ou apagado sai de todos os pedidos. Removidos ficam registrados em log_eventos_sistema.
create or replace function public.exa_pedido_so_predios_validos() returns trigger language plpgsql as $f$
declare v_novo text[]; v_fora text[];
begin
  if new.lista_predios is null then return new; end if;
  select coalesce(array_agg(x order by o), '{}') into v_novo from unnest(new.lista_predios) with ordinality t(x, o)
   where exists (select 1 from buildings b where b.id::text = x and b.status in ('ativo','interno'));
  select coalesce(array_agg(x), '{}') into v_fora from unnest(new.lista_predios) x
   where not exists (select 1 from buildings b where b.id::text = x and b.status in ('ativo','interno'));
  if array_length(v_fora, 1) > 0 then
    new.lista_predios := v_novo;
    begin
      insert into log_eventos_sistema (tipo_evento, descricao) values ('PEDIDO_PREDIOS_INVALIDOS_REMOVIDOS',
        json_build_object('pedido_id', new.id, 'removidos', v_fora, 'motivo', 'predio inexistente ou inativo na pagina de Predios')::text);
    exception when others then null; end;
  end if;
  return new;
end $f$;
drop trigger if exists exa_pedido_so_predios_validos on public.pedidos;
create trigger exa_pedido_so_predios_validos before insert or update of lista_predios on public.pedidos for each row execute function public.exa_pedido_so_predios_validos();

create or replace function public.exa_predio_sai_dos_pedidos() returns trigger language plpgsql security definer set search_path = public as $f$
declare v_id text;
begin
  v_id := coalesce(old.id, new.id)::text;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and new.status not in ('ativo','interno') and old.status is distinct from new.status) then
    update pedidos set lista_predios = array_remove(lista_predios, v_id) where v_id = any(lista_predios);
  end if;
  return coalesce(new, old);
end $f$;
drop trigger if exists exa_predio_sai_dos_pedidos on public.buildings;
create trigger exa_predio_sai_dos_pedidos after update of status or delete on public.buildings for each row execute function public.exa_predio_sai_dos_pedidos();

update pedidos set lista_predios = lista_predios where exists (select 1 from unnest(lista_predios) x where not exists (select 1 from buildings b where b.id::text = x and b.status in ('ativo','interno')));
