-- Adicionar foreign key missing na tabela building_action_logs
-- Esta foreign key é necessária para as queries de join funcionarem corretamente

ALTER TABLE building_action_logs 
ADD CONSTRAINT building_action_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Também adicionar foreign key para building_id se não existir
ALTER TABLE building_action_logs 
ADD CONSTRAINT building_action_logs_building_id_fkey 
FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE;