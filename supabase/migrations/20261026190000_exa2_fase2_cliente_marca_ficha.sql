-- ============================================================
-- EXA 2.0 · FASE 2 — Cliente gerencia a própria marca + ficha padrão da Sofia
-- Aditivo. Cliente só mexe no que é DELE (client_id = auth.uid()).
-- ============================================================

-- 1) Cliente cria/edita empresa dos próprios pedidos
drop policy if exists "Cliente cria a propria marca" on public.marcas_clientes;
create policy "Cliente cria a propria marca" on public.marcas_clientes for insert to authenticated
  with check (
    client_id = auth.uid()
    and (pedido_id is null or exists (select 1 from public.pedidos p where p.id = pedido_id and p.client_id = auth.uid()))
  );

drop policy if exists "Cliente edita a propria marca" on public.marcas_clientes;
create policy "Cliente edita a propria marca" on public.marcas_clientes for update to authenticated
  using (client_id = auth.uid())
  with check (
    client_id = auth.uid()
    and (pedido_id is null or exists (select 1 from public.pedidos p where p.id = pedido_id and p.client_id = auth.uid()))
  );

-- 2) Cliente envia/remove arquivos da própria marca
drop policy if exists "Cliente envia arquivos da propria marca" on public.marca_arquivos;
create policy "Cliente envia arquivos da propria marca" on public.marca_arquivos for insert to authenticated
  with check (exists (select 1 from public.marcas_clientes m where m.id = marca_id and m.client_id = auth.uid()));

drop policy if exists "Cliente remove arquivos da propria marca" on public.marca_arquivos;
create policy "Cliente remove arquivos da propria marca" on public.marca_arquivos for delete to authenticated
  using (exists (select 1 from public.marcas_clientes m where m.id = marca_id and m.client_id = auth.uid()));

-- 3) Ficha: cliente adiciona campos; edição do cliente sempre marca origem = 'cliente'
drop policy if exists "Cliente adiciona campo na propria ficha" on public.marca_ficha_campos;
create policy "Cliente adiciona campo na propria ficha" on public.marca_ficha_campos for insert to authenticated
  with check (
    origem = 'cliente'
    and exists (select 1 from public.marcas_clientes m where m.id = marca_id and m.client_id = auth.uid())
  );

drop policy if exists "Cliente edita a propria ficha" on public.marca_ficha_campos;
create policy "Cliente edita a propria ficha" on public.marca_ficha_campos for update to authenticated
  using (exists (select 1 from public.marcas_clientes m where m.id = marca_id and m.client_id = auth.uid()))
  with check (
    origem = 'cliente'
    and exists (select 1 from public.marcas_clientes m where m.id = marca_id and m.client_id = auth.uid())
  );

create or replace function public.marca_ficha_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists trg_marca_ficha_touch on public.marca_ficha_campos;
create trigger trg_marca_ficha_touch before update on public.marca_ficha_campos
  for each row execute function public.marca_ficha_touch();

-- 4) Storage: cliente sobe arquivo só na pasta da própria marca (marcas/{marca_id}/...)
drop policy if exists "Cliente envia para pasta da propria marca" on storage.objects;
create policy "Cliente envia para pasta da propria marca" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'marcas'
    and exists (
      select 1 from public.marcas_clientes m
      where m.id::text = (storage.foldername(name))[1] and m.client_id = auth.uid()
    )
  );

drop policy if exists "Cliente remove da pasta da propria marca" on storage.objects;
create policy "Cliente remove da pasta da propria marca" on storage.objects for delete to authenticated
  using (
    bucket_id = 'marcas'
    and exists (
      select 1 from public.marcas_clientes m
      where m.id::text = (storage.foldername(name))[1] and m.client_id = auth.uid()
    )
  );

-- 5) Ficha padrão: campos que toda empresa deve ter (Sofia é cobrada por eles)
create or replace function public.ensure_ficha_padrao(p_marca_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare m record;
begin
  select * into m from public.marcas_clientes where id = p_marca_id;
  if not found then return; end if;
  insert into public.marca_ficha_campos (marca_id, categoria, campo, valor, origem, obrigatorio, ordem)
  values
    (p_marca_id,'Identidade','Segmento',                         nullif(m.segmento,''),  'sofia', true, 10),
    (p_marca_id,'Identidade','O que vende (carro-chefe)',        null,                   'sofia', true, 20),
    (p_marca_id,'Identidade','Diferencial',                      null,                   'sofia', true, 30),
    (p_marca_id,'Identidade','Público-alvo',                     null,                   'sofia', true, 40),
    (p_marca_id,'Identidade','Tom de voz',                       nullif(m.tom_de_voz,''),'sofia', true, 50),
    (p_marca_id,'Identidade','Slogan / frases da marca',         nullif(m.slogan,''),    'sofia', false, 60),
    (p_marca_id,'Operação',  'Endereço / bairro',                nullif(m.endereco,''),  'sofia', true, 110),
    (p_marca_id,'Operação',  'Horário de funcionamento',         null,                   'sofia', true, 120),
    (p_marca_id,'Operação',  'Formas de pagamento',              null,                   'sofia', true, 130),
    (p_marca_id,'Operação',  'Delivery / canais de pedido',      null,                   'sofia', false, 140),
    (p_marca_id,'Oferta',    'Promoção atual',                   null,                   'sofia', false, 210),
    (p_marca_id,'Oferta',    'Faixa de preço / ticket médio',    null,                   'sofia', false, 220),
    (p_marca_id,'Oferta',    'Datas importantes',                null,                   'sofia', false, 230),
    (p_marca_id,'Criativo',  'Cores da marca',                   case when jsonb_typeof(m.cores)='array'
                                                                   then (select string_agg(coalesce(c->>'nome','')||' '||coalesce(c->>'hex',''), ', ') from jsonb_array_elements(m.cores) c) end,
                                                                                        'sofia', false, 310),
    (p_marca_id,'Criativo',  'Tipografia',                       case when jsonb_typeof(m.fontes)='array'
                                                                   then (select string_agg(f #>> '{}', ', ') from jsonb_array_elements(m.fontes) f) end,
                                                                                        'sofia', false, 320),
    (p_marca_id,'Criativo',  'O que evitar nos vídeos',          nullif(m.proibido,''),  'sofia', true, 330),
    (p_marca_id,'Criativo',  'Referências que gosta',            null,                   'sofia', false, 340),
    (p_marca_id,'Criativo',  'Chamada final (CTA) preferida',    null,                   'sofia', false, 350)
  on conflict (marca_id, campo) do nothing;
end $$;

create or replace function public.trg_marca_ficha_padrao() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform public.ensure_ficha_padrao(new.id); return new; end $$;

drop trigger if exists trg_marcas_clientes_ficha_padrao on public.marcas_clientes;
create trigger trg_marcas_clientes_ficha_padrao after insert on public.marcas_clientes
  for each row execute function public.trg_marca_ficha_padrao();

-- Backfill: marcas que já existem ganham a ficha padrão (sem sobrescrever nada)
do $$ declare r record; begin
  for r in select id from public.marcas_clientes loop perform public.ensure_ficha_padrao(r.id); end loop;
end $$;

-- Segurança: funções security definer não podem ser chamadas pela API por clientes
revoke execute on function public.ensure_ficha_padrao(uuid) from public, anon, authenticated;
revoke execute on function public.trg_marca_ficha_padrao() from public, anon, authenticated;
