-- 1. Corrigir a regra de alerta para 60 segundos (1 minuto) como solicitado pelo usuário
UPDATE panel_offline_alert_rules
SET tempo_offline_segundos = 60,
    intervalo_repeticao_segundos = 120,
    updated_at = now()
WHERE id = 'ea7d277e-eb38-40be-a370-07fe321d2dfa';

-- 2. Corrigir telefone do Daher (adicionar dígito 7 no final)
UPDATE panel_offline_alert_recipients
SET telefone = '+5545983730147'
WHERE id = '93d2d7df-03c1-489b-9b83-f188ae51acaa';

-- Nota: O telefone estava +554598373014 (faltando um dígito)