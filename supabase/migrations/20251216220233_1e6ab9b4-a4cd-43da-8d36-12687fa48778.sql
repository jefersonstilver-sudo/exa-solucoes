-- Adicionar campos de última alteração na tabela produtos_exa
ALTER TABLE public.produtos_exa
ADD COLUMN IF NOT EXISTS ultima_alteracao_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS ultima_alteracao_por TEXT;

-- Criar trigger para atualizar automaticamente ultima_alteracao_em
CREATE OR REPLACE FUNCTION public.update_produtos_exa_ultima_alteracao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_alteracao_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_produtos_exa_ultima_alteracao ON public.produtos_exa;
CREATE TRIGGER trigger_produtos_exa_ultima_alteracao
BEFORE UPDATE ON public.produtos_exa
FOR EACH ROW
EXECUTE FUNCTION public.update_produtos_exa_ultima_alteracao();

-- Adicionar mesmos campos na configuracoes_exibicao se não existirem
ALTER TABLE public.configuracoes_exibicao
ADD COLUMN IF NOT EXISTS ultima_alteracao_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS ultima_alteracao_por TEXT;

-- Criar trigger para configuracoes_exibicao também
DROP TRIGGER IF EXISTS trigger_configuracoes_exibicao_ultima_alteracao ON public.configuracoes_exibicao;
CREATE TRIGGER trigger_configuracoes_exibicao_ultima_alteracao
BEFORE UPDATE ON public.configuracoes_exibicao
FOR EACH ROW
EXECUTE FUNCTION public.update_produtos_exa_ultima_alteracao();