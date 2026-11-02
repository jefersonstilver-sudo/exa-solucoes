-- EXA · segurança lote E (02/11/2026, aplicado no banco). Backup em public.seg_backup_20261102.
-- 1) Página pública da proposta lê só a própria proposta (a política "Acesso público via token" deixava listar as 186).
create or replace function public.proposta_publica(p_id uuid)
returns setof public.proposals language sql stable security definer set search_path = public as $$
  select * from public.proposals where id = p_id and access_token is not null;
$$;
revoke all on function public.proposta_publica(uuid) from public;
grant execute on function public.proposta_publica(uuid) to anon, authenticated, service_role;

-- 2) Ninguém troca o próprio papel. Antes: cliente fazia update na própria linha de public.users com role='admin'
--    e o gatilho sync_users_role_to_user_roles o promovia a admin em user_roles.
create or replace function public.exa_protege_papel() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if new.role is distinct from old.role and not public.exa_eh_equipe(array['super_admin','admin']) then
      raise exception 'não autorizado a alterar o papel' using errcode = '42501';
    end if;
  elsif tg_op = 'INSERT' then
    if coalesce(new.role,'client') <> 'client' and not public.exa_eh_equipe(array['super_admin','admin']) then
      new.role := 'client';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists "00_exa_protege_papel" on public.users;
create trigger "00_exa_protege_papel" before insert or update on public.users for each row execute function public.exa_protege_papel();

-- 3) Código por WhatsApp: limite de tentativas
alter table public.exa_alerts_verification_codes add column if not exists tentativas int not null default 0;

-- 4) Funções da área do cliente conferem o dono (activate_video, set_base_video, safe_set_base_video, log_client_activity,
--    sync_auth_user_to_public) e rotinas de manutenção deixam de ser chamáveis por anônimo. Aplicado por bloco DO no editor
--    (injeta IF NOT (exa_eh_equipe() OR dono) após o BEGIN de cada função).
