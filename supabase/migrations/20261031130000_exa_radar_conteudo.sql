-- RADAR DE CONTEÚDO EXA (31/10/2026)
-- Roda no próprio Supabase (não depende do PC das notícias). A cada 20 min:
--  1) AUTOCURA: se um pedido editorial (Notícias Brasil/Foz/Curiosidades) tem vídeo NOVO aprovado que não virou
--     principal (foi o que aconteceu de 29 a 31/10), o radar torna esse vídeo o principal e manda às telas.
--  2) ALARME: se o vídeo principal de um pedido vigiado está mais velho que o limite, a Sofia avisa o CEO no
--     WhatsApp (repete a cada 6 h enquanto não resolver, só entre 07h e 22h).
-- Pedidos vigiados ficam na tabela exa_radar_conteudo (dá para incluir qualquer cliente com prazo de troca).

create table if not exists public.exa_radar_conteudo (
  pedido_id uuid primary key,
  nome text not null,
  max_horas int not null,                 -- idade máxima do vídeo principal no ar
  autocura boolean not null default false, -- promove sozinho o vídeo aprovado mais novo
  ativo boolean not null default true,
  lembrar_horas int not null default 6,
  ultimo_alerta_em timestamptz,
  obs text
);
alter table public.exa_radar_conteudo enable row level security;

create table if not exists public.exa_radar_log (
  id bigserial primary key,
  criado_em timestamptz not null default now(),
  pedido_id uuid,
  tipo text not null,                      -- autocura | alerta | ok
  detalhe jsonb
);
alter table public.exa_radar_log enable row level security;

insert into public.exa_radar_conteudo (pedido_id, nome, max_horas, autocura, ativo, obs) values
  ('c08f3154-e0dc-4c39-b8a2-721d8acdde7f', 'Notícias Brasil', 17, true, true, 'PC gera 07h e 16h'),
  ('9cb8da99-ddb3-491c-b58c-63871eadc4cb', 'Notícias Foz', 17, true, true, 'PC gera 07h e 16h'),
  ('7a4dc868-0ecd-4969-a1ec-5589d399b7c4', 'Curiosidades', 26, true, false, 'suspensa pelo CEO em 29/10 — reativar: update exa_radar_conteudo set ativo=true where nome=''Curiosidades'''),
  ('b4b2f33a-d37d-40a8-98fb-77177fa0b35f', 'Cine Cataratas', 168, false, true, 'vídeo da programação do cinema: trocar toda semana')
on conflict (pedido_id) do update set nome = excluded.nome, max_horas = excluded.max_horas, autocura = excluded.autocura, obs = excluded.obs;

create or replace function public.exa_radar_conteudo_rodar(p_dry boolean default false, p_forcar_aviso boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r record; base record; cand record;
  agora timestamptz := now();
  hora_br int := extract(hour from (now() at time zone 'America/Sao_Paulo'));
  idade_h numeric;
  problemas text[] := '{}';
  curas text[] := '{}';
  avisar_ids uuid[] := '{}';
  res jsonb := '[]'::jsonb;
  cron_token text := (select valor from public.exa2_config where chave = 'cron_token');
  ceo text := coalesce((select telefone from public.exa_alerts_directors where departamento = 'CEO' and ativo order by created_at limit 1), '45998090000');
  anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk';
  texto text;
  fmt text := 'DD/MM HH24:MI';
begin
  for r in select * from public.exa_radar_conteudo where ativo order by nome loop
    select pv.id, pv.created_at, v.nome into base
      from public.pedido_videos pv join public.videos v on v.id = pv.video_id
      where pv.pedido_id = r.pedido_id and pv.is_base_video
      order by pv.updated_at desc limit 1;

    -- 1) AUTOCURA: vídeo aprovado mais novo que o principal e que ficou "esquecido"
    if r.autocura then
      select pv.id, pv.created_at, v.nome into cand
        from public.pedido_videos pv join public.videos v on v.id = pv.video_id
        where pv.pedido_id = r.pedido_id and not pv.is_base_video and pv.approval_status = 'approved'
          and pv.created_at > coalesce(base.created_at, '-infinity'::timestamptz) + interval '20 minutes' -- não troca pela versão curta da mesma rodada
          and pv.created_at < agora - interval '10 minutes'        -- dá tempo do robô terminar sozinho
          and pv.created_at > agora - interval '36 hours'
          and pv.created_at >= (select max(x.created_at) from public.pedido_videos x where x.pedido_id = r.pedido_id and x.approval_status = 'approved') - interval '20 minutes'
        order by v.duracao desc nulls last, pv.created_at desc
        limit 1;
      if cand.id is not null then
        if not p_dry then
          perform public.safe_set_base_video(cand.id);
          if cron_token is not null then
            perform net.http_post(
              url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa2-agenda-sync',
              headers := jsonb_build_object('Content-Type', 'application/json', 'x-exa2-cron', cron_token),
              body := jsonb_build_object('pedido_id', r.pedido_id),
              timeout_milliseconds := 120000);
          end if;
          insert into public.exa_radar_log (pedido_id, tipo, detalhe)
            values (r.pedido_id, 'autocura', jsonb_build_object('de', base.nome, 'para', cand.nome));
        end if;
        curas := curas || format('✅ *%s*: o vídeo "%s" tinha sido enviado mas não virou principal — coloquei no ar agora (antes: "%s").', r.nome, cand.nome, coalesce(base.nome, 'nenhum'));
        res := res || jsonb_build_object('pedido', r.nome, 'autocura', cand.nome);
        base.id := cand.id; base.created_at := cand.created_at; base.nome := cand.nome;
      end if;
    end if;

    -- 2) IDADE do principal
    idade_h := case when base.created_at is null then 9999 else round(extract(epoch from agora - base.created_at) / 3600.0, 1) end;
    res := res || jsonb_build_object('pedido', r.nome, 'principal', base.nome, 'idade_h', idade_h, 'limite_h', r.max_horas);
    if idade_h > r.max_horas then
      if r.nome = 'Cine Cataratas' then
        problemas := problemas || format('🎬 *%s* — o vídeo no ar é "%s", publicado em %s (há %s dias). A programação do cinema precisa ser trocada.',
          r.nome, coalesce(base.nome, '—'), to_char(base.created_at at time zone 'America/Sao_Paulo', fmt), round(idade_h / 24.0, 1));
      else
        problemas := problemas || format('❌ *%s* — o vídeo no ar é "%s", de %s (há %s h). Nenhuma edição nova chegou às telas.',
          r.nome, coalesce(base.nome, '—'), to_char(base.created_at at time zone 'America/Sao_Paulo', fmt), round(idade_h));
      end if;
      if p_forcar_aviso or r.ultimo_alerta_em is null or r.ultimo_alerta_em < agora - make_interval(hours => r.lembrar_horas) then
        avisar_ids := avisar_ids || r.pedido_id;
      end if;
    end if;
  end loop;

  -- 3) AVISO À SOFIA → CEO (autocura avisa sempre; atraso avisa entre 07h e 22h, repetindo a cada 6 h)
  if not p_dry and (array_length(curas, 1) > 0 or (array_length(avisar_ids, 1) > 0 and (p_forcar_aviso or hora_br between 7 and 21))) then
    texto := 'Jeferson, aqui é a Sofia. 🛰️ *Radar de conteúdo das telas*' || E'\n';
    if array_length(curas, 1) > 0 then texto := texto || E'\n' || array_to_string(curas, E'\n'); end if;
    if array_length(problemas, 1) > 0 and array_length(avisar_ids, 1) > 0 then
      texto := texto || E'\n\n' || array_to_string(problemas, E'\n\n')
        || E'\n\n👉 Notícias: no PC, pasta scripts\\noticias-dooh → *GERAR NOTICIAS BRASIL E FOZ.bat*. Se o PC estiver ligado e mesmo assim não subir, me chame aqui.'
        || E'\nVou lembrar de novo em 6 h enquanto não resolver.';
    end if;
    perform net.http_post(
      url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/zapi-send-message',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || anon, 'apikey', anon),
      body := jsonb_build_object('agentKey', 'sofia', 'phone', ceo, 'message', texto),
      timeout_milliseconds := 30000);
    if array_length(avisar_ids, 1) > 0 then
      update public.exa_radar_conteudo set ultimo_alerta_em = agora where pedido_id = any(avisar_ids);
    end if;
    insert into public.exa_radar_log (tipo, detalhe) values ('alerta', jsonb_build_object('texto', texto));
  end if;

  -- pedido resolvido → zera o lembrete
  if not p_dry then
    update public.exa_radar_conteudo c set ultimo_alerta_em = null
      where c.ativo and c.ultimo_alerta_em is not null and not (c.pedido_id = any(avisar_ids))
        and not exists (select 1 from jsonb_array_elements(res) e where e->>'pedido' = c.nome and (e->>'idade_h')::numeric > c.max_horas);
  end if;

  return jsonb_build_object('quando', to_char(agora at time zone 'America/Sao_Paulo', fmt), 'itens', res, 'problemas', to_jsonb(problemas), 'autocura', to_jsonb(curas));
end;
$$;

revoke all on function public.exa_radar_conteudo_rodar(boolean, boolean) from public, anon, authenticated;

select cron.unschedule(jobname) from cron.job where jobname = 'exa-radar-conteudo';
select cron.schedule('exa-radar-conteudo', '*/20 * * * *', $$select public.exa_radar_conteudo_rodar()$$);

-- primeira rodada já avisando (teste do WhatsApp) e mostrando o resultado
select public.exa_radar_conteudo_rodar(false, true) as resultado;
