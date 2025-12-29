-- Função de limpeza de sessões expiradas (não deleta; apenas marca como encerrada)
create or replace function public.cleanup_expired_user_sessions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  update public.user_sessions
  set
    is_active = false,
    terminated_at = coalesce(terminated_at, now())
  where is_active = true
    and expires_at < now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Agendar execução automática via pg_cron (a cada 1 minuto)
create extension if not exists pg_cron with schema extensions;

do $$
begin
  -- Evita duplicar agendamento
  if exists (select 1 from cron.job where jobname = 'cleanup-expired-user-sessions') then
    perform cron.unschedule('cleanup-expired-user-sessions');
  end if;

  perform cron.schedule(
    'cleanup-expired-user-sessions',
    '* * * * *',
    'select public.cleanup_expired_user_sessions();'
  );
end;
$$;