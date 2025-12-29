-- Criar tabela notion_tasks para armazenar tarefas do Notion
CREATE TABLE IF NOT EXISTS public.notion_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_page_id TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  prioridade TEXT,
  status TEXT DEFAULT 'NÃO REALIZADO',
  responsavel TEXT,
  responsavel_avatar TEXT,
  data DATE,
  finalizado_por TEXT,
  categoria TEXT,
  descricao TEXT,
  notion_last_edited_time TIMESTAMPTZ,
  notion_created_time TIMESTAMPTZ,
  notion_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_notion_tasks_data ON public.notion_tasks(data);
CREATE INDEX IF NOT EXISTS idx_notion_tasks_status ON public.notion_tasks(status);
CREATE INDEX IF NOT EXISTS idx_notion_tasks_responsavel ON public.notion_tasks(responsavel);
CREATE INDEX IF NOT EXISTS idx_notion_tasks_prioridade ON public.notion_tasks(prioridade);

-- Criar tabela notion_task_sync_logs para logs de sincronização
CREATE TABLE IF NOT EXISTS public.notion_task_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_started_at TIMESTAMPTZ DEFAULT now(),
  sync_completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running',
  tasks_created INTEGER DEFAULT 0,
  tasks_updated INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  duration_ms INTEGER,
  details JSONB
);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_notion_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notion_tasks_modtime
  BEFORE UPDATE ON public.notion_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notion_tasks_updated_at();

-- Habilitar RLS
ALTER TABLE public.notion_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notion_task_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies para notion_tasks
CREATE POLICY "Authenticated users can read notion_tasks" 
  ON public.notion_tasks 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert notion_tasks" 
  ON public.notion_tasks 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notion_tasks" 
  ON public.notion_tasks 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete notion_tasks" 
  ON public.notion_tasks 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Policies para notion_task_sync_logs
CREATE POLICY "Authenticated users can read sync_logs" 
  ON public.notion_task_sync_logs 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert sync_logs" 
  ON public.notion_task_sync_logs 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sync_logs" 
  ON public.notion_task_sync_logs 
  FOR UPDATE 
  TO authenticated 
  USING (true);