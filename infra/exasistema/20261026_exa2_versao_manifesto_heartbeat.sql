-- ============================================================
-- EXA 2.0 · Supabase ExaSistema (iwlscwsenzgyylopnwpu)
-- Versão do manifesto por tela + confirmação real (heartbeat) do NUC.
-- Aditivo: não altera colunas existentes, não apaga nada.
-- ============================================================

-- 1) Versão do manifesto: sobe +1 sempre que o json_data muda (qualquer origem: API, limpeza, admin)
alter table public.updates_clientes add column if not exists manifest_versao bigint not null default 1;
alter table public.updates_clientes add column if not exists manifest_alterado_em timestamptz;

-- preenche a data inicial ANTES do gatilho existir
update public.updates_clientes set manifest_alterado_em = coalesce("Atualizado_em", now()) where manifest_alterado_em is null;

create or replace function public.trg_updates_clientes_versao() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.manifest_versao := coalesce(new.manifest_versao, 1);
    new.manifest_alterado_em := now();
  elsif new.json_data is distinct from old.json_data then
    new.manifest_versao := coalesce(old.manifest_versao, 0) + 1;
    new.manifest_alterado_em := now();
  else
    new.manifest_versao := old.manifest_versao;          -- ninguém mexe na versão "na mão"
    new.manifest_alterado_em := old.manifest_alterado_em;
  end if;
  return new;
exception when others then
  return new;                                              -- nunca bloquear a gravação da API
end $$;

drop trigger if exists trg_updates_clientes_versao on public.updates_clientes;
create trigger trg_updates_clientes_versao
  before insert or update on public.updates_clientes
  for each row execute function public.trg_updates_clientes_versao();

-- 2) Estado atual reportado por cada tela
create table if not exists public.telas_heartbeat (
  cliente_id         text primary key,
  manifest_versao    bigint,          -- versão do manifesto que a tela APLICOU (todos os arquivos presentes)
  arquivos_faltando  int,
  faltando           jsonb not null default '[]'::jsonb,
  playlist           jsonb not null default '[]'::jsonb,  -- [{titulo, id_pedido, origem}] o que está tocando
  relogio_nuc        text,
  drift_seg          int,             -- relógio do NUC - relógio do servidor (s)
  sync_ok            boolean,
  erro               text,
  app_versao         text,
  ultimo_sync_ok_em  timestamptz,
  visto_em           timestamptz not null default now()
);
alter table public.telas_heartbeat enable row level security;   -- sem policies: só service_role lê

-- 3) Histórico curto (auditoria: quando cada tela aplicou cada versão)
create table if not exists public.telas_heartbeat_log (
  id                bigserial primary key,
  cliente_id        text not null,
  manifest_versao   bigint,
  sync_ok           boolean,
  arquivos_faltando int,
  drift_seg         int,
  visto_em          timestamptz not null default now()
);
create index if not exists telas_heartbeat_log_idx on public.telas_heartbeat_log (cliente_id, visto_em desc);
alter table public.telas_heartbeat_log enable row level security;

-- 4) Porta de entrada do NUC (valida o cliente_id; tela não precisa de permissão de escrita em tabela)
create or replace function public.telas_registrar_heartbeat(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id   text := p->>'cliente_id';
  v_ok   boolean := coalesce((p->>'sync_ok')::boolean, false);
  v_ver  bigint := nullif(p->>'manifest_versao','')::bigint;
  v_falt int := nullif(p->>'arquivos_faltando','')::int;
  v_dr   int := nullif(p->>'drift_seg','')::int;
begin
  if v_id is null or not exists (select 1 from public.updates_clientes where cliente_id = v_id) then
    return;
  end if;
  insert into public.telas_heartbeat as h
    (cliente_id, manifest_versao, arquivos_faltando, faltando, playlist, relogio_nuc, drift_seg, sync_ok, erro, app_versao, ultimo_sync_ok_em, visto_em)
  values
    (v_id, case when v_ok and coalesce(v_falt,0) = 0 then v_ver end, v_falt, coalesce(p->'faltando','[]'::jsonb),
     coalesce(p->'playlist','[]'::jsonb), p->>'relogio_nuc', v_dr, v_ok, nullif(p->>'erro',''), p->>'app_versao',
     case when v_ok then now() end, now())
  on conflict (cliente_id) do update set
    manifest_versao   = case when v_ok and coalesce(v_falt,0) = 0 and v_ver is not null then v_ver else h.manifest_versao end,
    arquivos_faltando = case when v_ok then v_falt else h.arquivos_faltando end,
    faltando          = case when v_ok then coalesce(p->'faltando','[]'::jsonb) else h.faltando end,
    playlist          = case when jsonb_array_length(coalesce(p->'playlist','[]'::jsonb)) > 0 then p->'playlist' else h.playlist end,
    relogio_nuc       = p->>'relogio_nuc',
    drift_seg         = coalesce(v_dr, h.drift_seg),
    sync_ok           = v_ok,
    erro              = nullif(p->>'erro',''),
    app_versao        = p->>'app_versao',
    ultimo_sync_ok_em = case when v_ok then now() else h.ultimo_sync_ok_em end,
    visto_em          = now();
  insert into public.telas_heartbeat_log (cliente_id, manifest_versao, sync_ok, arquivos_faltando, drift_seg)
  values (v_id, v_ver, v_ok, v_falt, v_dr);
end $$;

revoke all on function public.telas_registrar_heartbeat(jsonb) from public;
grant execute on function public.telas_registrar_heartbeat(jsonb) to anon, authenticated, service_role;
