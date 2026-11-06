-- 06/11/2026: auto-cura + alerta das telas Android (exa-tela acao 'vigia', cron exa-telas-vigia a cada 5 min)
-- vigia = { problema: 'travada'|'sem_sinal', desde, passo: 1 recarregar | 2 reiniciar_app | 3 Nando avisou, passo_em, avisado_em, texto }
alter table public.exa_telas add column if not exists vigia jsonb;
