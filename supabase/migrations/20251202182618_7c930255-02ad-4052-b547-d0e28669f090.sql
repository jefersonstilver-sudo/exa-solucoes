-- Adicionar coluna responded_at para rastrear quando Eduardo respondeu via botão
ALTER TABLE public.escalacoes_comerciais 
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;

-- Adicionar coluna response_type para saber qual botão foi clicado
ALTER TABLE public.escalacoes_comerciais 
ADD COLUMN IF NOT EXISTS response_type TEXT;

-- Índice para buscar rapidamente escalações por response_type
CREATE INDEX IF NOT EXISTS idx_escalacoes_response_type ON public.escalacoes_comerciais(response_type);

COMMENT ON COLUMN public.escalacoes_comerciais.responded_at IS 'Timestamp de quando o vendedor clicou no botão de resposta';
COMMENT ON COLUMN public.escalacoes_comerciais.response_type IS 'Tipo de resposta: ja_respondido, vou_responder';