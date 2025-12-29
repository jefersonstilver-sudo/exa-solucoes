-- Add tipo_horario and hora columns to notion_tasks table
ALTER TABLE public.notion_tasks 
ADD COLUMN IF NOT EXISTS tipo_horario TEXT,
ADD COLUMN IF NOT EXISTS hora TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.notion_tasks.tipo_horario IS 'Tipo de horário: fixo (ex: às 14:00) ou ate (ex: até 17:00)';
COMMENT ON COLUMN public.notion_tasks.hora IS 'Horário da tarefa no formato HH:mm';