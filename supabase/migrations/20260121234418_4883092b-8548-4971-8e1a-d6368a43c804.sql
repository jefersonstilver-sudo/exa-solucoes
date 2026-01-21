-- FASE 1: Ajustar process_departments
-- Renomear Vendas → Comercial
UPDATE process_departments 
SET name = 'Comercial', 
    updated_at = now()
WHERE name = 'Vendas';

-- Desativar Atendimento (migrar para Operação)
UPDATE process_departments 
SET is_active = false,
    updated_at = now()
WHERE name = 'Atendimento';

-- Desativar Expansão (migrar para Comercial)
UPDATE process_departments 
SET is_active = false,
    updated_at = now()
WHERE name = 'Expansão';

-- Reordenar departamentos ativos (Administrativo no topo)
UPDATE process_departments SET display_order = 0, color = '#6B7280', icon = 'Building' WHERE name = 'Administrativo';
UPDATE process_departments SET display_order = 1, color = '#3B82F6', icon = 'TrendingUp' WHERE name = 'Comercial';
UPDATE process_departments SET display_order = 2, color = '#10B981', icon = 'Megaphone' WHERE name = 'Marketing';
UPDATE process_departments SET display_order = 3, color = '#F97316', icon = 'DollarSign' WHERE name = 'Financeiro';
UPDATE process_departments SET display_order = 4, color = '#F59E0B', icon = 'Cog' WHERE name = 'Operação';
UPDATE process_departments SET display_order = 5, color = '#8B5CF6', icon = 'Code' WHERE name = 'Tecnologia';
UPDATE process_departments SET display_order = 6, color = '#1F2937', icon = 'Bot' WHERE name = 'IA & Automação';

-- FASE 2: Adicionar departamento_id em users (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'departamento_id'
  ) THEN
    ALTER TABLE users ADD COLUMN departamento_id UUID REFERENCES process_departments(id);
  END IF;
END $$;

-- FASE 3: Migrar usuários existentes para departamentos
-- CEO → Administrativo
UPDATE users u
SET departamento_id = (SELECT id FROM process_departments WHERE name = 'Administrativo' LIMIT 1)
WHERE u.role = 'super_admin' AND u.departamento_id IS NULL;

-- Admin geral → Administrativo  
UPDATE users u
SET departamento_id = (SELECT id FROM process_departments WHERE name = 'Administrativo' LIMIT 1)
WHERE u.role = 'admin' AND u.departamento_id IS NULL;

-- Admin Financeiro → Financeiro
UPDATE users u
SET departamento_id = (SELECT id FROM process_departments WHERE name = 'Financeiro' LIMIT 1)
WHERE u.role = 'admin_financeiro' AND u.departamento_id IS NULL;

-- Admin Marketing → Marketing
UPDATE users u
SET departamento_id = (SELECT id FROM process_departments WHERE name = 'Marketing' LIMIT 1)
WHERE u.role = 'admin_marketing' AND u.departamento_id IS NULL;

-- Comercial → Comercial
UPDATE users u
SET departamento_id = (SELECT id FROM process_departments WHERE name = 'Comercial' LIMIT 1)
WHERE u.role = 'comercial' AND u.departamento_id IS NULL;

-- Fallback: qualquer usuário sem departamento → Administrativo
UPDATE users u
SET departamento_id = (SELECT id FROM process_departments WHERE name = 'Administrativo' LIMIT 1)
WHERE u.departamento_id IS NULL;