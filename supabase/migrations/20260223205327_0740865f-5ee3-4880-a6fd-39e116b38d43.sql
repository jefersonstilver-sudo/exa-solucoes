
-- Tabela de tipos de evento para agenda
CREATE TABLE public.event_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  icon text NOT NULL DEFAULT '📋',
  color text NOT NULL DEFAULT 'bg-gray-100 text-gray-700',
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Inserir tipos padrão
INSERT INTO public.event_types (name, label, icon, color, is_default, sort_order) VALUES
  ('tarefa', 'Tarefa', '✅', 'bg-emerald-100 text-emerald-700', true, 1),
  ('reuniao', 'Reunião', '📹', 'bg-blue-100 text-blue-700', true, 2),
  ('compromisso', 'Compromisso', '📍', 'bg-orange-100 text-orange-700', true, 3),
  ('aviso', 'Aviso', '📢', 'bg-purple-100 text-purple-700', true, 4);

-- RLS
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;

-- Leitura para qualquer autenticado
CREATE POLICY "event_types_select_authenticated"
  ON public.event_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Escrita apenas para admin/super_admin
CREATE POLICY "event_types_insert_admin"
  ON public.event_types
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'ceo')
    )
  );

CREATE POLICY "event_types_update_admin"
  ON public.event_types
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'ceo')
    )
  );

CREATE POLICY "event_types_delete_admin"
  ON public.event_types
  FOR DELETE
  TO authenticated
  USING (
    is_default = false AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'ceo')
    )
  );
