-- ============================================
-- FASE 3: Tabela funcionarios (RH Backend)
-- ============================================

-- Criar ENUM para tipos de contrato
DO $$ BEGIN
  CREATE TYPE tipo_contrato_funcionario AS ENUM ('clt', 'pj', 'freelancer', 'estagiario', 'socio');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Criar ENUM para departamentos
DO $$ BEGIN
  CREATE TYPE departamento_funcionario AS ENUM ('comercial', 'operacao', 'financeiro', 'marketing', 'administrativo', 'diretoria', 'ti');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Criar tabela funcionarios
CREATE TABLE IF NOT EXISTS funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tipo_contrato tipo_contrato_funcionario NOT NULL,
  cargo TEXT NOT NULL,
  departamento departamento_funcionario NOT NULL,
  salario_mensal NUMERIC,
  valor_contrato NUMERIC,
  data_admissao DATE,
  data_demissao DATE,
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Comentário da tabela
COMMENT ON TABLE funcionarios IS 'Registros de funcionários vinculados a contas administrativas - Cada funcionário DEVE ter um user_id único';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_funcionarios_user_id ON funcionarios(user_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_departamento ON funcionarios(departamento);
CREATE INDEX IF NOT EXISTS idx_funcionarios_ativo ON funcionarios(ativo);
CREATE INDEX IF NOT EXISTS idx_funcionarios_tipo_contrato ON funcionarios(tipo_contrato);

-- Habilitar RLS
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem visualizar funcionários
CREATE POLICY "Admins podem ver funcionarios" ON funcionarios
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin', 'admin_master', 'admin_financeiro')
    )
  );

-- Política: Super admins podem gerenciar funcionários (INSERT/UPDATE/DELETE)
CREATE POLICY "Super admins podem gerenciar funcionarios" ON funcionarios
  FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'admin_master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'admin_master')
    )
  );

-- Trigger para updated_at
CREATE TRIGGER set_updated_at_funcionarios
  BEFORE UPDATE ON funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FASE 4: Adicionar responsavel_id em despesas_fixas
-- ============================================

-- Adicionar coluna responsavel_id (FK para funcionarios)
ALTER TABLE despesas_fixas 
ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES funcionarios(id);

-- Índice para performance de consultas por responsável
CREATE INDEX IF NOT EXISTS idx_despesas_fixas_responsavel ON despesas_fixas(responsavel_id);

-- Comentário explicativo
COMMENT ON COLUMN despesas_fixas.responsavel_id IS 'Funcionário responsável pela despesa - permite calcular custo por pessoa/área';

-- ============================================
-- CRON: Agendar manutenção mensal de parcelas
-- ============================================

-- Remover job existente se houver (para evitar duplicidade)
SELECT cron.unschedule('maintain-expense-installments-monthly') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'maintain-expense-installments-monthly'
);

-- Agendar novo job: Dia 1 de cada mês às 03:00
SELECT cron.schedule(
  'maintain-expense-installments-monthly',
  '0 3 1 * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/maintain-expense-installments',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);