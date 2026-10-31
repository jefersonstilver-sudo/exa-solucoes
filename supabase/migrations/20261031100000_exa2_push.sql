-- EXA 2.0 · Notificações no app da tela de início (Web Push)
-- Assinaturas por aparelho e registro de envios. Só a função exa2-push (service role) mexe aqui.
create table if not exists public.push_assinaturas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,
  aparelho      text,
  ativo         boolean not null default true,
  falhas        integer not null default 0,
  ultimo_ok     timestamptz,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists push_assinaturas_user_idx on public.push_assinaturas(user_id);

create table if not exists public.push_envios (
  id            bigserial primary key,
  user_id       uuid,
  assinatura_id uuid,
  tipo          text,
  titulo        text,
  corpo         text,
  url           text,
  ok            boolean,
  erro          text,
  created_at    timestamptz not null default now()
);
create index if not exists push_envios_user_idx on public.push_envios(user_id, created_at desc);

alter table public.push_assinaturas enable row level security;
alter table public.push_envios enable row level security;
revoke all on public.push_assinaturas from anon, authenticated;
revoke all on public.push_envios from anon, authenticated;
