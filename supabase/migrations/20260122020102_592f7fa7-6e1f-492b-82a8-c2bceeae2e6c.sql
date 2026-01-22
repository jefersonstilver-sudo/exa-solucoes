-- Consolidar departamentos: desativar "Operação" e "IA & Automação"
-- Esses dois devem ser absorvidos por "Administrativo"

UPDATE process_departments 
SET is_active = false, updated_at = now()
WHERE name IN ('Operação', 'IA & Automação');

-- Reordenar os departamentos ativos
UPDATE process_departments SET display_order = 0 WHERE name = 'Administrativo';
UPDATE process_departments SET display_order = 1 WHERE name = 'Comercial';
UPDATE process_departments SET display_order = 2 WHERE name = 'Marketing';
UPDATE process_departments SET display_order = 3 WHERE name = 'Financeiro';
UPDATE process_departments SET display_order = 4 WHERE name = 'Tecnologia';