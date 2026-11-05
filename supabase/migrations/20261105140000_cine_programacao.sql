-- CINE CATARATAS: programação da semana lida pelo PC (05/11/2026)
-- O site de ingressos (webcinecataratas.com) bloqueia servidores. O PC do escritório lê o site toda quinta 14h
-- com o Chrome de verdade e entrega aqui a lista de filmes com horários (cartazes em data URI).
-- A nuvem (GitHub Actions, tools/cine/cine.mjs) lê a última entrega da semana, gera o vídeo e publica.
-- O PC só tem um token que serve apenas para gravar aqui (exa2_config.cine_token); nada mais.

create table if not exists public.cine_programacao (
  id bigserial primary key,
  criado_em timestamptz not null default now(),
  origem text not null default 'pc',
  qtd int not null,
  filmes jsonb not null
);
alter table public.cine_programacao enable row level security;  -- sem políticas: só service role lê

insert into public.exa2_config (chave, valor) values ('cine_token', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (chave) do nothing;

create or replace function public.cine_registrar_programacao(p_token text, p_filmes jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare n int; novo bigint;
begin
  if p_token is null or p_token <> (select valor from public.exa2_config where chave = 'cine_token') then
    raise exception 'token invalido';
  end if;
  if jsonb_typeof(p_filmes) <> 'array' then raise exception 'filmes deve ser lista'; end if;
  n := jsonb_array_length(p_filmes);
  if n < 2 or n > 30 then raise exception 'quantidade de filmes fora do normal: %', n; end if;
  if pg_column_size(p_filmes) > 8000000 then raise exception 'grande demais'; end if;
  insert into public.cine_programacao (qtd, filmes) values (n, p_filmes) returning id into novo;
  delete from public.cine_programacao where criado_em < now() - interval '60 days';
  return jsonb_build_object('ok', true, 'id', novo, 'filmes', n);
end;
$$;
revoke all on function public.cine_registrar_programacao(text, jsonb) from public;
grant execute on function public.cine_registrar_programacao(text, jsonb) to anon, authenticated;
