-- EXA · Telas novas (comércio parceiro / hall) — 31/10/2026
-- Tela = qualquer aparelho (TV Android, mini PC Windows, Linux, navegador) que abre examidia.com.br/tela,
-- mostra um código, é pareado no admin e passa a tocar a programação do local (mesmos anúncios dos prédios).
-- Não mexe nos NUCs atuais: eles continuam no caminho API externa → ExaSistema.

-- 1) Local "comércio parceiro" é um registro de buildings (aparece na loja e entra em pedidos como um prédio)
alter table public.buildings add column if not exists tipo_local text not null default 'predio';
alter table public.buildings add column if not exists segmento_local text;          -- Restaurante, Clínica odontológica…
alter table public.buildings add column if not exists pedido_casa_id uuid references public.pedidos(id) on delete set null; -- vídeos do próprio comerciante
alter table public.buildings add column if not exists telas_ritmo jsonb not null default '{}'::jsonb; -- {casa_a_cada, editorial_a_cada}
do $$ begin
  alter table public.buildings add constraint buildings_tipo_local_chk check (tipo_local in ('predio','comercio'));
exception when duplicate_object then null; end $$;
comment on column public.buildings.tipo_local is 'predio = condomínio com NUC no elevador; comercio = local parceiro com tela nova (exa_telas), fora da entrega dos NUCs';

-- 2) As telas
create table if not exists public.exa_telas (
  id uuid primary key default gen_random_uuid(),
  nome text,
  building_id uuid references public.buildings(id) on delete set null,
  ambiente text not null default 'comercio' check (ambiente in ('comercio','hall')),
  layout text not null default 'H1',
  config jsonb not null default '{}'::jsonb,       -- sobrescreve o ritmo do local, liga/desliga câmera e notícias
  status text not null default 'aguardando' check (status in ('aguardando','ativa','desativada')),
  codigo text,                                     -- 6 dígitos enquanto aguarda pareamento
  codigo_expira timestamptz,
  token_hash text not null,                        -- sha256 do segredo que só o aparelho tem
  plataforma text,
  info jsonb not null default '{}'::jsonb,
  ip text,
  versao_player text,
  ultimo_sinal timestamptz,
  tocando jsonb,
  erros jsonb,
  comando text,
  comando_em timestamptz,
  pareada_em timestamptz,
  pareada_por uuid,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index if not exists exa_telas_codigo_uk on public.exa_telas (codigo) where codigo is not null;
create unique index if not exists exa_telas_token_uk on public.exa_telas (token_hash);
create index if not exists exa_telas_building_idx on public.exa_telas (building_id);

create or replace function public.exa_telas_tocar_atualizado() returns trigger language plpgsql as $$
begin new.atualizado_em := now(); return new; end $$;
drop trigger if exists exa_telas_atualizado on public.exa_telas;
create trigger exa_telas_atualizado before update on public.exa_telas
  for each row when (old.* is distinct from new.* and (old.ultimo_sinal is not distinct from new.ultimo_sinal)) execute function public.exa_telas_tocar_atualizado();

-- 3) Prova de exibição (agregada por dia) e eventos
create table if not exists public.exa_telas_exibicoes (
  tela_id uuid not null references public.exa_telas(id) on delete cascade,
  dia date not null,
  pedido_id uuid not null default '00000000-0000-0000-0000-000000000000',
  video_id uuid not null default '00000000-0000-0000-0000-000000000000',
  tipo text not null default 'anuncio',
  vezes integer not null default 0,
  segundos integer not null default 0,
  primary key (tela_id, dia, tipo, pedido_id, video_id)
);
create index if not exists exa_telas_exib_pedido_idx on public.exa_telas_exibicoes (pedido_id, dia);

create table if not exists public.exa_telas_eventos (
  id bigserial primary key,
  tela_id uuid references public.exa_telas(id) on delete cascade,
  tipo text not null,
  dados jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists exa_telas_eventos_idx on public.exa_telas_eventos (tela_id, criado_em desc);

create or replace function public.exa_telas_somar_exibicoes(p_tela uuid, p_itens jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare it jsonb;
begin
  for it in select * from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) loop
    insert into public.exa_telas_exibicoes as e (tela_id, dia, tipo, pedido_id, video_id, vezes, segundos)
    values (
      p_tela,
      coalesce((it->>'dia')::date, (now() at time zone 'America/Sao_Paulo')::date),
      coalesce(nullif(it->>'tipo',''), 'anuncio'),
      coalesce(nullif(it->>'pedido_id','')::uuid, '00000000-0000-0000-0000-000000000000'),
      coalesce(nullif(it->>'video_id','')::uuid, '00000000-0000-0000-0000-000000000000'),
      greatest(0, least(coalesce((it->>'vezes')::int, 0), 5000)),
      greatest(0, least(coalesce((it->>'segundos')::int, 0), 86400))
    )
    on conflict (tela_id, dia, tipo, pedido_id, video_id)
    do update set vezes = e.vezes + excluded.vezes, segundos = e.segundos + excluded.segundos;
  end loop;
end $$;
revoke all on function public.exa_telas_somar_exibicoes(uuid, jsonb) from public, anon, authenticated;

-- 4) Acesso: só a equipe gerencia; o aparelho fala apenas pela função exa-tela (service role)
alter table public.exa_telas enable row level security;
alter table public.exa_telas_exibicoes enable row level security;
alter table public.exa_telas_eventos enable row level security;

create or replace function public.exa_telas_equipe() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles r where r.user_id = auth.uid()
    and r.role::text in ('super_admin','admin','diretora_operacoes','gestor_comercial'))
$$;

drop policy if exists "equipe gerencia telas" on public.exa_telas;
create policy "equipe gerencia telas" on public.exa_telas for all to authenticated
  using (public.exa_telas_equipe()) with check (public.exa_telas_equipe());

drop policy if exists "equipe le exibicoes" on public.exa_telas_exibicoes;
create policy "equipe le exibicoes" on public.exa_telas_exibicoes for select to authenticated using (public.exa_telas_equipe());
drop policy if exists "cliente le exibicoes do pedido" on public.exa_telas_exibicoes;
create policy "cliente le exibicoes do pedido" on public.exa_telas_exibicoes for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = exa_telas_exibicoes.pedido_id and p.client_id = auth.uid()));

drop policy if exists "equipe le eventos" on public.exa_telas_eventos;
create policy "equipe le eventos" on public.exa_telas_eventos for select to authenticated using (public.exa_telas_equipe());

-- limpeza: códigos nunca usados somem depois de 7 dias; eventos depois de 30
create or replace function public.exa_telas_limpar() returns void language sql security definer set search_path = public as $$
  delete from public.exa_telas where status = 'aguardando' and building_id is null and criado_em < now() - interval '7 days';
  delete from public.exa_telas_eventos where criado_em < now() - interval '30 days';
$$;
revoke all on function public.exa_telas_limpar() from public, anon, authenticated;

-- 5) Loja pública: devolve também o tipo do local (comércio aparece como "Restaurante · tela no salão")
drop function if exists public.get_buildings_for_public_store();
create function public.get_buildings_for_public_store()
 returns table(id uuid, nome text, bairro text, endereco text, status text, venue_type text, preco_base numeric, quantidade_telas integer, imagem_principal text, imagem_principal_focus jsonb, latitude numeric, longitude numeric, amenities text[], caracteristicas text[], publico_estimado integer, visualizacoes_mes integer, numero_elevadores integer, tem_airbnb boolean, tipo_local text, segmento_local text)
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select
    b.id, b.nome, b.bairro,
    coalesce(b.endereco, '') as endereco,
    b.status, b.venue_type, b.preco_base, b.quantidade_telas, b.imagem_principal,
    coalesce(b.imagem_principal_focus, '{"x":50,"y":50}'::jsonb) as imagem_principal_focus,
    coalesce(b.manual_latitude, b.latitude) as latitude,
    coalesce(b.manual_longitude, b.longitude) as longitude,
    coalesce(b.amenities, array[]::text[]) as amenities,
    coalesce(b.caracteristicas, array[]::text[]) as caracteristicas,
    coalesce(b.publico_estimado, b.numero_unidades * 3, 0) as publico_estimado,
    coalesce(b.visualizacoes_mes, 0) as visualizacoes_mes,
    coalesce(b.numero_elevadores, 0) as numero_elevadores,
    coalesce(b.tem_airbnb, false) as tem_airbnb,
    coalesce(b.tipo_local, 'predio') as tipo_local,
    b.segmento_local
  from public.buildings b
  where b.status in ('ativo', 'instalação', 'instalacao')
    and b.status != 'interno'
  order by b.created_at desc;
$function$;
grant execute on function public.get_buildings_for_public_store() to anon, authenticated;
