-- Sincronizar quantidade_telas com numero_elevadores para todos os prédios ativos
UPDATE buildings 
SET quantidade_telas = numero_elevadores 
WHERE numero_elevadores > 0 AND (quantidade_telas IS NULL OR quantidade_telas = 0);