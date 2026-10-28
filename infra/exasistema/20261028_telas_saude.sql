-- EXA 2.0 — Saúde dos NUCs (auditoria automática a cada 15 min). Rodar no projeto ExaSistema.
-- O NUC envia pela função telas_registrar_saude (mesmo modelo do heartbeat): valida o código da tela,
-- grava o estado atual (1 linha por tela) e o histórico (30 dias).

create table if not exists public.telas_saude (
  cliente_id text primary key,
  dados      jsonb not null,
  visto_em   timestamptz not null default now()
);
alter table public.telas_saude enable row level security;

create table if not exists public.telas_saude_log (
  id         bigserial primary key,
  cliente_id text not null,
  dados      jsonb not null,
  visto_em   timestamptz not null default now()
);
create index if not exists telas_saude_log_idx on public.telas_saude_log (cliente_id, visto_em desc);
alter table public.telas_saude_log enable row level security;

create or replace function public.telas_registrar_saude(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_id text := p->>'cliente_id';
begin
  if v_id is null or length(p::text) > 20000
     or not exists (select 1 from public.updates_clientes where cliente_id = v_id) then
    return;
  end if;
  -- no máx. 1 registro a cada 5 min por tela (protege contra envio em laço)
  if exists (select 1 from public.telas_saude where cliente_id = v_id and visto_em > now() - interval '5 minutes') then
    return;
  end if;
  insert into public.telas_saude (cliente_id, dados, visto_em) values (v_id, p, now())
  on conflict (cliente_id) do update set dados = excluded.dados, visto_em = now();
  insert into public.telas_saude_log (cliente_id, dados) values (v_id, p);
  if random() < 0.01 then
    delete from public.telas_saude_log where visto_em < now() - interval '30 days';
  end if;
end $$;

revoke all on function public.telas_registrar_saude(jsonb) from public;
grant execute on function public.telas_registrar_saude(jsonb) to anon, authenticated, service_role;

select 'OK: telas_saude criada' as resultado;
