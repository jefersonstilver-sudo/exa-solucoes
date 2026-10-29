-- EXA 2.0 — Chat do CRM (Nando e Sofia): arquivos, áudio, mensagens programadas e notas internas.
-- Função: exa2-crm-chat. Nada aqui apaga dados existentes.

-- 1) Arquivos do chat (enviados pela equipe e cópias dos recebidos). Privado: o painel abre por link assinado.
insert into storage.buckets (id, name, public, file_size_limit)
values ('crm-midia', 'crm-midia', false, 52428800)
on conflict (id) do nothing;

-- 2) Mensagens programadas
create table if not exists public.crm_agendadas (
  id            uuid primary key default gen_random_uuid(),
  agente        text not null check (agente in ('nando','sofia')),
  alvo          text not null,                 -- nando: telefone · sofia: conversation_id
  texto         text,
  arquivo       jsonb,                         -- {caminho, mime, nome, tipo}
  enviar_em     timestamptz not null,
  status        text not null default 'pendente' check (status in ('pendente','enviando','enviada','erro','cancelada')),
  erro          text,
  criado_por    uuid,
  criado_por_nome text,
  created_at    timestamptz not null default now(),
  enviada_em    timestamptz
);
create index if not exists crm_agendadas_fila on public.crm_agendadas (status, enviar_em);
create index if not exists crm_agendadas_alvo on public.crm_agendadas (agente, alvo);
alter table public.crm_agendadas enable row level security;
drop policy if exists "Admins veem agendadas" on public.crm_agendadas;
create policy "Admins veem agendadas" on public.crm_agendadas for select to authenticated
  using (public.has_role(auth.uid(),'super_admin'::app_role) or public.has_role(auth.uid(),'admin'::app_role));

-- 3) Notas internas por conversa (só a equipe vê)
create table if not exists public.crm_notas (
  id         uuid primary key default gen_random_uuid(),
  agente     text not null check (agente in ('nando','sofia')),
  alvo       text not null,
  texto      text not null,
  autor      text,
  autor_id   uuid,
  created_at timestamptz not null default now()
);
create index if not exists crm_notas_alvo on public.crm_notas (agente, alvo, created_at desc);
alter table public.crm_notas enable row level security;
drop policy if exists "Admins veem notas" on public.crm_notas;
create policy "Admins veem notas" on public.crm_notas for select to authenticated
  using (public.has_role(auth.uid(),'super_admin'::app_role) or public.has_role(auth.uid(),'admin'::app_role));

-- 4) A cada minuto: envia as mensagens programadas que venceram
do $$ begin perform cron.unschedule('exa2-crm-agendadas'); exception when others then null; end $$;
select cron.schedule('exa2-crm-agendadas', '* * * * *', $cron$
  select net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa2-crm-chat',
    headers := jsonb_build_object('Content-Type','application/json','x-exa2-cron',(select valor from public.exa2_config where chave='cron_token')),
    body := '{"action":"disparar"}'::jsonb,
    timeout_milliseconds := 60000);
$cron$);

select 'OK: chat do CRM (arquivos, agendadas, notas, envio a cada minuto)' as resultado;
