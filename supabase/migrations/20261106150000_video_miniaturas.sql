-- EXA (06/11/2026): cache permanente das miniaturas dos vídeos (relatório do anunciante e app).
-- A miniatura é capturada uma vez no navegador e guardada aqui; depois todo mundo recebe a imagem pronta.
create table if not exists public.video_miniaturas (
  video_id uuid primary key references public.videos(id) on delete cascade,
  path text not null,
  criado_em timestamptz not null default now()
);
alter table public.video_miniaturas enable row level security;
-- sem políticas: só a função exa2-relatorio-pedido (service role) lê e grava
revoke all on public.video_miniaturas from anon, authenticated;
grant all on public.video_miniaturas to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('video-miniaturas', 'video-miniaturas', true, 400000, array['image/jpeg'])
on conflict (id) do nothing;
