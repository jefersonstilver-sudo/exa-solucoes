-- Adicionar colunas de risco de perda à tabela lead_qualifications
ALTER TABLE lead_qualifications 
ADD COLUMN IF NOT EXISTS risk_of_loss boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reason_for_risk text;