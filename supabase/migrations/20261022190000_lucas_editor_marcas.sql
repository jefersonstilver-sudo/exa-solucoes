-- Lucas Editor: pasta da marca de cada cliente (ficha + arquivos), usada para criar os videos
-- e como historico/referencia para os proximos. Arquivos no bucket "marcas":
--   marcas/{marca_id}/logo/..., fotos/, videos/, pdfs/, banco/, finais/

create table if not exists public.marcas_clientes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.users(id) on delete set null,      -- conta do cliente (quando existe)
  contact_id uuid references public.sofia_contacts(id) on delete set null, -- contato do WhatsApp que montou a ficha
  empresa text not null,
  segmento text,
  cores jsonb not null default '[]'::jsonb,     -- [{nome, hex, uso}]
  fontes jsonb not null default '[]'::jsonb,    -- ["Oswald", "Playfair Display"]
  tom_de_voz text,
  proibido text,                                -- o que nunca pode aparecer (ex.: imagem de IA, pessoas bebendo)
  slogan text,
  instagram text,
  whatsapp_qr text,
  endereco text,
  site text,
  logo jsonb,                                   -- {url, path, transparente, aprovada, largura, altura}
  estrategia jsonb,                             -- {qtd: 1|3|4, videos: [{n, tema, mensagem}]}
  banco_autorizado boolean not null default false, -- cliente autorizou usar videos de banco (Coverr)
  banco_termos text[] not null default '{}',
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists marcas_clientes_client_uq on public.marcas_clientes(client_id) where client_id is not null;
create unique index if not exists marcas_clientes_contact_uq on public.marcas_clientes(contact_id) where client_id is null and contact_id is not null;

create table if not exists public.marca_arquivos (
  id uuid primary key default gen_random_uuid(),
  marca_id uuid not null references public.marcas_clientes(id) on delete cascade,
  tipo text not null check (tipo in ('logo', 'foto', 'video', 'pdf', 'print', 'banco', 'video_final', 'referencia')),
  url text not null,
  path text,
  legenda text,
  origem text not null default 'whatsapp' check (origem in ('whatsapp', 'admin', 'coverr', 'lucas')),
  meta jsonb not null default '{}'::jsonb,      -- largura, altura, duracao, job_id, formato, coverr_id...
  created_at timestamptz not null default now(),
  unique (marca_id, url)
);
create index if not exists marca_arquivos_marca_idx on public.marca_arquivos(marca_id, tipo, created_at desc);

create or replace function public.marcas_clientes_touch()
returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists trg_marcas_clientes_touch on public.marcas_clientes;
create trigger trg_marcas_clientes_touch before update on public.marcas_clientes
  for each row execute function public.marcas_clientes_touch();

alter table public.marcas_clientes enable row level security;
alter table public.marca_arquivos enable row level security;

drop policy if exists "Admins gerenciam marcas" on public.marcas_clientes;
create policy "Admins gerenciam marcas" on public.marcas_clientes for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin'::app_role) or public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'super_admin'::app_role) or public.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Cliente ve a propria marca" on public.marcas_clientes;
create policy "Cliente ve a propria marca" on public.marcas_clientes for select to authenticated
  using (client_id = auth.uid());

drop policy if exists "Admins gerenciam arquivos de marca" on public.marca_arquivos;
create policy "Admins gerenciam arquivos de marca" on public.marca_arquivos for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin'::app_role) or public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'super_admin'::app_role) or public.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Cliente ve os proprios arquivos de marca" on public.marca_arquivos;
create policy "Cliente ve os proprios arquivos de marca" on public.marca_arquivos for select to authenticated
  using (exists (select 1 from public.marcas_clientes m where m.id = marca_id and m.client_id = auth.uid()));

-- bucket publico (o WhatsApp e o render precisam baixar por URL); caminhos com uuid
insert into storage.buckets (id, name, public, file_size_limit)
values ('marcas', 'marcas', true, 104857600)
on conflict (id) do nothing;
