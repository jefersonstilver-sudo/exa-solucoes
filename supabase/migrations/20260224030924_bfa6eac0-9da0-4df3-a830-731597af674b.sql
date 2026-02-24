
-- Task notification queue for WhatsApp follow-up system
CREATE TABLE public.task_notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  criado_por uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent_to_creator', 'escalated', 'resolved')),
  action text CHECK (action IN ('concluir', 'reagendar', 'cancelar')),
  resposta_de text,
  justificativa text,
  nova_data date,
  awaiting_confirmation boolean NOT NULL DEFAULT false,
  pending_action text CHECK (pending_action IN ('concluir', 'reagendar', 'cancelar')),
  sent_at timestamptz,
  escalated_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_task_notification_queue_task_id ON public.task_notification_queue(task_id);
CREATE INDEX idx_task_notification_queue_status ON public.task_notification_queue(status);
CREATE INDEX idx_task_notification_queue_sent_at ON public.task_notification_queue(sent_at);

-- Add notify columns to tasks table
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS notify_on_save boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_followup boolean DEFAULT true;

-- RLS
ALTER TABLE public.task_notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage task notifications" ON public.task_notification_queue
  FOR ALL USING (true) WITH CHECK (true);
