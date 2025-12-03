-- Adicionar coluna proposal_id na tabela pedidos para vincular pedidos a propostas
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES proposals(id);

-- Adicionar coluna converted_order_id na tabela proposals para rastrear pedido gerado
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS converted_order_id UUID REFERENCES pedidos(id);

-- Criar índices para performance em queries
CREATE INDEX IF NOT EXISTS idx_pedidos_proposal_id ON pedidos(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposals_converted_order_id ON proposals(converted_order_id);

-- Comentários para documentação
COMMENT ON COLUMN pedidos.proposal_id IS 'ID da proposta que originou este pedido (se aplicável)';
COMMENT ON COLUMN proposals.converted_order_id IS 'ID do pedido gerado quando a proposta foi convertida';