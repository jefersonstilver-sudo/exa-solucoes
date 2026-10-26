-- ============================================================
-- EXA 2.0 · FASE 4 — Vigia de entrega das telas (projeto principal). Aditivo.
-- ============================================================

-- Retrato atual de cada tela (escrito pelo exa2-vigia-telas a cada 5 min)
create table if not exists public.exa2_telas_saude (
  cliente_id        text primary key,           -- tela_id de 4 caracteres (= início do UUID do prédio)
  building_id       uuid references public.buildings(id) on delete set null,
  nome              text,
  status            text not null,              -- sincronizada | aplicando | atrasada | offline | sem_confirmacao
  versao_desejada   bigint,
  versao_aplicada   bigint,
  pendente_desde    timestamptz,
  device_status     text,
  device_visto_em   timestamptz,
  sinal_em          timestamptz,
  app_versao        text,
  drift_seg         int,
  arquivos_faltando int,
  playlist          jsonb not null default '[]'::jsonb,
  erro              text,
  atualizado_em     timestamptz not null default now()
);
alter table public.exa2_telas_saude enable row level security;
drop policy if exists "Admins veem saude das telas" on public.exa2_telas_saude;
create policy "Admins veem saude das telas" on public.exa2_telas_saude for select to authenticated
  using (public.has_role(auth.uid(),'super_admin'::app_role) or public.has_role(auth.uid(),'admin'::app_role));
-- Cliente vê só as telas dos próprios pedidos (para "entregue em X de Y telas")
drop policy if exists "Cliente ve saude das telas dos seus pedidos" on public.exa2_telas_saude;
create policy "Cliente ve saude das telas dos seus pedidos" on public.exa2_telas_saude for select to authenticated
  using (exists (
    select 1 from public.pedidos p
    where p.client_id = auth.uid() and building_id::text = any(p.lista_predios)
  ));

-- Alertas de entrega (abre quando atrasa, fecha sozinho quando normaliza)
create table if not exists public.exa2_alertas_entrega (
  id           bigserial primary key,
  cliente_id   text not null,
  building_id  uuid,
  tipo         text not null,                   -- atraso | relogio | arquivos
  mensagem     text not null,
  criado_em    timestamptz not null default now(),
  resolvido_em timestamptz,
  notificado_em timestamptz
);
create index if not exists exa2_alertas_abertos_idx on public.exa2_alertas_entrega (cliente_id, tipo) where resolvido_em is null;
alter table public.exa2_alertas_entrega enable row level security;
drop policy if exists "Admins veem alertas de entrega" on public.exa2_alertas_entrega;
create policy "Admins veem alertas de entrega" on public.exa2_alertas_entrega for select to authenticated
  using (public.has_role(auth.uid(),'super_admin'::app_role) or public.has_role(auth.uid(),'admin'::app_role));

-- Cron do vigia (ATIVAR depois do deploy da função):
-- select cron.schedule('exa2-vigia-telas', '*/5 * * * *', $$
--   select net.http_post(
--     url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa2-vigia-telas',
--     headers := jsonb_build_object('Content-Type','application/json','x-exa2-cron',(select valor from public.exa2_config where chave='cron_token')),
--     body := '{}'::jsonb);
-- $$);
