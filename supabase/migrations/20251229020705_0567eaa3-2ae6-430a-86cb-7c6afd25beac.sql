-- Adicionar novas colunas para sistema de alarmes na tabela notion_tasks
ALTER TABLE public.notion_tasks ADD COLUMN IF NOT EXISTS hora TIME;
ALTER TABLE public.notion_tasks ADD COLUMN IF NOT EXISTS responsaveis_ids UUID[] DEFAULT '{}';
ALTER TABLE public.notion_tasks ADD COLUMN IF NOT EXISTS alarme_padrao BOOLEAN DEFAULT true;
ALTER TABLE public.notion_tasks ADD COLUMN IF NOT EXISTS alarme_insistente BOOLEAN DEFAULT false;
ALTER TABLE public.notion_tasks ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.notion_tasks ADD COLUMN IF NOT EXISTS silenciado BOOLEAN DEFAULT false;

-- Criar tabela de logs de alertas de tarefas
CREATE TABLE IF NOT EXISTS public.task_alert_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.notion_tasks(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT now(),
  alert_type TEXT NOT NULL, -- 'padrao_1h', 'padrao_30min', 'insistente_30', 'insistente_25', etc
  recipients JSONB DEFAULT '[]', -- lista de quem recebeu
  confirmed_by JSONB DEFAULT '[]', -- quem confirmou leitura
  status TEXT DEFAULT 'sent', -- sent, confirmed, failed
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_task_alert_logs_task_id ON public.task_alert_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_alert_logs_sent_at ON public.task_alert_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notion_tasks_data_hora ON public.notion_tasks(data, hora);
CREATE INDEX IF NOT EXISTS idx_notion_tasks_status ON public.notion_tasks(status);

-- RLS para task_alert_logs
ALTER TABLE public.task_alert_logs ENABLE ROW LEVEL SECURITY;

-- Política para admins verem todos os logs
CREATE POLICY "Admins can view all task alert logs" 
ON public.task_alert_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Política para inserção via service role
CREATE POLICY "Service role can insert task alert logs" 
ON public.task_alert_logs 
FOR INSERT 
WITH CHECK (true);

-- Comentários para documentação
COMMENT ON COLUMN public.notion_tasks.hora IS 'Horário da tarefa (HH:MM)';
COMMENT ON COLUMN public.notion_tasks.responsaveis_ids IS 'IDs dos usuários responsáveis pela tarefa';
COMMENT ON COLUMN public.notion_tasks.alarme_padrao IS 'Se ativado, envia alertas 1h e 30min antes';
COMMENT ON COLUMN public.notion_tasks.alarme_insistente IS 'Se ativado, envia alertas a cada 5min nos últimos 30min';
COMMENT ON TABLE public.task_alert_logs IS 'Logs de todos os alertas enviados para tarefas';