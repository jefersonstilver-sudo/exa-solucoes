-- Limpar painéis de teste (001, 002, 003)
DELETE FROM paineis_status 
WHERE painel_id IN (
  SELECT id FROM painels WHERE numero_painel IN ('001', '002', '003')
);

DELETE FROM painels 
WHERE numero_painel IN ('001', '002', '003');

-- Corrigir links de painéis existentes que não têm https://
UPDATE painels 
SET link_instalacao = 'https://64f6806c-c0e0-422b-b85f-955fd5719544.lovableproject.com/painel-kiosk/' || token_acesso
WHERE link_instalacao NOT LIKE 'https://%' OR link_instalacao LIKE '%examidia.com.br%';