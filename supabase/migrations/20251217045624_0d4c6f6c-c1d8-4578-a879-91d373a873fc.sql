-- Atualizar todas as visualizações dos prédios ativos para o valor correto do Manual v3.0
-- Fórmula: 11.610 exibições/mês por tela (387 ciclos/dia × 30 dias)
UPDATE buildings 
SET visualizacoes_mes = COALESCE(quantidade_telas, 1) * 11610
WHERE status = 'ativo';

-- Log de quantos foram atualizados
DO $$
DECLARE
  count_updated INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_updated FROM buildings WHERE status = 'ativo';
  RAISE NOTICE 'Atualizados % prédios com visualizações = quantidade_telas × 11610', count_updated;
END $$;