-- EXA (06/11/2026) — promoções configuráveis na página Produtos do admin (pedido do Jeferson).
-- O site lê daqui (leitura pública só do que está ativo); antes o R$ 99 estava fixo no código.
create table if not exists public.promocoes_exa (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,                 -- 'predio_99', 'rede_999', 'vertical_1999'
  titulo text not null,
  descricao text,
  produto text not null default 'horizontal' check (produto in ('horizontal','vertical_premium')),
  unidade text not null default 'predio' check (unidade in ('predio','rede')), -- preço por prédio ou pela rede inteira
  preco numeric(12,2) not null,
  plano_meses integer not null default 6,
  inclui_videos boolean not null default true,
  vagas_total integer,                          -- null = sem limite
  vagas_usadas integer not null default 0,
  inicio date,
  fim date,
  ativo boolean not null default true,
  ordem integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.promocoes_exa enable row level security;
drop policy if exists "Admins gerenciam promocoes" on public.promocoes_exa;
create policy "Admins gerenciam promocoes" on public.promocoes_exa for all
  using (exists (select 1 from public.users where users.id = auth.uid() and users.role in ('admin','super_admin')));
drop policy if exists "Leitura publica de promocoes ativas" on public.promocoes_exa;
create policy "Leitura publica de promocoes ativas" on public.promocoes_exa for select using (ativo = true);

insert into public.promocoes_exa (codigo, titulo, descricao, produto, unidade, preco, plano_meses, inclui_videos, vagas_total, inicio, fim, ordem) values
 ('predio_99', 'R$ 99 por prédio, por mês', 'Só em novembro: escolha os prédios que quiser, 6 meses, com a criação dos vídeos inclusa.', 'horizontal', 'predio', 99, 6, true, null, '2026-11-01', '2026-11-30', 1),
 ('rede_999', 'Rede completa por R$ 999/mês', '25 telas nos elevadores de Foz do Iguaçu, 6 meses, com a criação dos vídeos inclusa. Só 10 vagas.', 'horizontal', 'rede', 999, 6, true, 10, '2026-11-01', '2026-11-30', 2),
 ('vertical_1999', 'Vertical Premium em todas as telas', 'Tela cheia, sozinho na tela, em todos os pontos, por R$ 1.999/mês. Última vaga.', 'vertical_premium', 'rede', 1999, 12, true, 1, '2026-11-01', '2026-11-30', 3)
on conflict (codigo) do nothing;

-- os campos de vendedor saem da página Produtos (06/11/2026); o produto fica sem vendedor
update public.produtos_exa set vendedor_responsavel = null, telefone_vendedor = null;
