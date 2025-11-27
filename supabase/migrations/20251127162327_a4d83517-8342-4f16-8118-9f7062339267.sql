-- =====================================================
-- ETAPA 1: UNIFICAÇÃO DE TIPOS DE CONTATO - MIGRAÇÃO
-- =====================================================

-- 1.1 Migrar dados em conversations ANTES de apagar tipos
UPDATE conversations 
SET contact_type = 'lead' 
WHERE contact_type IN ('unknown', 'anunciante', 'morador', 'administrativo', 'cliente_potencial', 'cliente', 'suporte_tecnico');

UPDATE conversations 
SET contact_type = 'equipe_exa' 
WHERE contact_type = 'Equipe Exa';

UPDATE conversations 
SET contact_type = 'ligga_provedor' 
WHERE contact_type = 'LIGGA - Provedor';

UPDATE conversations 
SET contact_type = 'vivo_provedor' 
WHERE contact_type = 'VIVO - Provedor';

UPDATE conversations 
SET contact_type = 'oriente_supervisor' 
WHERE contact_type = 'Oriente EMPRESA ELEVADOR';

UPDATE conversations 
SET contact_type = 'tke_supervisor' 
WHERE contact_type = 'TKE - SUPERVISOR';

-- 1.2 Limpar tabela contact_types
-- DELETE tipos deprecated
DELETE FROM contact_types 
WHERE name IN ('anunciante', 'morador', 'suporte_tecnico', 'tecnico_elevador', 'administrativo', 'cliente_potencial');

-- UPDATE nomes inconsistentes para snake_case
UPDATE contact_types 
SET name = 'equipe_exa', label = 'Equipe EXA' 
WHERE name = 'Equipe Exa';

UPDATE contact_types 
SET name = 'ligga_provedor', label = 'LIGGA – Provedor' 
WHERE name = 'LIGGA - Provedor';

UPDATE contact_types 
SET name = 'vivo_provedor', label = 'VIVO – Provedor' 
WHERE name = 'VIVO - Provedor';

UPDATE contact_types 
SET name = 'oriente_supervisor', label = 'ORIENTE – Supervisor' 
WHERE name = 'Oriente EMPRESA ELEVADOR';

UPDATE contact_types 
SET name = 'tke_supervisor', label = 'TKE – Supervisor' 
WHERE name = 'TKE - SUPERVISOR';

-- 1.3 INSERT novos tipos oficiais
INSERT INTO contact_types (name, label, color, icon, is_default) VALUES
  ('sindico_lead', 'Síndico Lead', '#10B981', 'building-2', false),
  ('tke_tecnico', 'TKE – Técnico', '#F59E0B', 'wrench', false),
  ('oriente_tecnico', 'ORIENTE – Técnico', '#F59E0B', 'wrench', false),
  ('atlas_tecnico', 'ATLAS – Técnico', '#F59E0B', 'wrench', false),
  ('atlas_supervisor', 'ATLAS – Supervisor', '#EF4444', 'shield-check', false),
  ('outros_prestadores', 'Outros Prestadores', '#8B5CF6', 'users', false),
  ('cliente_ativo', 'Cliente Ativo', '#3B82F6', 'star', false)
ON CONFLICT (name) DO NOTHING;