-- EXA · Telas novas em Painéis EXA (31/10/2026)
-- As telas novas (exa_telas) passam a aparecer em Painéis EXA junto com os painéis dos elevadores,
-- no mesmo esquema de grupos (device_groups). Ex.: um grupo por estabelecimento.

alter table public.exa_telas add column if not exists device_group_id uuid references public.device_groups(id) on delete set null;
create index if not exists exa_telas_grupo_idx on public.exa_telas (device_group_id);
comment on column public.exa_telas.device_group_id is 'Grupo em Painéis EXA (mesmos grupos dos painéis dos elevadores)';

-- Ao ligar a tela a um local, se ela ainda não tem grupo e existe um grupo com o mesmo nome do local,
-- entra nele sozinha (ex.: grupo "Del Fuego" para as TVs do Del Fuego).
create or replace function public.exa_telas_grupo_do_local() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.building_id is not null and new.device_group_id is null
     and (tg_op = 'INSERT' or new.building_id is distinct from old.building_id) then
    select g.id into new.device_group_id
      from public.device_groups g join public.buildings b on b.id = new.building_id
     where lower(trim(g.nome)) = lower(trim(b.nome))
     limit 1;
  end if;
  return new;
end $$;

create or replace trigger exa_telas_grupo_do_local before insert or update of building_id on public.exa_telas
  for each row execute function public.exa_telas_grupo_do_local();
