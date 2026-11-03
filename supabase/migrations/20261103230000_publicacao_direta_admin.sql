-- Publicação direta pela administração (03/11/2026)
-- Quando super_admin/admin publica um vídeo no pedido de um cliente (via "acessar como cliente"),
-- o vídeo entra aprovado na hora, sem fila de aprovação e sem notificação,
-- e fica um registro visível ao cliente: "Publicado pela administração EXA".
-- Aplicada pelo SQL Editor (não rodar pelo Lovable).

-- 1) Registro de eventos do pedido, legível pelo dono do pedido e pela equipe
create table if not exists public.pedido_videos_eventos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  pedido_video_id uuid,
  video_id uuid,
  video_nome text,
  evento text not null,            -- 'publicado_pela_administracao'
  origem text not null default 'administracao',
  autor_id uuid,                   -- não exibido ao cliente
  created_at timestamptz not null default now()
);
create index if not exists pedido_videos_eventos_pedido_idx
  on public.pedido_videos_eventos (pedido_id, created_at desc);

alter table public.pedido_videos_eventos enable row level security;
revoke all on public.pedido_videos_eventos from anon;
revoke insert, update, delete on public.pedido_videos_eventos from authenticated;
grant select on public.pedido_videos_eventos to authenticated;

drop policy if exists "Dono do pedido e equipe leem eventos" on public.pedido_videos_eventos;
create policy "Dono do pedido e equipe leem eventos"
  on public.pedido_videos_eventos for select to authenticated
  using (public.can_access_order(pedido_id));

-- 2) Aprovação direta quando quem publica é a administração
create or replace function public.auto_approve_admin_published_video()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_client uuid;
  v_nome text;
begin
  -- só sessão de usuário logado (nunca service_role/robôs internos)
  if v_uid is null or coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;
  -- só quando entra um vídeo novo no slot (não em reordenação/edição de outro campo)
  if tg_op = 'UPDATE' and new.video_id is not distinct from old.video_id then
    return new;
  end if;
  if not exists (
    select 1 from public.user_roles r
    where r.user_id = v_uid and r.role::text in ('super_admin', 'admin')
  ) then
    return new;
  end if;
  select client_id into v_client from public.pedidos where id = new.pedido_id;
  -- o próprio admin publicando no pedido dele segue a regra normal
  if v_client is null or v_client = v_uid then
    return new;
  end if;

  new.approval_status := 'approved';
  new.approved_at := now();
  new.approved_by := v_uid;
  new.rejection_reason := null;

  -- avisa os gatilhos de notificação desta transação para ficarem calados
  perform set_config('exa.publicacao_admin', '1', true);

  select nome into v_nome from public.videos where id = new.video_id;
  insert into public.pedido_videos_eventos (pedido_id, pedido_video_id, video_id, video_nome, evento, origem, autor_id)
  values (new.pedido_id, new.id, new.video_id, v_nome, 'publicado_pela_administracao', 'administracao', v_uid);

  return new;
end;
$$;

revoke all on function public.auto_approve_admin_published_video() from public, anon, authenticated;

drop trigger if exists trg_auto_approve_admin_published_video on public.pedido_videos;
create trigger trg_auto_approve_admin_published_video
  before insert or update of video_id on public.pedido_videos
  for each row execute function public.auto_approve_admin_published_video();

-- 3) Notificações (sininho do cliente e dos admins) não disparam em publicação da administração
do $$
declare
  f text;
  def text;
begin
  foreach f in array array['notify_video_status_change', 'notify_video_uploaded'] loop
    select pg_get_functiondef(p.oid) into def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = f and p.pronargs = 0;
    if def is not null and position('exa.publicacao_admin' in def) = 0 then
      def := regexp_replace(def, '\mBEGIN\M',
        'BEGIN' || chr(10) || '  IF current_setting(''exa.publicacao_admin'', true) = ''1'' THEN RETURN NEW; END IF;');
      execute def;
    end if;
  end loop;
end $$;
