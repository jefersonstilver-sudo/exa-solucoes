-- Adicionar colunas para sistema de re-aceite e controle de modificações
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS needs_reacceptance boolean DEFAULT false;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS last_modified_at timestamptz;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS modified_by uuid REFERENCES auth.users(id);

-- Comentários para documentação
COMMENT ON COLUMN proposals.needs_reacceptance IS 'Indica se a proposta foi modificada e precisa ser aceita novamente';
COMMENT ON COLUMN proposals.last_modified_at IS 'Data/hora da última modificação significativa';
COMMENT ON COLUMN proposals.modified_by IS 'ID do usuário que fez a última modificação';