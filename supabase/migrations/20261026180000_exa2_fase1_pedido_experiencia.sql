-- ============================================================
-- EXA 2.0 · FASE 1 — Fundação de dados da nova experiência do pedido
-- Tudo ADITIVO e reversível. Nenhum DROP de tabela, nenhum dado apagado.
-- Espelha o padrão de RLS de marcas_clientes (admin via has_role; cliente via ownership).
-- ============================================================

-- ------------------------------------------------------------
-- 1) AGENDAMENTO POR DATA
--    Hoje campaign_schedule_rules só faz recorrência semanal.
--    Adiciona tipo + janela de datas + override + rótulo amigável.
-- ------------------------------------------------------------
alter table public.campaign_schedule_rules
  add column if not exists rule_type  text not null default 'recorrente',
  add column if not exists start_date date,
  add column if not exists end_date   date,
  add column if not exists is_override boolean not null default false,
  add column if not exists label      text;

do $$ begin
  alter table public.campaign_schedule_rules
    add constraint campaign_schedule_rules_rule_type_chk
    check (rule_type in ('principal','recorrente','data'));
exception when duplicate_object then null; end $$;

comment on column public.campaign_schedule_rules.rule_type is
  'principal = fallback sempre no ar | recorrente = dias/horário da semana | data = janela com start_date/end_date';
comment on column public.campaign_schedule_rules.is_override is
  'true quando o cliente escolheu sobrepor uma programação existente naquela janela';

-- ------------------------------------------------------------
-- 2) GARANTIR 1 VÍDEO PRINCIPAL POR PEDIDO
--    No máximo um is_base_video = true por pedido (o fallback).
--    (Se falhar, há pedidos com 2 principais — corrigir dados antes.)
-- ------------------------------------------------------------
create unique index if not exists pedido_videos_um_principal_uq
  on public.pedido_videos (pedido_id)
  where is_base_video is true;

-- ------------------------------------------------------------
-- 3) MARCA POR PEDIDO (um pedido pode ter 1+ empresas)
--    pedido_id NULL = marca no nível do cliente (comportamento atual).
--    pedido_id setado = marca específica daquele pedido.
-- ------------------------------------------------------------
alter table public.marcas_clientes
  add column if not exists pedido_id uuid references public.pedidos(id) on delete cascade;

create index if not exists marcas_clientes_pedido_idx
  on public.marcas_clientes(pedido_id) where pedido_id is not null;

-- Ajusta a unicidade: a regra "uma marca por cliente" vale só p/ marcas de nível cliente.
drop index if exists public.marcas_clientes_client_uq;
create unique index if not exists marcas_clientes_client_uq
  on public.marcas_clientes(client_id)
  where client_id is not null and pedido_id is null;

-- Dentro de um pedido, não repetir a mesma empresa.
create unique index if not exists marcas_clientes_pedido_empresa_uq
  on public.marcas_clientes(pedido_id, empresa)
  where pedido_id is not null;

-- ------------------------------------------------------------
-- 4) FICHA DE CONHECIMENTO DA SOFIA (por marca, flexível, editável)
--    Sofia preenche e enriquece; cliente pode editar; origem rastreada.
-- ------------------------------------------------------------
create table if not exists public.marca_ficha_campos (
  id             uuid primary key default gen_random_uuid(),
  marca_id       uuid not null references public.marcas_clientes(id) on delete cascade,
  categoria      text,                       -- ex: 'Identidade', 'Operação', 'Oferta'
  campo          text not null,              -- ex: 'Horário de funcionamento'
  valor          text,                       -- null = ainda não preenchido
  origem         text not null default 'sofia' check (origem in ('sofia','cliente','exa')),
  obrigatorio    boolean not null default false,
  ordem          integer not null default 0,
  atualizado_por uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (marca_id, campo)
);
create index if not exists marca_ficha_campos_marca_idx on public.marca_ficha_campos(marca_id);

alter table public.marca_ficha_campos enable row level security;

drop policy if exists "Admins gerenciam ficha" on public.marca_ficha_campos;
create policy "Admins gerenciam ficha" on public.marca_ficha_campos for all to authenticated
  using (public.has_role(auth.uid(),'super_admin'::app_role) or public.has_role(auth.uid(),'admin'::app_role))
  with check (public.has_role(auth.uid(),'super_admin'::app_role) or public.has_role(auth.uid(),'admin'::app_role));

drop policy if exists "Cliente ve a propria ficha" on public.marca_ficha_campos;
create policy "Cliente ve a propria ficha" on public.marca_ficha_campos for select to authenticated
  using (exists (select 1 from public.marcas_clientes m where m.id = marca_id and m.client_id = auth.uid()));

drop policy if exists "Cliente edita a propria ficha" on public.marca_ficha_campos;
create policy "Cliente edita a propria ficha" on public.marca_ficha_campos for update to authenticated
  using (exists (select 1 from public.marcas_clientes m where m.id = marca_id and m.client_id = auth.uid()))
  with check (exists (select 1 from public.marcas_clientes m where m.id = marca_id and m.client_id = auth.uid()));

-- ------------------------------------------------------------
-- 5) HISTÓRICO DE VÍDEOS (30 dias)
--    Quando um vídeo é removido, guarda o registro em texto + 1 frame.
--    A exclusão física do mp4 após 30 dias será um job (Fase 4).
-- ------------------------------------------------------------
create table if not exists public.pedido_videos_historico (
  id               uuid primary key default gen_random_uuid(),
  pedido_id        uuid references public.pedidos(id) on delete cascade,
  video_id         uuid,                      -- referência original (pode já não existir)
  video_nome       text,
  thumbnail_url    text,                      -- 1 frame guardado
  resumo_uso       text,                      -- como foi usado (ex: "Dia das Mães, 10-12/05, dia todo")
  periodo          text,
  arquivo_excluido boolean not null default false,
  excluido_em      timestamptz,
  dados            jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);
create index if not exists pedido_videos_historico_pedido_idx on public.pedido_videos_historico(pedido_id);

alter table public.pedido_videos_historico enable row level security;

drop policy if exists "Admins gerenciam historico de video" on public.pedido_videos_historico;
create policy "Admins gerenciam historico de video" on public.pedido_videos_historico for all to authenticated
  using (public.has_role(auth.uid(),'super_admin'::app_role) or public.has_role(auth.uid(),'admin'::app_role))
  with check (public.has_role(auth.uid(),'super_admin'::app_role) or public.has_role(auth.uid(),'admin'::app_role));

drop policy if exists "Cliente ve o proprio historico" on public.pedido_videos_historico;
create policy "Cliente ve o proprio historico" on public.pedido_videos_historico for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = pedido_id and p.client_id = auth.uid()));

-- ------------------------------------------------------------
-- NOTA: vídeos crus e manual de marca (PDF) reutilizam public.marca_arquivos
--       (tipo = 'video_cru' | 'manual_marca' | 'logo_sem_fundo') — sem tabela nova.
-- ============================================================
