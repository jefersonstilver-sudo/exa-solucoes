-- Sofia v99 — Fase 2 de segurança do canal do CEO.
-- sofia_acoes_ceo: ações financeiras pedidas pelo CEO no WhatsApp (liberar pedido por confiança, condição especial).
--   Nada executa direto: a Sofia manda um código de 6 dígitos para o e-mail do CEO e só executa com o código certo.
--   O que foi pedido (tipo, parâmetros, resumo, hash do código) nunca muda depois de gravado; só o status avança.
-- sofia_auditoria_ceo: toda ferramenta que a Sofia usa no canal do CEO fica registrada (só inserção).
-- Só a função (service role) lê e escreve. Ninguém apaga.

create table if not exists public.sofia_acoes_ceo (
  id bigint generated always as identity primary key,
  contact_id uuid references public.sofia_contacts(id) on delete set null,
  conversation_id uuid references public.sofia_conversations(id) on delete set null,
  tipo text not null check (tipo in ('confianca', 'condicao')),
  params jsonb not null,
  resumo text not null,
  nonce text not null,
  code_hash text not null,
  expira_em timestamptz not null,
  tentativas int not null default 0,
  status text not null default 'aguardando'
    check (status in ('aguardando', 'executando', 'executada', 'falhou', 'cancelada', 'expirada', 'bloqueada', 'substituida')),
  resultado text,
  confirmada_em timestamptz,
  executada_em timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists sofia_acoes_ceo_status_idx on public.sofia_acoes_ceo (status, created_at desc);

create or replace function public.sofia_acoes_ceo_guarda() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'sofia_acoes_ceo: registros nao podem ser apagados';
  end if;
  if new.id <> old.id or new.tipo <> old.tipo or new.params <> old.params or new.resumo <> old.resumo
     or new.nonce <> old.nonce or new.code_hash <> old.code_hash or new.expira_em <> old.expira_em
     or new.created_at <> old.created_at or new.contact_id is distinct from old.contact_id
     or new.conversation_id is distinct from old.conversation_id then
    raise exception 'sofia_acoes_ceo: o pedido da acao nao pode ser alterado';
  end if;
  if new.tentativas < old.tentativas then
    raise exception 'sofia_acoes_ceo: tentativas nao podem diminuir';
  end if;
  if old.status in ('executada', 'falhou', 'cancelada', 'expirada', 'bloqueada', 'substituida') then
    raise exception 'sofia_acoes_ceo: acao % ja encerrada (%)', old.id, old.status;
  end if;
  if old.status = 'executando' and new.status not in ('executada', 'falhou') then
    raise exception 'sofia_acoes_ceo: acao em execucao so pode terminar como executada ou falhou';
  end if;
  if old.status = 'aguardando' and new.status in ('executada', 'falhou') then
    raise exception 'sofia_acoes_ceo: acao precisa passar por executando (codigo conferido)';
  end if;
  return new;
end $$;
drop trigger if exists sofia_acoes_ceo_guarda on public.sofia_acoes_ceo;
create trigger sofia_acoes_ceo_guarda before update or delete on public.sofia_acoes_ceo
  for each row execute function public.sofia_acoes_ceo_guarda();

alter table public.sofia_acoes_ceo enable row level security;
revoke all on public.sofia_acoes_ceo from anon, authenticated;

create table if not exists public.sofia_auditoria_ceo (
  id bigint generated always as identity primary key,
  contact_id uuid,
  conversation_id uuid,
  ferramenta text not null,
  entrada jsonb,
  resultado text,
  erro boolean not null default false,
  ms int,
  created_at timestamptz not null default now()
);
create index if not exists sofia_auditoria_ceo_created_idx on public.sofia_auditoria_ceo (created_at desc);

create or replace function public.sofia_auditoria_ceo_somente_insercao() returns trigger language plpgsql as $$
begin
  raise exception 'sofia_auditoria_ceo: auditoria e somente insercao';
end $$;
drop trigger if exists sofia_auditoria_ceo_somente_insercao on public.sofia_auditoria_ceo;
create trigger sofia_auditoria_ceo_somente_insercao before update or delete on public.sofia_auditoria_ceo
  for each row execute function public.sofia_auditoria_ceo_somente_insercao();

alter table public.sofia_auditoria_ceo enable row level security;
revoke all on public.sofia_auditoria_ceo from anon, authenticated;

-- trava de emergência: 1 = Sofia pausada para clientes (só o CEO continua falando com ela)
insert into public.exa2_config (chave, valor, updated_at) values ('sofia_pausada', '0', now())
  on conflict (chave) do nothing;
