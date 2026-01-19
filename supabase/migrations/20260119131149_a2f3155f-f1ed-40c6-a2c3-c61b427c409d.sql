
-- =====================================================
-- FASE 3.1: SISTEMA DE TAREFAS - MIGRATION COMPLETA
-- Arquitetura Canônica v3.0
-- =====================================================

-- =====================================================
-- ETAPA 1: CRIAR ENUMS
-- =====================================================

-- Status de tarefa (7 valores)
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM (
    'pendente',
    'em_andamento', 
    'aguardando_aprovacao',
    'aguardando_insumo',
    'concluida',
    'nao_realizada',
    'cancelada'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Prioridade de tarefa (4 valores incluindo emergência)
DO $$ BEGIN
  CREATE TYPE task_prioridade AS ENUM (
    'emergencia',
    'alta',
    'media',
    'baixa'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Origem da tarefa (9 fontes)
DO $$ BEGIN
  CREATE TYPE task_origem AS ENUM (
    'manual',
    'rotina',
    'sistema',
    'crm',
    'financeiro',
    'operacao',
    'notion',
    'alerta',
    'ia'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Dias da semana
DO $$ BEGIN
  CREATE TYPE dia_semana AS ENUM (
    'segunda',
    'terca',
    'quarta',
    'quinta',
    'sexta',
    'sabado',
    'domingo'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Frequência de rotina
DO $$ BEGIN
  CREATE TYPE frequencia_rotina AS ENUM (
    'diaria',
    'semanal',
    'quinzenal',
    'mensal'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- ETAPA 2: TABELAS ESTRUTURAIS
-- =====================================================

-- Tipos de tarefa por departamento
CREATE TABLE IF NOT EXISTS task_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  departamento VARCHAR(50) NOT NULL,
  prioridade_padrao task_prioridade DEFAULT 'media',
  tempo_estimado_minutos INTEGER,
  requer_checklist BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Responsáveis padrão por tipo de tarefa
CREATE TABLE IF NOT EXISTS task_type_responsaveis_padrao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type_id UUID NOT NULL REFERENCES task_types(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_type_id, user_id)
);

-- Rotinas recorrentes
CREATE TABLE IF NOT EXISTS task_rotinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  task_type_id UUID REFERENCES task_types(id) ON DELETE SET NULL,
  frequencia frequencia_rotina NOT NULL DEFAULT 'diaria',
  dias_semana dia_semana[] DEFAULT NULL,
  dia_mes INTEGER CHECK (dia_mes >= 1 AND dia_mes <= 31),
  horario_inicio TIME,
  horario_limite TIME,
  prioridade task_prioridade DEFAULT 'media',
  todos_responsaveis BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Responsáveis de rotina
CREATE TABLE IF NOT EXISTS task_rotina_responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotina_id UUID NOT NULL REFERENCES task_rotinas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(rotina_id, user_id)
);

-- Template de checklist para rotinas
CREATE TABLE IF NOT EXISTS task_rotina_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotina_id UUID NOT NULL REFERENCES task_rotinas(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  obrigatorio BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ETAPA 3: TABELAS OPERACIONAIS
-- =====================================================

-- Instâncias de tarefas (tabela principal)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  status task_status NOT NULL DEFAULT 'pendente',
  prioridade task_prioridade NOT NULL DEFAULT 'media',
  origem task_origem NOT NULL DEFAULT 'manual',
  
  -- Vínculos opcionais
  task_type_id UUID REFERENCES task_types(id) ON DELETE SET NULL,
  rotina_id UUID REFERENCES task_rotinas(id) ON DELETE SET NULL,
  origem_id UUID,
  cliente_id UUID,
  
  -- Datas
  data_prevista DATE,
  horario_limite TIME,
  data_conclusao TIMESTAMPTZ,
  
  -- Execução
  concluida_por UUID REFERENCES users(id) ON DELETE SET NULL,
  motivo_nao_realizada TEXT,
  
  -- Visibilidade
  todos_responsaveis BOOLEAN DEFAULT false,
  
  -- Auditoria
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Responsáveis por tarefa específica
CREATE TABLE IF NOT EXISTS task_responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lida_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Itens de checklist por tarefa
CREATE TABLE IF NOT EXISTS task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  obrigatorio BOOLEAN DEFAULT true,
  concluido BOOLEAN DEFAULT false,
  concluido_por UUID REFERENCES users(id) ON DELETE SET NULL,
  concluido_em TIMESTAMPTZ,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log obrigatório de mudanças de status (auditoria imutável)
CREATE TABLE IF NOT EXISTS task_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status_anterior task_status,
  status_novo task_status NOT NULL,
  motivo TEXT,
  alterado_por UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ETAPA 4: ÍNDICES DE PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tasks_data_prevista ON tasks(data_prevista);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_prioridade ON tasks(prioridade);
CREATE INDEX IF NOT EXISTS idx_tasks_origem ON tasks(origem);
CREATE INDEX IF NOT EXISTS idx_tasks_rotina_id ON tasks(rotina_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type_id ON tasks(task_type_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_todos_responsaveis ON tasks(todos_responsaveis) WHERE todos_responsaveis = true;

CREATE INDEX IF NOT EXISTS idx_task_responsaveis_task_id ON task_responsaveis(task_id);
CREATE INDEX IF NOT EXISTS idx_task_responsaveis_user_id ON task_responsaveis(user_id);

CREATE INDEX IF NOT EXISTS idx_task_status_log_task_id ON task_status_log(task_id);

-- =====================================================
-- ETAPA 5: FUNCTIONS DE GOVERNANÇA
-- =====================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Registra TODA mudança de status (UPDATE)
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO task_status_log (task_id, status_anterior, status_novo, motivo, alterado_por)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.motivo_nao_realizada, NEW.concluida_por);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Registra status inicial no INSERT
CREATE OR REPLACE FUNCTION log_task_initial_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_status_log (task_id, status_anterior, status_novo, alterado_por)
  VALUES (NEW.id, NULL, NEW.status, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Impede INSERT em task_responsaveis quando flag todos_responsaveis = true
CREATE OR REPLACE FUNCTION check_todos_responsaveis_constraint()
RETURNS TRIGGER AS $$
DECLARE
  task_flag BOOLEAN;
BEGIN
  SELECT todos_responsaveis INTO task_flag FROM tasks WHERE id = NEW.task_id;
  
  IF task_flag = true THEN
    RAISE EXCEPTION 'Não é permitido adicionar responsáveis individuais quando todos_responsaveis = true';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ETAPA 6: TRIGGERS
-- =====================================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS set_tasks_updated_at ON tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_task_types_updated_at ON task_types;
CREATE TRIGGER set_task_types_updated_at
  BEFORE UPDATE ON task_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_task_rotinas_updated_at ON task_rotinas;
CREATE TRIGGER set_task_rotinas_updated_at
  BEFORE UPDATE ON task_rotinas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Log obrigatório de status (UPDATE)
DROP TRIGGER IF EXISTS trigger_log_task_status ON tasks;
CREATE TRIGGER trigger_log_task_status
  AFTER UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_task_status_change();

-- Log de status inicial (INSERT)
DROP TRIGGER IF EXISTS trigger_log_task_initial_status ON tasks;
CREATE TRIGGER trigger_log_task_initial_status
  AFTER INSERT ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_task_initial_status();

-- Constraint todos_responsaveis
DROP TRIGGER IF EXISTS trigger_check_todos_responsaveis ON task_responsaveis;
CREATE TRIGGER trigger_check_todos_responsaveis
  BEFORE INSERT ON task_responsaveis
  FOR EACH ROW EXECUTE FUNCTION check_todos_responsaveis_constraint();

-- =====================================================
-- ETAPA 7: RLS POLICIES
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_type_responsaveis_padrao ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_rotinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_rotina_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_rotina_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_status_log ENABLE ROW LEVEL SECURITY;

-- Policies para task_types (estrutura - admins podem ler, super_admin gerencia)
CREATE POLICY "task_types_select_admin" ON task_types
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "task_types_all_super_admin" ON task_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- Policies para task_type_responsaveis_padrao
CREATE POLICY "task_type_resp_select_admin" ON task_type_responsaveis_padrao
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "task_type_resp_all_super_admin" ON task_type_responsaveis_padrao
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- Policies para task_rotinas
CREATE POLICY "task_rotinas_select_admin" ON task_rotinas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "task_rotinas_all_super_admin" ON task_rotinas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- Policies para task_rotina_responsaveis
CREATE POLICY "task_rotina_resp_select_admin" ON task_rotina_responsaveis
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "task_rotina_resp_all_super_admin" ON task_rotina_responsaveis
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- Policies para task_rotina_checklist
CREATE POLICY "task_rotina_checklist_select_admin" ON task_rotina_checklist
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "task_rotina_checklist_all_super_admin" ON task_rotina_checklist
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- Policies para tasks (usuários veem tarefas atribuídas ou com todos_responsaveis)
CREATE POLICY "tasks_select_own_or_global" ON tasks
  FOR SELECT USING (
    todos_responsaveis = true
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM task_responsaveis WHERE task_id = tasks.id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "tasks_insert_admin" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "tasks_update_assigned_or_admin" ON tasks
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM task_responsaveis WHERE task_id = tasks.id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "tasks_delete_super_admin" ON tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- Policies para task_responsaveis
CREATE POLICY "task_resp_select_own_or_admin" ON task_responsaveis
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "task_resp_insert_admin" ON task_responsaveis
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "task_resp_delete_admin" ON task_responsaveis
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- Policies para task_checklist_items
CREATE POLICY "task_checklist_select_task_access" ON task_checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_checklist_items.task_id 
      AND (
        t.todos_responsaveis = true
        OR t.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM task_responsaveis tr WHERE tr.task_id = t.id AND tr.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
      )
    )
  );

CREATE POLICY "task_checklist_update_assigned" ON task_checklist_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = task_checklist_items.task_id 
      AND (
        t.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM task_responsaveis tr WHERE tr.task_id = t.id AND tr.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
      )
    )
  );

CREATE POLICY "task_checklist_insert_admin" ON task_checklist_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- Policies para task_status_log (somente leitura - auditoria imutável)
CREATE POLICY "task_status_log_select_admin" ON task_status_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE tasks IS 'Instâncias de tarefas do sistema canônico v3.0 - substitui dependência do Notion';
COMMENT ON TABLE task_types IS 'Tipos de tarefa por departamento (ex: OPE-001, FIN-002)';
COMMENT ON TABLE task_rotinas IS 'Rotinas recorrentes que geram tarefas automaticamente';
COMMENT ON TABLE task_status_log IS 'Histórico IMUTÁVEL de mudanças de status - auditoria obrigatória';
COMMENT ON COLUMN tasks.todos_responsaveis IS 'Quando true, tarefa é visível para todos os admins sem responsáveis específicos';
COMMENT ON COLUMN tasks.origem IS 'Fonte da tarefa: manual, rotina, sistema, crm, financeiro, operacao, notion (legado), alerta, ia';
