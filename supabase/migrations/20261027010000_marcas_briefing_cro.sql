-- Briefing estrategico (CRO) da marca coletado pelo Lucas: objetivo, publico, diferenciais, prova, oferta, onde comprar, diagnostico.
alter table public.marcas_clientes add column if not exists briefing jsonb not null default '{}'::jsonb;
