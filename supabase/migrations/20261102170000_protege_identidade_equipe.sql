-- 02/11/2026 (aplicado no banco): a conta do CEO tinha a empresa e o CPF de um cliente (55.304.605 SERGIO LUIS DA ROCHA).
-- Limpeza feita com backup em public.seg_backup_20261102 (tipo 'ceo_users_row').
-- Daqui pra frente, CPF e dados de empresa de conta da EQUIPE só mudam pelo próprio dono, por super_admin logado ou direto no banco.
create or replace function public.exa_protege_identidade_equipe() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.user_roles r where r.user_id = old.id and r.role::text <> 'client')
     and coalesce(auth.role(), '') <> ''
     and auth.uid() is distinct from old.id
     and not (auth.uid() is not null and public.exa_eh_equipe(array['super_admin'])) then
    new.cpf := old.cpf; new.tipo_documento := old.tipo_documento;
    new.empresa_nome := old.empresa_nome; new.empresa_documento := old.empresa_documento; new.empresa_pais := old.empresa_pais;
    new.empresa_segmento := old.empresa_segmento; new.empresa_endereco := old.empresa_endereco;
    new.empresa_aceite_termo := old.empresa_aceite_termo; new.empresa_aceite_termo_data := old.empresa_aceite_termo_data;
  end if;
  return new;
end $$;
drop trigger if exists "01_exa_protege_identidade_equipe" on public.users;
create trigger "01_exa_protege_identidade_equipe" before update on public.users for each row execute function public.exa_protege_identidade_equipe();
