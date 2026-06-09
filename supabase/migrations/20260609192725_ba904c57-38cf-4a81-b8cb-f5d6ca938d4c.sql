-- Flag para identificar a instância dedicada de notificações automáticas
ALTER TABLE public.evolution_instances
  ADD COLUMN IF NOT EXISTS is_notifications boolean NOT NULL DEFAULT false;

-- Apenas 1 instância pode ser a de notificações
CREATE UNIQUE INDEX IF NOT EXISTS evolution_instances_one_notifications
  ON public.evolution_instances (is_notifications)
  WHERE is_notifications = true;

-- Renomear zapi_logs -> evolution_logs (mantém histórico)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='zapi_logs')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='evolution_logs') THEN
    EXECUTE 'ALTER TABLE public.zapi_logs RENAME TO evolution_logs';
  END IF;
END $$;

-- Coluna opcional instance_id para rastrear qual instância Evolution enviou
ALTER TABLE public.evolution_logs
  ADD COLUMN IF NOT EXISTS instance_id text;

-- View de compatibilidade durante migração (callers antigos continuam funcionando)
CREATE OR REPLACE VIEW public.zapi_logs AS SELECT * FROM public.evolution_logs;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zapi_logs TO authenticated;
GRANT ALL ON public.zapi_logs TO service_role;