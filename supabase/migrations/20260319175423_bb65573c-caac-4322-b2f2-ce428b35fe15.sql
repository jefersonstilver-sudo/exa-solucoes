CREATE TABLE IF NOT EXISTS task_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'notificacao',
  unidade TEXT NOT NULL DEFAULT 'minutos',
  valor INT NOT NULL DEFAULT 30,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage task_reminders" ON task_reminders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_task_reminders_task_id ON task_reminders(task_id);