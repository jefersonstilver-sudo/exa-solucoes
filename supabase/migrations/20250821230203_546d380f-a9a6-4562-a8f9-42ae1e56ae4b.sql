-- Create a dedicated public bucket for logos (idempotent)
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Allow public READ access to logo files (so the homepage ticker can display them)
create policy if not exists "Public can view logos bucket"
on storage.objects
for select
using (bucket_id = 'logos');

-- Allow admins to upload new logo files
create policy if not exists "Admins can upload logos"
on storage.objects
for insert
with check (
  bucket_id = 'logos'
  and exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin','super_admin')
  )
);

-- Allow admins to update logo files (e.g., replace)
create policy if not exists "Admins can update logos"
on storage.objects
for update
using (
  bucket_id = 'logos'
  and exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin','super_admin')
  )
)
with check (
  bucket_id = 'logos'
  and exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin','super_admin')
  )
);

-- Allow admins to delete logo files if needed
create policy if not exists "Admins can delete logos"
on storage.objects
for delete
using (
  bucket_id = 'logos'
  and exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin','super_admin')
  )
);
