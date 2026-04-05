-- Migration: Storage foundation for evidence assets
-- Creates the canonical evidence bucket and locks down direct access patterns.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sdmx-evidence',
  'sdmx-evidence',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.file_assets enable row level security;

drop policy if exists "service_role_manages_file_assets" on public.file_assets;
create policy "service_role_manages_file_assets"
on public.file_assets
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists "authenticated_reads_file_assets" on public.file_assets;
create policy "authenticated_reads_file_assets"
on public.file_assets
as permissive
for select
to authenticated
using (true);

alter table storage.objects enable row level security;

drop policy if exists "public_reads_sdmx_evidence" on storage.objects;
create policy "public_reads_sdmx_evidence"
on storage.objects
as permissive
for select
to public
using (bucket_id = 'sdmx-evidence');

drop policy if exists "service_role_manages_sdmx_evidence" on storage.objects;
create policy "service_role_manages_sdmx_evidence"
on storage.objects
as permissive
for all
to service_role
using (bucket_id = 'sdmx-evidence')
with check (bucket_id = 'sdmx-evidence');

comment on table public.file_assets is 'Registro canonico de evidencias y archivos ligados a ordenes/solicitudes del tenant.';
