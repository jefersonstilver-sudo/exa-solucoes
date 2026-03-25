
-- Tabela de grupos de pedidos
CREATE TABLE IF NOT EXISTS public.pedido_grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cor text DEFAULT '#6B7280',
  ordem int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pedido_grupos ENABLE ROW LEVEL SECURITY;

-- Anunciante gerencia seus próprios grupos
CREATE POLICY "Users can manage own groups"
  ON public.pedido_grupos FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin pode ver todos os grupos
CREATE POLICY "Admins can view all groups"
  ON public.pedido_grupos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Super admin pode ver todos os grupos
CREATE POLICY "Super admins can view all groups"
  ON public.pedido_grupos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Adicionar coluna grupo_id na tabela pedidos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pedidos' AND column_name = 'grupo_id') THEN
    ALTER TABLE public.pedidos ADD COLUMN grupo_id uuid REFERENCES public.pedido_grupos(id) ON DELETE SET NULL;
  END IF;
END $$;
