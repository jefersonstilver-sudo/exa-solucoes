create table if not exists public.video_miniaturas (
  video_id uuid primary key references public.videos(id) on delete cascade,
  path text not null,
  criado_em timestamptz not null default now()
);
alter table public.video_miniaturas enable row level security;
revoke all on public.video_miniaturas from anon, authenticated;
grant all on public.video_miniaturas to service_role;