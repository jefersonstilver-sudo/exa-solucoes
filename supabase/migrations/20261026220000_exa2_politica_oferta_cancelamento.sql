-- ============================================================
-- EXA 2.0 · Política de cancelamento por oferta (aditivo, não apaga nada)
-- PROMO-OUT-2026 (Sofia): R$99/mês por prédio, 6 meses, SEM multa,
-- cancelamento livre com aviso até 5 dias antes da virada do mês.
-- ============================================================

-- 1) Campos de aviso prévio na proposta e no contrato (padrão = regra antiga: 30 dias)
alter table public.proposals        add column if not exists cancelamento_aviso_dias int not null default 30;
alter table public.proposals        add column if not exists cancelamento_ate_virada_mes boolean not null default false;
alter table public.contratos_legais add column if not exists cancelamento_aviso_dias int not null default 30;
alter table public.contratos_legais add column if not exists cancelamento_ate_virada_mes boolean not null default false;

-- 2) Tabela de políticas por oferta (muda a regra sem mexer em código)
create table if not exists public.exa2_ofertas_politica (
  oferta                      text primary key,
  descricao                   text,
  multa_rescisao_ativa        boolean not null default true,
  multa_rescisao_percentual   numeric not null default 20,
  cancelamento_aviso_dias     int     not null default 30,
  cancelamento_ate_virada_mes boolean not null default false,
  ativa                       boolean not null default true,
  atualizado_em               timestamptz not null default now()
);
alter table public.exa2_ofertas_politica enable row level security;
drop policy if exists "Admins gerenciam politicas de oferta" on public.exa2_ofertas_politica;
create policy "Admins gerenciam politicas de oferta" on public.exa2_ofertas_politica for all to authenticated
  using (public.has_role(auth.uid(),'super_admin'::app_role) or public.has_role(auth.uid(),'admin'::app_role))
  with check (public.has_role(auth.uid(),'super_admin'::app_role) or public.has_role(auth.uid(),'admin'::app_role));

insert into public.exa2_ofertas_politica (oferta, descricao, multa_rescisao_ativa, multa_rescisao_percentual, cancelamento_aviso_dias, cancelamento_ate_virada_mes)
values ('PROMO-OUT-2026', 'R$99/mês por prédio, fidelidade 6 meses, cancelamento livre com aviso até 5 dias antes da virada do mês', false, 0, 5, true)
on conflict (oferta) do update set
  descricao = excluded.descricao, multa_rescisao_ativa = excluded.multa_rescisao_ativa,
  multa_rescisao_percentual = excluded.multa_rescisao_percentual, cancelamento_aviso_dias = excluded.cancelamento_aviso_dias,
  cancelamento_ate_virada_mes = excluded.cancelamento_ate_virada_mes, ativa = true, atualizado_em = now();

-- 3) Quando a Sofia liga o aceite à proposta, a proposta recebe a política da oferta
create or replace function public.exa2_aplicar_politica_oferta() returns trigger
language plpgsql security definer set search_path = public as $$
declare pol public.exa2_ofertas_politica;
begin
  if new.proposal_id is null or coalesce(new.dados->>'oferta','') = '' then return new; end if;
  select * into pol from public.exa2_ofertas_politica where oferta = new.dados->>'oferta' and ativa;
  if not found then return new; end if;
  update public.proposals set
    multa_rescisao_ativa        = pol.multa_rescisao_ativa,
    multa_rescisao_percentual   = pol.multa_rescisao_percentual,
    cancelamento_aviso_dias     = pol.cancelamento_aviso_dias,
    cancelamento_ate_virada_mes = pol.cancelamento_ate_virada_mes
  where id::text = new.proposal_id;
  return new;
exception when others then
  return new;   -- nunca bloquear a venda da Sofia
end $$;
revoke execute on function public.exa2_aplicar_politica_oferta() from public, anon, authenticated;

drop trigger if exists trg_exa2_politica_oferta on public.sofia_aceites;
create trigger trg_exa2_politica_oferta
  after insert or update of proposal_id, dados on public.sofia_aceites
  for each row execute function public.exa2_aplicar_politica_oferta();

-- 4) Propostas promocionais AINDA NÃO ASSINADAS passam a seguir a política
--    (contratos já gerados/assinados NÃO são alterados aqui)
update public.proposals p set
  multa_rescisao_ativa = false, multa_rescisao_percentual = 0,
  cancelamento_aviso_dias = 5, cancelamento_ate_virada_mes = true
from public.sofia_aceites a
where a.proposal_id = p.id::text and a.dados->>'oferta' = 'PROMO-OUT-2026'
  and not exists (select 1 from public.contratos_legais c where c.proposta_id::text = p.id::text);

-- 5) Conhecimento da Sofia: regra oficial de cancelamento da promoção
insert into public.agent_knowledge_items (agent_id, title, keywords, content_type, content, instruction, active, display_order)
select 'sofia', 'Promoção R$99 (PROMO-OUT-2026) — Fidelidade e Cancelamento',
  array['cancelar','cancelamento','fidelidade','multa','promoção','99','desistir','rescisão','aviso'],
  'text',
  'PROMOÇÃO PROMO-OUT-2026 — R$ 99/mês por prédio, plano de 6 meses (fidelidade).

CANCELAMENTO: o cliente pode cancelar QUANDO QUISER, SEM MULTA. Basta avisar até 5 dias antes da virada do mês. Ex.: para não ser cobrado em dezembro, avisar até 26 de novembro. A veiculação segue até o fim do mês em curso e a cobrança do mês seguinte não é gerada.
Se o aviso vier com menos de 5 dias da virada, o cancelamento vale para a virada do mês seguinte.

Ao confirmar um cancelamento: registrar o pedido, confirmar por e-mail ao cliente e cancelar as cobranças futuras.',
  'Ao vender ou responder sobre a promoção de R$99, SEMPRE explicar: fidelidade de 6 meses, mas cancelamento livre e sem multa com aviso até 5 dias antes da virada do mês. Nunca citar multa de 20% para esta promoção.',
  true, 1
where not exists (select 1 from public.agent_knowledge_items where agent_id='sofia' and title like 'Promoção R$99 (PROMO-OUT-2026)%');
