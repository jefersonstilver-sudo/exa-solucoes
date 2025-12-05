-- Criar tabela para signatários específicos de cada contrato
CREATE TABLE IF NOT EXISTS contrato_signatarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos_legais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('cliente', 'exa', 'testemunha')),
  nome TEXT NOT NULL,
  sobrenome TEXT,
  email TEXT NOT NULL,
  data_nascimento DATE,
  cpf TEXT,
  cargo TEXT,
  signatario_exa_id UUID REFERENCES signatarios_exa(id),
  ordem INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_contrato_signatarios_contrato ON contrato_signatarios(contrato_id);
CREATE INDEX idx_contrato_signatarios_tipo ON contrato_signatarios(tipo);

-- Enable RLS
ALTER TABLE contrato_signatarios ENABLE ROW LEVEL SECURITY;

-- Política para admins
CREATE POLICY "Admins can manage contrato_signatarios"
  ON contrato_signatarios
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Adicionar campos de signatário cliente ao contratos_legais
ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS cliente_data_nascimento DATE,
ADD COLUMN IF NOT EXISTS cliente_cpf TEXT;

COMMENT ON TABLE contrato_signatarios IS 'Signatários específicos de cada contrato para ClickSign';
COMMENT ON COLUMN contrato_signatarios.tipo IS 'cliente = empresa contratante, exa = EXA Mídia, testemunha = testemunha opcional';
COMMENT ON COLUMN contrato_signatarios.signatario_exa_id IS 'Referência ao signatário EXA se tipo = exa';