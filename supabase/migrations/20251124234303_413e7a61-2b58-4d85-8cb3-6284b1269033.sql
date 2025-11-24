-- Corrigir conversas de grupos existentes no banco
-- Identificar e atualizar conversas onde contact_phone termina em '-group'

-- 1. Atualizar is_group=true e contact_name para conversas com phone terminando em -group
UPDATE conversations
SET 
  is_group = true,
  contact_name = CASE 
    WHEN contact_name IS NULL OR contact_name = '' THEN 'Grupo'
    WHEN contact_name NOT LIKE '%Grupo%' THEN 'Grupo - ' || contact_name
    ELSE contact_name
  END
WHERE contact_phone LIKE '%-group'
  AND (is_group IS NULL OR is_group = false);

-- Log das alterações
SELECT 
  COUNT(*) as total_grupos_corrigidos
FROM conversations
WHERE contact_phone LIKE '%-group' AND is_group = true;