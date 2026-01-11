-- CORREÇÃO: Dropar tabela com estrutura incorreta e recriar corretamente
-- A tabela foi criada com CHECK constraints rígidos que precisam ser removidos

-- Remover dependências primeiro
ALTER TABLE despesas_fixas DROP COLUMN IF EXISTS responsavel_id;

-- Dropar trigger
DROP TRIGGER IF EXISTS set_updated_at_funcionarios ON funcionarios;

-- Dropar policies
DROP POLICY IF EXISTS "Admins podem ver funcionarios" ON funcionarios;
DROP POLICY IF EXISTS "Super admins podem gerenciar funcionarios" ON funcionarios;

-- Dropar índices
DROP INDEX IF EXISTS idx_funcionarios_user_id;
DROP INDEX IF EXISTS idx_funcionarios_departamento;
DROP INDEX IF EXISTS idx_funcionarios_ativo;
DROP INDEX IF EXISTS idx_funcionarios_tipo_contrato;

-- Dropar tabela
DROP TABLE IF EXISTS funcionarios;

-- Recriar com estrutura CORRETA (TEXT flexível + regra de remuneração)
CREATE TABLE funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Campos flexíveis (TEXT simples, sem ENUM/CHECK fixo)
  tipo_contrato TEXT NOT NULL,
  cargo TEXT NOT NULL,
  departamento TEXT NOT NULL,
  
  -- Remuneração com regra de exclusão
  salario_mensal NUMERIC,
  valor_contrato NUMERIC,
  
  -- Datas
  data_admissao DATE,
  data_demissao DATE,
  
  -- Status e observações
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- REGRA DE NEGÓCIO: Exclusão mútua de remuneração por tipo de contrato
  CONSTRAINT chk_remuneracao_por_tipo CHECK (
    CASE 
      WHEN tipo_contrato IN ('clt', 'estagiario') THEN 
        salario_mensal IS NOT NULL AND valor_contrato IS NULL
      WHEN tipo_contrato IN ('pj', 'freelancer', 'socio') THEN 
        valor_contrato IS NOT NULL AND salario_mensal IS NULL
      ELSE TRUE
    END
  )
);

-- Índices
CREATE INDEX idx_funcionarios_user_id ON funcionarios(user_id);
CREATE INDEX idx_funcionarios_departamento ON funcionarios(departamento);
CREATE INDEX idx_funcionarios_ativo ON funcionarios(ativo);
CREATE INDEX idx_funcionarios_tipo_contrato ON funcionarios(tipo_contrato);

-- RLS
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver funcionarios" ON funcionarios
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'super_admin', 'admin_master', 'admin_financeiro'))
  );

CREATE POLICY "Super admins podem gerenciar funcionarios" ON funcionarios
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() 
    AND u.role IN ('super_admin', 'admin_master'))
  );

-- Trigger
CREATE TRIGGER set_updated_at_funcionarios
  BEFORE UPDATE ON funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- FASE 4: Adicionar responsavel_id em despesas_fixas
ALTER TABLE despesas_fixas 
ADD COLUMN responsavel_id UUID REFERENCES funcionarios(id);

CREATE INDEX idx_despesas_fixas_responsavel ON despesas_fixas(responsavel_id);

COMMENT ON COLUMN despesas_fixas.responsavel_id IS 
'Funcionário responsável pela despesa (para custo por área/pessoa)';