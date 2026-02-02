-- Adicionar novos campos à tabela proposals para suportar propostas de permuta
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS modalidade_proposta text DEFAULT 'monetaria',
ADD COLUMN IF NOT EXISTS itens_permuta jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS valor_total_permuta numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS ocultar_valores_publico boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS descricao_contrapartida text,
ADD COLUMN IF NOT EXISTS metodo_pagamento_alternativo text;

-- Constraint para validar modalidade
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'proposals_modalidade_check') THEN
    ALTER TABLE proposals 
    ADD CONSTRAINT proposals_modalidade_check 
    CHECK (modalidade_proposta IN ('monetaria', 'permuta'));
  END IF;
END $$;

-- Constraint para métodos alternativos
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'proposals_metodo_alternativo_check') THEN
    ALTER TABLE proposals 
    ADD CONSTRAINT proposals_metodo_alternativo_check 
    CHECK (metodo_pagamento_alternativo IS NULL OR metodo_pagamento_alternativo IN ('permuta', 'patrocinio', 'cortesia_estrategica', 'institucional'));
  END IF;
END $$;