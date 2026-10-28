-- EXA 2.0 — Saúde por NUC (um prédio pode ter 2+ NUCs com o mesmo código de tela). Rodar no ExaSistema.
alter table public.telas_saude add column if not exists nuc_id text not null default '';
alter table public.telas_saude add column if not exists anydesk_id text;
alter table public.telas_saude_log add column if not exists nuc_id text not null default '';
alter table public.telas_saude drop constraint if exists telas_saude_pkey;
alter table public.telas_saude add primary key (cliente_id, nuc_id);
create index if not exists telas_saude_log_nuc_idx on public.telas_saude_log (cliente_id, nuc_id, visto_em desc);

create or replace function public.telas_registrar_saude(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id  text := p->>'cliente_id';
  v_nuc text := left(coalesce(p->>'nuc_id', ''), 40);
begin
  if v_id is null or length(p::text) > 20000
     or not exists (select 1 from public.updates_clientes where cliente_id = v_id) then
    return;
  end if;
  -- no máx. 1 registro a cada 5 min por NUC (protege contra envio em laço)
  if exists (select 1 from public.telas_saude where cliente_id = v_id and nuc_id = v_nuc and visto_em > now() - interval '5 minutes') then
    return;
  end if;
  insert into public.telas_saude (cliente_id, nuc_id, anydesk_id, dados, visto_em) values (v_id, v_nuc, p->>'anydesk_id', p, now())
  on conflict (cliente_id, nuc_id) do update set dados = excluded.dados, anydesk_id = excluded.anydesk_id, visto_em = now();
  insert into public.telas_saude_log (cliente_id, nuc_id, dados) values (v_id, v_nuc, p);
  if random() < 0.01 then
    delete from public.telas_saude_log where visto_em < now() - interval '30 days';
  end if;
end $$;

revoke all on function public.telas_registrar_saude(jsonb) from public;
grant execute on function public.telas_registrar_saude(jsonb) to anon, authenticated, service_role;
select 'OK: saude por NUC' as resultado;
