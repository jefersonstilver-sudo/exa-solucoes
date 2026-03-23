ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_building_id_fkey;
ALTER TABLE devices ADD CONSTRAINT devices_building_id_fkey 
  FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL;

ALTER TABLE client_behavior_analytics DROP CONSTRAINT IF EXISTS client_behavior_analytics_most_viewed_building_id_fkey;
ALTER TABLE client_behavior_analytics ADD CONSTRAINT client_behavior_analytics_most_viewed_building_id_fkey 
  FOREIGN KEY (most_viewed_building_id) REFERENCES buildings(id) ON DELETE SET NULL;

ALTER TABLE despesas_fixas DROP CONSTRAINT IF EXISTS despesas_fixas_building_id_fkey;
ALTER TABLE despesas_fixas ADD CONSTRAINT despesas_fixas_building_id_fkey 
  FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL;

ALTER TABLE despesas_variaveis DROP CONSTRAINT IF EXISTS despesas_variaveis_building_id_fkey;
ALTER TABLE despesas_variaveis ADD CONSTRAINT despesas_variaveis_building_id_fkey 
  FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_building_id_fkey;
ALTER TABLE tasks ADD CONSTRAINT tasks_building_id_fkey 
  FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL;