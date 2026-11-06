-- EXA (06/11/2026) — LÍVIA, diretora financeira de IA (WhatsApp 45 99942-9820, instância de notificações da Evolution).
-- Decisões do Jeferson em 06/11/2026 (documento do projeto claude/livia-conhecimento.md):
--  - a Lívia só cuida de dinheiro: cobrança a partir da 2ª mensalidade, ajustes financeiros, conciliação, contas a pagar;
--  - livro de cobrança = cobranca_auditoria (o contrato auditado, visível ao cliente na aba Contrato);
--  - ela só cobra pedido com pedidos.livia_cobranca = true (o Jeferson libera um por um);
--  - dúvida ou decisão fora da regra → pergunta ao Jeferson (livia_decisoes) e só depois responde ao cliente;
--  - Sofia (vídeos/programação) e Nando (condomínios) recebem passagens por dentro do sistema (livia_passagens).
-- Tudo só pelo servidor (service role); a equipe lê pelo admin.

create table if not exists public.livia_mensagens (
  id bigserial primary key,
  telefone text not null,
  papel text not null check (papel in ('cliente','livia','ceo','humano','sistema')),
  pedido_id uuid,
  conteudo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_livia_mensagens_tel on public.livia_mensagens (telefone, id desc);
create index if not exists idx_livia_mensagens_msgid on public.livia_mensagens ((conteudo->>'msg_id'));

-- perguntas da Lívia ao Jeferson (ele responde no WhatsApp dela citando o código, ex.: "L12 pode dar o prazo")
create table if not exists public.livia_decisoes (
  id bigserial primary key,
  codigo text generated always as ('L' || id::text) stored,
  telefone_cliente text,
  nome_cliente text,
  pedido_id uuid,
  pergunta text not null,
  contexto text,
  status text not null default 'aberta' check (status in ('aberta','respondida','cancelada')),
  resposta text,
  respondida_em timestamptz,
  prometido_ate timestamptz,         -- o que a Lívia disse ao cliente ("te retorno amanhã até as 10h")
  lembrado_em timestamptz,           -- última vez que ela cobrou o Jeferson
  cliente_avisado_em timestamptz,    -- a Lívia já respondeu o cliente com a decisão
  created_at timestamptz not null default now()
);
create index if not exists idx_livia_decisoes_abertas on public.livia_decisoes (status) where status = 'aberta';

-- passagens entre os agentes (Sofia ↔ Lívia ↔ Nando), sempre por dentro do sistema
create table if not exists public.livia_passagens (
  id bigserial primary key,
  de text not null check (de in ('sofia','nando','livia','ceo')),
  para text not null check (para in ('sofia','nando','livia')),
  telefone text,
  pedido_id uuid,
  contexto text not null,
  status text not null default 'aberta' check (status in ('aberta','feita','falhou')),
  resultado text,
  created_at timestamptz not null default now(),
  feita_em timestamptz
);
create index if not exists idx_livia_passagens_abertas on public.livia_passagens (para, status) where status = 'aberta';

-- régua: um aviso por parcela/tipo/canal/destino (idempotente)
create table if not exists public.livia_avisos (
  id bigserial primary key,
  pedido_id uuid not null default '00000000-0000-0000-0000-000000000000',
  tipo text not null,                -- ex.: d10#3 (aviso de 10 dias da mensalidade 3)
  canal text not null check (canal in ('whatsapp','email','ceo','sistema')),
  destino text not null default '',
  ok boolean,
  detalhe text,
  created_at timestamptz not null default now(),
  unique (pedido_id, tipo, canal, destino)
);

create table if not exists public.livia_config (
  chave text primary key,
  valor text not null,
  updated_at timestamptz not null default now()
);
insert into public.livia_config (chave, valor) values
  ('ligada', '1'),          -- '0' = a Lívia não responde ninguém (só guarda e avisa o CEO)
  ('modo_teste', '1'),      -- '1' = responde só o Jeferson e os testadores; cliente fica guardado e o CEO é avisado
  ('testadores', ''),       -- telefones separados por vírgula
  ('regua', '0'),           -- '1' = régua automática liga (só nos pedidos com livia_cobranca = true)
  ('resumo_hora', '19')
on conflict (chave) do nothing;

-- estado por telefone: trava (uma resposta por vez) e atendimento assumido pelo Jeferson
create table if not exists public.livia_estado (
  telefone text primary key,
  trava_ate timestamptz,
  humano_ate timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.pedidos add column if not exists livia_cobranca boolean not null default false;
comment on column public.pedidos.livia_cobranca is 'Lívia (financeiro) cobra este pedido pela cobranca_auditoria. Liberado pelo Jeferson um por um.';

create or replace function public.livia_pegar_trava(p_tel text, p_segundos int default 170)
returns boolean language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  insert into public.livia_estado (telefone, trava_ate) values (p_tel, now() + make_interval(secs => p_segundos))
  on conflict (telefone) do update set trava_ate = excluded.trava_ate, updated_at = now()
    where public.livia_estado.trava_ate is null or public.livia_estado.trava_ate < now()
  returning true into ok;
  return coalesce(ok, false);
end $$;
create or replace function public.livia_soltar_trava(p_tel text)
returns void language sql security definer set search_path = public as $$
  update public.livia_estado set trava_ate = null, updated_at = now() where telefone = p_tel;
$$;
revoke execute on function public.livia_pegar_trava(text, int) from public, anon, authenticated;
revoke execute on function public.livia_soltar_trava(text) from public, anon, authenticated;

do $$ declare t text; begin
  foreach t in array array['livia_mensagens','livia_decisoes','livia_passagens','livia_avisos','livia_config','livia_estado'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
-- a equipe (admin/financeiro) lê pelo painel
grant select on public.livia_mensagens, public.livia_decisoes, public.livia_passagens, public.livia_avisos, public.livia_config to authenticated;
drop policy if exists livia_equipe_le on public.livia_mensagens;
create policy livia_equipe_le on public.livia_mensagens for select to authenticated using (public.exa_eh_equipe(array['super_admin','admin','admin_financeiro']));
drop policy if exists livia_equipe_le on public.livia_decisoes;
create policy livia_equipe_le on public.livia_decisoes for select to authenticated using (public.exa_eh_equipe(array['super_admin','admin','admin_financeiro']));
drop policy if exists livia_equipe_le on public.livia_passagens;
create policy livia_equipe_le on public.livia_passagens for select to authenticated using (public.exa_eh_equipe(array['super_admin','admin','admin_financeiro']));
drop policy if exists livia_equipe_le on public.livia_avisos;
create policy livia_equipe_le on public.livia_avisos for select to authenticated using (public.exa_eh_equipe(array['super_admin','admin','admin_financeiro']));
drop policy if exists livia_equipe_le on public.livia_config;
create policy livia_equipe_le on public.livia_config for select to authenticated using (public.exa_eh_equipe(array['super_admin','admin','admin_financeiro']));

-- contato de teste "Jeferson Rodrigues – Del Fuego" (número da própria Lívia) na Sofia: autorizado apagar (06/11/2026).
-- Só apaga se for exatamente o número da Lívia e não for o CEO.
do $$ begin
  delete from public.sofia_contacts
   where role <> 'ceo'
     and regexp_replace(coalesce(phone,''), '\D', '', 'g') in ('5545999429820','554599429820','45999429820','4599429820');
exception when foreign_key_violation then
  -- tem conversa ligada: tira o número (a Sofia deixa de reconhecer a Lívia como cliente) e marca como teste
  update public.sofia_contacts set phone = null, name = coalesce(name,'') || ' (contato de teste removido 06/11)'
   where role <> 'ceo'
     and regexp_replace(coalesce(phone,''), '\D', '', 'g') in ('5545999429820','554599429820','45999429820','4599429820');
end $$;

-- comprovantes e arquivos que os clientes mandam para a Lívia (privado; o CEO recebe link assinado)
insert into storage.buckets (id, name, public) values ('livia-midia', 'livia-midia', false) on conflict (id) do nothing;

-- rotina da Lívia a cada 10 min (régua, retornos das 10h, resumo das 19h). A régua só age com livia_config.regua = '1'.
select cron.unschedule('livia-cron') where exists (select 1 from cron.job where jobname = 'livia-cron');
select cron.schedule('livia-cron', '*/10 * * * *', $c$
  select net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/livia-cron',
    headers := jsonb_build_object('Content-Type','application/json','x-exa2-cron',(select valor from public.exa2_config where chave='cron_token')),
    body := '{"action":"cron"}'::jsonb, timeout_milliseconds := 120000)
$c$);
