-- Desvincular devices do prédio Rio Negro
UPDATE devices SET building_id = NULL WHERE building_id = 'e2192fc4-8bca-4f8a-b6c3-8573c24b1dfa';

-- Deletar logs de ações relacionados ao prédio
DELETE FROM building_action_logs WHERE building_id = 'e2192fc4-8bca-4f8a-b6c3-8573c24b1dfa';

-- Deletar avisos do prédio
DELETE FROM building_notices WHERE building_id = 'e2192fc4-8bca-4f8a-b6c3-8573c24b1dfa';

-- Deletar o prédio Rio Negro
DELETE FROM buildings WHERE id = 'e2192fc4-8bca-4f8a-b6c3-8573c24b1dfa';