-- Adicionar campos para configuração de multa de quebra de contrato na tabela proposals
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS multa_rescisao_ativa boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS multa_rescisao_percentual numeric DEFAULT 20;