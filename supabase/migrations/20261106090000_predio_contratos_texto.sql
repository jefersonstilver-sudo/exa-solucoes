-- EXA (06/11/2026) — texto do contrato lido pelo Nando (sem a página de log da ClickSign, CPFs mascarados)
alter table public.predio_contratos add column if not exists texto text;
