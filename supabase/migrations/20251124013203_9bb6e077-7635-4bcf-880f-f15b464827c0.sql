
-- ================================================
-- MIGRAÇÃO: Corrigir agent_id de UUID para KEY
-- ================================================
-- Problema: Registros antigos usam UUID, código novo usa KEY
-- Solução: Atualizar todos os registros para usar 'sofia' como agent_id

-- 1. Atualizar agent_sections (3 seções encontradas)
UPDATE agent_sections 
SET agent_id = 'sofia'
WHERE agent_id = '6e0278e4-c95d-4d90-b976-d19c375b644b';

-- 2. Atualizar agent_knowledge_items (12 itens com UUID)
UPDATE agent_knowledge_items 
SET agent_id = 'sofia'
WHERE agent_id = '6e0278e4-c95d-4d90-b976-d19c375b644b';

-- 3. Verificar se há outros agentes que precisam de correção
-- (executar apenas se houver outros agentes além da Sofia)
DO $$
DECLARE
  agent_record RECORD;
BEGIN
  FOR agent_record IN 
    SELECT id, key FROM agents WHERE key IS NOT NULL AND key != ''
  LOOP
    -- Atualizar agent_sections
    UPDATE agent_sections 
    SET agent_id = agent_record.key
    WHERE agent_id = agent_record.id::text;
    
    -- Atualizar agent_knowledge_items
    UPDATE agent_knowledge_items 
    SET agent_id = agent_record.key
    WHERE agent_id = agent_record.id::text;
    
    RAISE NOTICE 'Migrated agent: % (key: %)', agent_record.id, agent_record.key;
  END LOOP;
END $$;

-- 4. Log da migração
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete:';
  RAISE NOTICE '   - agent_sections updated to use KEY';
  RAISE NOTICE '   - agent_knowledge_items updated to use KEY';
  RAISE NOTICE '   - All future queries will use agent.key instead of agent.id';
END $$;
