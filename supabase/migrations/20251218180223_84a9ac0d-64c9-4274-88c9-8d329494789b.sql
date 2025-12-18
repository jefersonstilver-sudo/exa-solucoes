-- =====================================================
-- PARTE 1: Corrigir numeração sequencial de propostas
-- =====================================================

-- Recriar função para gerar número sequencial de proposta
CREATE OR REPLACE FUNCTION public.generate_proposal_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := to_char(now(), 'YYYY');
  
  -- Buscar o maior número sequencial do ano atual
  SELECT COALESCE(MAX(
    CASE 
      WHEN number ~ ('^EXA-' || year_part || '-[0-9]+$')
      THEN CAST(SPLIT_PART(number, '-', 3) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO seq_num
  FROM public.proposals
  WHERE number LIKE 'EXA-' || year_part || '-%';
  
  -- Formato: EXA-YYYY-0001
  new_number := 'EXA-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 2: Sistema de arquivamento de propostas expiradas
-- =====================================================

-- Criar tabela de arquivo para auditoria
CREATE TABLE IF NOT EXISTS public.proposals_archived (
  id UUID PRIMARY KEY,
  original_data JSONB NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT DEFAULT 'expirada',
  archived_by TEXT DEFAULT 'system'
);

-- Habilitar RLS
ALTER TABLE public.proposals_archived ENABLE ROW LEVEL SECURITY;

-- Política para admins
CREATE POLICY "Admins can read archived proposals"
ON public.proposals_archived
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'diretor')
  )
);

-- Função para arquivar e excluir propostas expiradas
CREATE OR REPLACE FUNCTION public.archive_expired_proposals()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER := 0;
BEGIN
  -- Arquivar propostas expiradas que não foram aceitas/convertidas/pagas
  INSERT INTO public.proposals_archived (id, original_data, reason)
  SELECT 
    id, 
    to_jsonb(p.*), 
    'expirada'
  FROM public.proposals p
  WHERE expires_at < NOW() 
    AND status NOT IN ('convertida', 'aceita', 'paga', 'recusada');
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Excluir as propostas arquivadas
  DELETE FROM public.proposals
  WHERE expires_at < NOW() 
    AND status NOT IN ('convertida', 'aceita', 'paga', 'recusada');
  
  -- Log do arquivamento
  INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
  VALUES ('PROPOSALS_ARCHIVED', 'Arquivadas ' || archived_count || ' propostas expiradas');
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTE 3: Corrigir proposta específica que foi aceita
-- =====================================================

UPDATE public.proposals 
SET status = 'aceita', responded_at = NOW()
WHERE id = '7f070674-d4a2-4940-9a49-62c3177f68f8'
  AND status NOT IN ('aceita', 'convertida', 'paga');

-- =====================================================
-- PARTE 4: Arquivar propostas expiradas existentes agora
-- =====================================================

SELECT public.archive_expired_proposals();