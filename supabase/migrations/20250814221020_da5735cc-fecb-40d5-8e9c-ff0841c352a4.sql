-- Criar tabela para controle de payment_ids já processados
CREATE TABLE IF NOT EXISTS public.payment_processing_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL UNIQUE,
  pedido_id UUID REFERENCES public.pedidos(id),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  webhook_source TEXT NOT NULL DEFAULT 'mercadopago',
  external_reference TEXT,
  amount NUMERIC,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_processing_payment_id ON public.payment_processing_control(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_processing_pedido_id ON public.payment_processing_control(pedido_id);
CREATE INDEX IF NOT EXISTS idx_payment_processing_processed_at ON public.payment_processing_control(processed_at);

-- RLS policies
ALTER TABLE public.payment_processing_control ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view payment processing control"
ON public.payment_processing_control FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "System can insert payment processing control"
ON public.payment_processing_control FOR INSERT
WITH CHECK (true);

-- Função para verificar se um payment_id já foi processado
CREATE OR REPLACE FUNCTION public.check_payment_already_processed(p_payment_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.payment_processing_control 
    WHERE payment_id = p_payment_id
  );
END;
$$;

-- Função para registrar processamento de pagamento
CREATE OR REPLACE FUNCTION public.register_payment_processing(
  p_payment_id TEXT,
  p_pedido_id UUID,
  p_external_reference TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_control_id UUID;
BEGIN
  INSERT INTO public.payment_processing_control (
    payment_id,
    pedido_id,
    external_reference,
    amount,
    details
  ) VALUES (
    p_payment_id,
    p_pedido_id,
    p_external_reference,
    p_amount,
    p_details
  ) RETURNING id INTO v_control_id;
  
  RETURN v_control_id;
END;
$$;