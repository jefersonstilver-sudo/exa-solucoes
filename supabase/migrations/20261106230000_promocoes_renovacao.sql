-- EXA (06/11/2026, noite) — decisão do Jeferson:
-- cliente NOVO paga R$ 1.199/mês pelos 25 pontos; cliente que RENOVA paga R$ 999. A renovação não aparece no site:
-- a Sofia usa. Cupom só para um cliente (Sushi Kamui: R$ 99/prédio, 6 meses, +1 prédio de bônus).
alter table public.promocoes_exa
  add column if not exists onde text not null default 'site' check (onde in ('site','renovacao')),
  add column if not exists cliente_id uuid references public.users(id) on delete set null,   -- cupom: só esta conta
  add column if not exists bonus_predios integer not null default 0;                         -- prédios a mais, de cortesia

-- o site só lê o que é do site (e sem cupom de cliente)
drop policy if exists "Leitura publica de promocoes ativas" on public.promocoes_exa;
create policy "Leitura publica de promocoes ativas" on public.promocoes_exa for select
  using (ativo = true and (onde = 'site' and cliente_id is null or auth.uid() is not null));

update public.promocoes_exa set onde = 'renovacao', titulo = 'Renovação: rede completa por R$ 999/mês',
  descricao = 'Só para quem já é cliente: 25 telas nos elevadores de Foz do Iguaçu, 6 meses, com a criação dos vídeos inclusa.', vagas_total = null
 where codigo = 'rede_999';

insert into public.promocoes_exa (codigo, titulo, descricao, produto, unidade, preco, plano_meses, inclui_videos, vagas_total, inicio, fim, ordem, onde) values
 ('rede_1199', 'Rede completa por R$ 1.199/mês', '25 telas nos elevadores de Foz do Iguaçu, 6 meses, com a criação dos vídeos inclusa. Só 10 vagas.', 'horizontal', 'rede', 1199, 6, true, 10, '2026-11-01', '2026-11-30', 2, 'site')
on conflict (codigo) do nothing;

insert into public.promocoes_exa (codigo, titulo, descricao, produto, unidade, preco, plano_meses, inclui_videos, vagas_total, inicio, fim, ordem, onde, cliente_id, bonus_predios) values
 ('kamui_renova', 'Sushi Kamui: R$ 99 por prédio + 1 prédio de bônus', 'Condição especial de renovação do Sushi Kamui: R$ 99 por prédio por mês, 6 meses, vídeos inclusos, e um prédio a mais de cortesia.', 'horizontal', 'predio', 99, 6, true, 1, '2026-11-01', '2026-11-30', 10, 'renovacao', 'c8458e13-f757-4c8a-abbf-7015bea0a8aa', 1)
on conflict (codigo) do nothing;
