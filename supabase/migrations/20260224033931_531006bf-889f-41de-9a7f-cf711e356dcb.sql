
CREATE TABLE public.task_read_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_read_receipts_task_id ON public.task_read_receipts(task_id);
CREATE INDEX idx_task_read_receipts_phone ON public.task_read_receipts(contact_phone);

ALTER TABLE public.task_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view task read receipts"
  ON public.task_read_receipts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage task read receipts"
  ON public.task_read_receipts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
