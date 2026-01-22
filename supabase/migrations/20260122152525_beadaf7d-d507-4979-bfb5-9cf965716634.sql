-- Adicionar campos de exclusividade na tabela proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS exclusividade_segmento BOOLEAN DEFAULT FALSE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS segmento_exclusivo TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS exclusividade_percentual NUMERIC DEFAULT 35;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS exclusividade_valor_extra NUMERIC DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS exclusividade_disponivel BOOLEAN DEFAULT TRUE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS cliente_escolheu_exclusividade BOOLEAN;

-- Tabela para controle de exclusividades ativas por prédio/segmento
CREATE TABLE IF NOT EXISTS exclusividades_segmento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segmento TEXT NOT NULL,
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  order_id UUID,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE exclusividades_segmento ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Authenticated users can view exclusividades"
ON exclusividades_segmento FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert exclusividades"
ON exclusividades_segmento FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update exclusividades"
ON exclusividades_segmento FOR UPDATE
TO authenticated
USING (true);

-- Índice para consultas rápidas de disponibilidade
CREATE INDEX IF NOT EXISTS idx_exclusividades_ativas 
ON exclusividades_segmento(segmento, building_id, data_inicio, data_fim) 
WHERE ativo = TRUE;

-- Índice para consultas por proposta
CREATE INDEX IF NOT EXISTS idx_exclusividades_proposal
ON exclusividades_segmento(proposal_id);

-- Trigger para updated_at
CREATE TRIGGER update_exclusividades_segmento_updated_at
BEFORE UPDATE ON exclusividades_segmento
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();