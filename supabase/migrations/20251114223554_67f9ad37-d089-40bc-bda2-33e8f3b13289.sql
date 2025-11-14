-- Adicionar campo para código de vinculação de 5 dígitos
ALTER TABLE public.painels 
ADD COLUMN IF NOT EXISTS codigo_vinculacao VARCHAR(5);

-- Criar índice para busca rápida por código
CREATE INDEX IF NOT EXISTS idx_painels_codigo_vinculacao 
ON public.painels(codigo_vinculacao);

-- Adicionar campo para armazenar data/hora da primeira conexão
ALTER TABLE public.painels 
ADD COLUMN IF NOT EXISTS primeira_conexao_at TIMESTAMP WITH TIME ZONE;