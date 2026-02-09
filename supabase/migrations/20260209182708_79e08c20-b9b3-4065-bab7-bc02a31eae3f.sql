
-- ============================================================
-- Fase 1: Adicionar campos na tabela tasks + criar novas tabelas
-- ============================================================

-- 1. Adicionar novos campos na tabela tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tipo_evento TEXT DEFAULT 'tarefa';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtipo_reuniao TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS departamento_id UUID REFERENCES process_departments(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS horario_inicio TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS local_evento TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS link_reuniao TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS escopo TEXT DEFAULT 'individual';

-- 2. Criar tabela task_propostas (N:N entre tasks e propostas)
CREATE TABLE IF NOT EXISTS task_propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  proposta_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, proposta_id)
);

-- 3. Criar tabela task_participantes (envolvidos na tarefa/reunião)
CREATE TABLE IF NOT EXISTS task_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  contato_nome TEXT,
  contato_telefone TEXT,
  tipo TEXT DEFAULT 'participante' CHECK (tipo IN ('organizador', 'participante', 'convidado')),
  confirmado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS para task_propostas
ALTER TABLE task_propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view task_propostas"
  ON task_propostas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert task_propostas"
  ON task_propostas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete task_propostas"
  ON task_propostas FOR DELETE
  TO authenticated
  USING (true);

-- 5. RLS para task_participantes
ALTER TABLE task_participantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view task_participantes"
  ON task_participantes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert task_participantes"
  ON task_participantes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update task_participantes"
  ON task_participantes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete task_participantes"
  ON task_participantes FOR DELETE
  TO authenticated
  USING (true);

-- 6. Índices
CREATE INDEX IF NOT EXISTS idx_tasks_tipo_evento ON tasks(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_tasks_escopo ON tasks(escopo);
CREATE INDEX IF NOT EXISTS idx_tasks_departamento_id ON tasks(departamento_id);
CREATE INDEX IF NOT EXISTS idx_task_propostas_task_id ON task_propostas(task_id);
CREATE INDEX IF NOT EXISTS idx_task_participantes_task_id ON task_participantes(task_id);
