-- EXA · segurança (02/11/2026): o formulário do síndico passa pela função formulario-sindico,
-- que confere o captcha (Turnstile) no servidor. A RPC deixa de ser chamável pelo navegador.
-- (Já aplicado no SQL Editor em 02/11/2026 22:4x.)
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p
    where p.pronamespace='public'::regnamespace and p.proname='submit_sindico_interesse' loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;
