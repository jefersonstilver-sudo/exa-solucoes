-- EXA (04/11/2026) — QR rastreado de todo vídeo que a EXA produz para anunciante.
-- Cada vídeo ganha um código (ex.: SOHO3). O QR gravado no vídeo aponta para a função exa-qr?c=CODIGO,
-- que registra a leitura e redireciona para o destino do código (WhatsApp com a mensagem pronta
-- citando o vídeo e a tela, ou outro link). O destino pode mudar a qualquer hora sem refazer o vídeo.
-- Relatório no admin: super_admin/qr-videos ("QRs dos vídeos").

create table if not exists public.exa_qr_links (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo ~ '^[A-Z0-9]{3,12}$'),
  cliente text not null,                        -- ex.: Kammer / 3K
  campanha text,                                -- ex.: Edifício SoHo
  titulo text not null,                         -- ex.: Vídeo 3 · Hall e apartamento
  formato text,                                 -- vertical 15 s | horizontal 10 s
  whatsapp text,                                -- só dígitos com DDI (5545...). Se preenchido, o destino é o WhatsApp
  mensagem text,                                -- texto pronto do WhatsApp; {codigo} vira o código
  destino_url text,                             -- usado quando não há WhatsApp
  pedido_id uuid,
  video_id uuid,
  arquivo text,                                 -- nome do arquivo entregue
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (whatsapp is not null or destino_url is not null)
);

create table if not exists public.exa_qr_leituras (
  id bigint generated always as identity primary key,
  codigo text not null,
  lido_em timestamptz not null default now(),
  ip_hash text,                                 -- IP com hash (não guardamos o IP)
  dispositivo text,                             -- android | iphone | outro
  ua text
);
create index if not exists exa_qr_leituras_codigo on public.exa_qr_leituras (codigo, lido_em desc);
create index if not exists exa_qr_leituras_lido on public.exa_qr_leituras (lido_em desc);

alter table public.exa_qr_links enable row level security;
alter table public.exa_qr_leituras enable row level security;

drop policy if exists exa_qr_links_equipe on public.exa_qr_links;
create policy exa_qr_links_equipe on public.exa_qr_links for all
  using (public.exa_eh_equipe(array['super_admin','admin']))
  with check (public.exa_eh_equipe(array['super_admin','admin']));

-- leituras: só leitura para a equipe; quem grava é a função (service role)
drop policy if exists exa_qr_leituras_equipe on public.exa_qr_leituras;
create policy exa_qr_leituras_equipe on public.exa_qr_leituras for select
  using (public.exa_eh_equipe(array['super_admin','admin']));

-- Edifício SoHo (Kammer / 3K): 8 vídeos verticais de 15 s.
-- Destino provisório = o mesmo Linktree do QR antigo. Quando a Kammer passar o WhatsApp,
-- basta preencher "whatsapp" na tela QRs dos vídeos: o QR já impresso no vídeo passa a abrir o WhatsApp.
insert into public.exa_qr_links (codigo, cliente, campanha, titulo, formato, mensagem, destino_url, arquivo) values
 ('SOHO1','Kammer / 3K','Edifício SoHo','Vídeo 1 · Coworking e espaço café','vertical 15 s','Olá! Vi o anúncio do Edifício SoHo (coworking) na tela da EXA e quero saber mais. (cód. {codigo})','https://linktr.ee/qr/e0f25ee9-8362-496d-bca0-1a1e8768782d','EXA_Kammer_SoHo_Video1_vertical_15s_v3.mp4'),
 ('SOHO2','Kammer / 3K','Edifício SoHo','Vídeo 2 · Academia e rooftop','vertical 15 s','Olá! Vi o anúncio do Edifício SoHo (academia e rooftop) na tela da EXA e quero saber mais. (cód. {codigo})','https://linktr.ee/qr/e0f25ee9-8362-496d-bca0-1a1e8768782d','EXA_Kammer_SoHo_Video2_vertical_15s_v3.mp4'),
 ('SOHO3','Kammer / 3K','Edifício SoHo','Vídeo 3 · Hall e apartamento','vertical 15 s','Olá! Vi o anúncio do Edifício SoHo (hall e apartamento) na tela da EXA e quero saber mais. (cód. {codigo})','https://linktr.ee/qr/e0f25ee9-8362-496d-bca0-1a1e8768782d','EXA_Kammer_SoHo_Video3_vertical_15s_v3.mp4'),
 ('SOHO4','Kammer / 3K','Edifício SoHo','Vídeo 4 · Condições (fim de semana)','vertical 15 s','Olá! Vi o anúncio do Edifício SoHo (condições na planta) na tela da EXA e quero saber mais. (cód. {codigo})','https://linktr.ee/qr/e0f25ee9-8362-496d-bca0-1a1e8768782d','EXA_Kammer_SoHo_Video4_vertical_15s_v3.mp4'),
 ('SOHO5','Kammer / 3K','Edifício SoHo','Vídeo 5 · Localização','vertical 15 s','Olá! Vi o anúncio do Edifício SoHo (localização) na tela da EXA e quero saber mais. (cód. {codigo})','https://linktr.ee/qr/e0f25ee9-8362-496d-bca0-1a1e8768782d','EXA_Kammer_SoHo_Video5_vertical_15s_v3.mp4'),
 ('SOHO6','Kammer / 3K','Edifício SoHo','Vídeo 6 · Plantas','vertical 15 s','Olá! Vi o anúncio do Edifício SoHo (plantas) na tela da EXA e quero saber mais. (cód. {codigo})','https://linktr.ee/qr/e0f25ee9-8362-496d-bca0-1a1e8768782d','EXA_Kammer_SoHo_Video6_vertical_15s_v3.mp4'),
 ('SOHO7','Kammer / 3K','Edifício SoHo','Vídeo 7 · Lazer do 4º andar','vertical 15 s','Olá! Vi o anúncio do Edifício SoHo (lazer) na tela da EXA e quero saber mais. (cód. {codigo})','https://linktr.ee/qr/e0f25ee9-8362-496d-bca0-1a1e8768782d','EXA_Kammer_SoHo_Video7_vertical_15s_v3.mp4'),
 ('SOHO8','Kammer / 3K','Edifício SoHo','Vídeo 8 · Tecnologia da obra','vertical 15 s','Olá! Vi o anúncio do Edifício SoHo (tecnologia da obra) na tela da EXA e quero saber mais. (cód. {codigo})','https://linktr.ee/qr/e0f25ee9-8362-496d-bca0-1a1e8768782d','EXA_Kammer_SoHo_Video8_vertical_15s_v3.mp4')
on conflict (codigo) do nothing;
