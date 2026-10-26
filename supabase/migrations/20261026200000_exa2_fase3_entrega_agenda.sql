-- ============================================================
-- EXA 2.0 · FASE 3 — Entrega da agenda aos painéis (NÃO APLICADA AINDA)
-- Depende da auditoria da API da AWS / player dos NUCs antes de ativar o cron.
-- ============================================================

-- Configuração interna (somente service_role lê: RLS ligado e sem policies)
create table if not exists public.exa2_config (
  chave text primary key,
  valor text not null,
  updated_at timestamptz not null default now()
);
alter table public.exa2_config enable row level security;
insert into public.exa2_config (chave, valor)
values ('cron_token', encode(gen_random_bytes(32), 'hex'))
on conflict (chave) do nothing;

-- Último estado enviado por (pedido, vídeo) — permite reenviar só o que mudou
create table if not exists public.exa2_agenda_sync_estado (
  pedido_id        uuid not null references public.pedidos(id) on delete cascade,
  video_id         uuid not null,
  titulo           text,
  payload          jsonb not null default '{}'::jsonb,
  payload_hash     text,
  status           text not null default 'pendente',  -- pendente | aceito_pela_api | falha_parcial | confirmado_na_tela
  ultimo_resultado jsonb not null default '[]'::jsonb,
  origem           text,
  sincronizado_em  timestamptz,
  primary key (pedido_id, video_id)
);
alter table public.exa2_agenda_sync_estado enable row level security;
drop policy if exists "Admins veem sync de agenda" on public.exa2_agenda_sync_estado;
create policy "Admins veem sync de agenda" on public.exa2_agenda_sync_estado for select to authenticated
  using (public.has_role(auth.uid(),'super_admin'::app_role) or public.has_role(auth.uid(),'admin'::app_role));
drop policy if exists "Cliente ve sync do proprio pedido" on public.exa2_agenda_sync_estado;
create policy "Cliente ve sync do proprio pedido" on public.exa2_agenda_sync_estado for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = pedido_id and p.client_id = auth.uid()));

-- Uploads do cliente pelo portal (EmpresaTab) precisam de origem 'portal'
alter table public.marca_arquivos drop constraint if exists marca_arquivos_origem_check;
alter table public.marca_arquivos add constraint marca_arquivos_origem_check
  check (origem in ('whatsapp', 'admin', 'coverr', 'lucas', 'portal'));

-- Cron (ATIVAR SÓ DEPOIS DA AUDITORIA): a cada 6h + logo após a meia-noite de Brasília (03:02 UTC)
-- select cron.schedule('exa2-agenda-sync', '2 3,9,15,21 * * *', $$
--   select net.http_post(
--     url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa2-agenda-sync',
--     headers := jsonb_build_object('Content-Type','application/json','x-exa2-cron',(select valor from public.exa2_config where chave='cron_token')),
--     body := '{}'::jsonb);
-- $$);
