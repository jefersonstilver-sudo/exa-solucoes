-- FASE 2: Adicionar campo funil_status na tabela contacts
-- Este campo permite rastrear o status do contato no funil de vendas

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS funil_status TEXT 
DEFAULT 'lead' 
CHECK (funil_status IN ('lead', 'oportunidade', 'cliente', 'churn'));

-- Índice para performance em filtros por funil
CREATE INDEX IF NOT EXISTS idx_contacts_funil_status ON contacts(funil_status);

-- Atualizar contatos existentes baseado na categoria
UPDATE contacts SET funil_status = 'cliente' WHERE categoria = 'anunciante';
UPDATE contacts SET funil_status = 'cliente' WHERE categoria = 'sindico_exa';
UPDATE contacts SET funil_status = 'lead' WHERE categoria = 'lead';
UPDATE contacts SET funil_status = 'lead' WHERE categoria = 'sindico_lead';

-- Comentário para documentação
COMMENT ON COLUMN contacts.funil_status IS 'Status do contato no funil de vendas: lead, oportunidade, cliente, churn';