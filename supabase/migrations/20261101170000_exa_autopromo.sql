-- EXA "Vendo as telas" (01/11/2026): um vídeo novo por dia chamando a Sofia; cada vídeo tem um código.
-- O QR do vídeo passa por exa-autopromo-qr (registra a leitura) e abre o WhatsApp da Sofia com o código na mensagem.
-- A Sofia registra a conversa iniciada com o código. Sucesso = conversa iniciada.

create table if not exists public.exa_autopromo_videos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,                 -- ex.: 0111A (dia/mês + variante)
  data date not null,
  pedido_id uuid,
  video_id uuid,
  pedido_video_id uuid,
  titulo text,
  gancho text,                                  -- frase de abertura
  angulo text,                                  -- preço/dia, rapidez, prova, curiosidade...
  oferta text,                                  -- promo 99/prédio, relâmpago 1200/21...
  visual text,                                  -- padrão de motion usado
  roteiro jsonb,
  faixa_horario text,                           -- quando dois vídeos dividem o dia
  status text not null default 'rascunho',      -- rascunho | no_ar | encerrado
  no_ar_de timestamptz,
  no_ar_ate timestamptz,
  criado_em timestamptz not null default now()
);

create table if not exists public.exa_autopromo_eventos (
  id bigint generated always as identity primary key,
  codigo text,                                  -- null quando não deu para ligar a um vídeo
  tipo text not null check (tipo in ('leitura_qr','conversa','conversa_provavel','lead','proposta','venda')),
  contato_id uuid,
  conversa_id uuid,
  origem text,                                  -- qr | mensagem | pergunta_onde_viu | horario
  ip_hash text,
  agente text,
  dados jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists exa_autopromo_eventos_codigo on public.exa_autopromo_eventos (codigo, tipo, criado_em);
-- uma conversa conta uma vez por código
create unique index if not exists exa_autopromo_conversa_unica on public.exa_autopromo_eventos (codigo, contato_id, tipo) where tipo in ('conversa','conversa_provavel') and contato_id is not null;

alter table public.exa_autopromo_videos enable row level security;
alter table public.exa_autopromo_eventos enable row level security;
-- leitura só para a equipe; gravação só service role (funções)
drop policy if exists autopromo_videos_equipe on public.exa_autopromo_videos;
create policy autopromo_videos_equipe on public.exa_autopromo_videos for select
  using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('super_admin','admin')));
drop policy if exists autopromo_eventos_equipe on public.exa_autopromo_eventos;
create policy autopromo_eventos_equipe on public.exa_autopromo_eventos for select
  using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('super_admin','admin')));

-- placar por vídeo (conversa iniciada = sucesso)
create or replace view public.exa_autopromo_placar as
select v.codigo, v.data, v.titulo, v.gancho, v.angulo, v.oferta, v.visual, v.faixa_horario, v.status,
  count(e.*) filter (where e.tipo = 'leitura_qr') as leituras_qr,
  count(distinct e.contato_id) filter (where e.tipo = 'conversa') as conversas,
  count(distinct e.contato_id) filter (where e.tipo = 'conversa_provavel') as conversas_provaveis,
  count(distinct e.contato_id) filter (where e.tipo = 'lead') as leads,
  count(distinct e.contato_id) filter (where e.tipo = 'venda') as vendas
from public.exa_autopromo_videos v
left join public.exa_autopromo_eventos e on e.codigo = v.codigo
group by v.id;
alter view public.exa_autopromo_placar set (security_invoker = true);
