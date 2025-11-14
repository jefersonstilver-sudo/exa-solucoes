-- Create contratos table for managing panel contracts
CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  painel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  predio_id UUID,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  plano_meses INTEGER NOT NULL,
  valor_mensal NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contratos_pedido_id ON public.contratos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_contratos_painel_id ON public.contratos(painel_id);
CREATE INDEX IF NOT EXISTS idx_contratos_user_id ON public.contratos(user_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON public.contratos(status);
CREATE INDEX IF NOT EXISTS idx_contratos_data_fim ON public.contratos(data_fim);

-- Enable Row Level Security
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own contracts
CREATE POLICY "Users can view their own contracts"
  ON public.contratos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all contracts
CREATE POLICY "Admins can view all contracts"
  ON public.contratos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Policy: System can insert contracts (for edge functions)
CREATE POLICY "System can insert contracts"
  ON public.contratos
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can update contracts
CREATE POLICY "Admins can update contracts"
  ON public.contratos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can delete contracts
CREATE POLICY "Admins can delete contracts"
  ON public.contratos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_contratos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contratos_updated_at_trigger
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contratos_updated_at();