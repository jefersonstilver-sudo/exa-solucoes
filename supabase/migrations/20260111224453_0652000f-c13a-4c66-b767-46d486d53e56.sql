-- Add missing columns to asaas_saidas for categorization support
ALTER TABLE public.asaas_saidas
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES public.categorias_despesas(id),
ADD COLUMN IF NOT EXISTS centro_custo_id UUID REFERENCES public.centros_custo(id),
ADD COLUMN IF NOT EXISTS conciliado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS conciliado_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS conciliado_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS observacao TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asaas_saidas_categoria_id ON public.asaas_saidas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_asaas_saidas_centro_custo_id ON public.asaas_saidas(centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_asaas_saidas_conciliado ON public.asaas_saidas(conciliado);