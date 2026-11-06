-- EXA (06/11/2026) — super admin pode subir/remover arquivos das marcas (logos que a equipe já fez para o cliente).
-- Antes só o dono da marca conseguia enviar para marcas/{marca_id}/...
drop policy if exists "Super admin envia para marcas" on storage.objects;
create policy "Super admin envia para marcas" on storage.objects for insert to authenticated
  with check (bucket_id = 'marcas' and public.is_super_admin());

drop policy if exists "Super admin remove de marcas" on storage.objects;
create policy "Super admin remove de marcas" on storage.objects for delete to authenticated
  using (bucket_id = 'marcas' and public.is_super_admin());
