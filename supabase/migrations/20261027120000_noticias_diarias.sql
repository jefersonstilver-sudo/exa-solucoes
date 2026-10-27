-- Registro do conteúdo publicado nas notícias diárias das telas (Brasil, Foz, Curiosidades).
-- Escrito pela edge function noticias-diarias-check (acao=registrar, token conferido por hash) e lido por ela
-- para o resumo das 07:30 e 16:30 enviado pela Sofia ao CEO. Só service role acessa (RLS sem políticas).
create table if not exists public.noticias_diarias (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  tipo text not null check (tipo in ('brasil','foz','curiosidades')),
  titulo text,
  itens jsonb not null default '[]'::jsonb
);
create index if not exists noticias_diarias_tipo_data on public.noticias_diarias (tipo, criado_em desc);
alter table public.noticias_diarias enable row level security;
