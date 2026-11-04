-- =====================================================================
-- Retornos agendados da Sofia (04/11/2026)
-- Antes: um único campo sofia_contacts.notes.retorno, sobrescrito a cada novo agendamento, e o disparo
-- podia ser pulado em silêncio (o texto da retomada voltava "NADA" e ninguém ficava sabendo).
-- Agora: cada retorno é uma linha com status (pendente → feito / falhou / cancelado / cliente_voltou),
-- tentativas, a mensagem enviada e o erro. O painel mostra o retorno na lista (asterisco) e na ficha.
-- =====================================================================
create table if not exists public.sofia_retornos (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.sofia_contacts(id) on delete cascade,
  conversation_id uuid references public.sofia_conversations(id) on delete set null,
  quando timestamptz not null,
  motivo text,
  origem text not null default 'sofia' check (origem in ('sofia', 'promessa_detectada', 'equipe', 'missao', 'migrado')),
  status text not null default 'pendente' check (status in ('pendente', 'executando', 'feito', 'falhou', 'cancelado', 'cliente_voltou')),
  tentativas int not null default 0,
  mensagem text,
  erro text,
  executado_em timestamptz,
  criado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sofia_retornos_fila on public.sofia_retornos (status, quando);
create index if not exists sofia_retornos_contato on public.sofia_retornos (contact_id);
create index if not exists sofia_retornos_conversa on public.sofia_retornos (conversation_id);
alter table public.sofia_retornos enable row level security;
revoke all on public.sofia_retornos from anon, authenticated;

-- retornos que estavam só no notes.retorno passam para a tabela
insert into public.sofia_retornos (contact_id, conversation_id, quando, motivo, origem)
select ct.id,
       (select c.id from public.sofia_conversations c where c.contact_id = ct.id order by c.last_message_at desc nulls last limit 1),
       (ct.notes->'retorno'->>'em')::timestamptz,
       ct.notes->'retorno'->>'motivo',
       'migrado'
from public.sofia_contacts ct
where ct.notes->'retorno'->>'em' is not null
  and not exists (select 1 from public.sofia_retornos r where r.contact_id = ct.id and r.status = 'pendente');

-- ---------------------------------------------------------------- painel (só admin / super_admin)
-- lista de conversas: próximo retorno pendente e falhas, para o asterisco
create or replace function public.sofia_retornos_resumo()
returns table (conversation_id uuid, contact_id uuid, proximo timestamptz, pendentes int, falhas int)
language sql stable security definer set search_path = public as $$
  select coalesce(r.conversation_id, (select c.id from sofia_conversations c where c.contact_id = r.contact_id order by c.last_message_at desc nulls last limit 1)),
         r.contact_id,
         min(r.quando) filter (where r.status in ('pendente', 'executando')),
         (count(*) filter (where r.status in ('pendente', 'executando')))::int,
         (count(*) filter (where r.status = 'falhou'))::int
  from sofia_retornos r
  where public.is_admin_or_super() and r.status in ('pendente', 'executando', 'falhou')
  group by 1, 2;
$$;

-- histórico de uma conversa (pendentes primeiro, depois os últimos 20)
create or replace function public.sofia_retornos_conversa(p_conversation uuid)
returns setof public.sofia_retornos
language sql stable security definer set search_path = public as $$
  select r.* from sofia_retornos r
  where public.is_admin_or_super()
    and (r.conversation_id = p_conversation
         or r.contact_id = (select contact_id from sofia_conversations where id = p_conversation))
  order by (r.status in ('pendente', 'executando', 'falhou')) desc, r.quando desc
  limit 30;
$$;

create or replace function public.sofia_retorno_criar(p_conversation uuid, p_quando timestamptz, p_motivo text)
returns public.sofia_retornos
language plpgsql security definer set search_path = public as $$
declare v_contact uuid; v_nome text; v_row sofia_retornos;
begin
  if not public.is_admin_or_super() then raise exception 'sem permissão'; end if;
  if p_quando < now() + interval '2 minutes' then raise exception 'escolha um horário no futuro'; end if;
  if p_quando > now() + interval '60 days' then raise exception 'no máximo 60 dias à frente'; end if;
  select contact_id into v_contact from sofia_conversations where id = p_conversation;
  if v_contact is null then raise exception 'conversa não encontrada'; end if;
  select coalesce(nome, email) into v_nome from users where id = auth.uid();
  insert into sofia_retornos (contact_id, conversation_id, quando, motivo, origem, criado_por)
  values (v_contact, p_conversation, p_quando, left(coalesce(p_motivo, ''), 400), 'equipe', coalesce(v_nome, 'Equipe EXA'))
  returning * into v_row;
  update sofia_contacts set notes = coalesce(notes, '{}'::jsonb) || jsonb_build_object('retorno',
    jsonb_build_object('em', p_quando, 'motivo', left(coalesce(p_motivo, ''), 300), 'criado', now()))
  where id = v_contact;
  return v_row;
end $$;

create or replace function public.sofia_retorno_cancelar(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_contact uuid; v_prox sofia_retornos;
begin
  if not public.is_admin_or_super() then raise exception 'sem permissão'; end if;
  update sofia_retornos set status = 'cancelado', erro = 'cancelado pela equipe', updated_at = now()
  where id = p_id and status in ('pendente', 'falhou') returning contact_id into v_contact;
  if v_contact is null then raise exception 'retorno não encontrado ou já executado'; end if;
  select * into v_prox from sofia_retornos where contact_id = v_contact and status = 'pendente' order by quando limit 1;
  update sofia_contacts set notes = case when v_prox.id is null then notes - 'retorno'
    else notes || jsonb_build_object('retorno', jsonb_build_object('em', v_prox.quando, 'motivo', v_prox.motivo, 'criado', v_prox.created_at)) end
  where id = v_contact;
end $$;

revoke all on function public.sofia_retornos_resumo() from public, anon;
revoke all on function public.sofia_retornos_conversa(uuid) from public, anon;
revoke all on function public.sofia_retorno_criar(uuid, timestamptz, text) from public, anon;
revoke all on function public.sofia_retorno_cancelar(uuid) from public, anon;
grant execute on function public.sofia_retornos_resumo() to authenticated;
grant execute on function public.sofia_retornos_conversa(uuid) to authenticated;
grant execute on function public.sofia_retorno_criar(uuid, timestamptz, text) to authenticated;
grant execute on function public.sofia_retorno_cancelar(uuid) to authenticated;
