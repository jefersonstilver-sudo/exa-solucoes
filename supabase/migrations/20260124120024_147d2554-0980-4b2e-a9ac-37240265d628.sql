-- =====================================================
-- MIGRATION: Fix task_status_log triggers with SECURITY DEFINER
-- Corrige o erro de RLS ao criar tarefas
-- =====================================================

-- Dropar as funções existentes COM CASCADE (remove triggers automaticamente)
DROP FUNCTION IF EXISTS log_task_initial_status() CASCADE;
DROP FUNCTION IF EXISTS log_task_status_change() CASCADE;

-- Recriar a função log_task_initial_status com SECURITY DEFINER
CREATE OR REPLACE FUNCTION log_task_initial_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_status_log (task_id, status_anterior, status_novo, alterado_por)
  VALUES (NEW.id, NULL, NEW.status, NEW.created_by);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao logar status inicial da tarefa: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar a função log_task_status_change com SECURITY DEFINER
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO task_status_log (task_id, status_anterior, status_novo, alterado_por)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao logar mudança de status da tarefa: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar os triggers
CREATE TRIGGER trigger_log_task_initial_status
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_initial_status();

CREATE TRIGGER trigger_log_task_status_change
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_status_change();

-- Corrigir a função log_client_activity com tratamento de erro robusto
CREATE OR REPLACE FUNCTION log_client_activity(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_activity_logs (user_id, event_type, event_data, created_at)
  VALUES (p_user_id, p_event_type, p_event_data, NOW())
  ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'log_client_activity falhou para user %: %', p_user_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;