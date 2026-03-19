ALTER TABLE task_notification_queue 
  ADD COLUMN IF NOT EXISTS nova_hora text,
  ADD COLUMN IF NOT EXISTS locked_by text,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz;