
-- Create the tentativas_compra table that's missing from the schema
CREATE TABLE public.tentativas_compra (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_user uuid NOT NULL,
  predios_selecionados integer[] DEFAULT '{}',
  valor_total numeric DEFAULT 0,
  credencial text,
  predio text,
  transaction_id text,
  price_locked boolean DEFAULT false,
  price_calculation_log jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.tentativas_compra ENABLE ROW LEVEL SECURITY;

-- Create policies for tentativas_compra
CREATE POLICY "Users can view their own attempts" 
  ON public.tentativas_compra 
  FOR SELECT 
  USING (auth.uid() = id_user);

CREATE POLICY "Users can create their own attempts" 
  ON public.tentativas_compra 
  FOR INSERT 
  WITH CHECK (auth.uid() = id_user);

CREATE POLICY "Users can update their own attempts" 
  ON public.tentativas_compra 
  FOR UPDATE 
  USING (auth.uid() = id_user);

CREATE POLICY "Users can delete their own attempts" 
  ON public.tentativas_compra 
  FOR DELETE 
  USING (auth.uid() = id_user);

-- Add admin access policies
CREATE POLICY "Admins can view all attempts" 
  ON public.tentativas_compra 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );
