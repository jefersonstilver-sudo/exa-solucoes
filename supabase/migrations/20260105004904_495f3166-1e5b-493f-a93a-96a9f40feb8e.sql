-- Adicionar campos para detecção de duplicados
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_potential_duplicate BOOLEAN DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS duplicate_group_id UUID;

-- Index para ordenação por duplicados
CREATE INDEX IF NOT EXISTS idx_contacts_duplicate ON contacts (is_potential_duplicate DESC, duplicate_group_id);
CREATE INDEX IF NOT EXISTS idx_contacts_last_interaction ON contacts (last_interaction_at DESC NULLS LAST);