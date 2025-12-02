-- Adicionar coluna viewed_at para controle de visualização
ALTER TABLE public.escalacoes_comerciais 
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_escalacoes_viewed_at ON public.escalacoes_comerciais(viewed_at) WHERE viewed_at IS NULL;