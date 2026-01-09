-- Criar tabela extrato_bancario
CREATE TABLE IF NOT EXISTS public.extrato_bancario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id UUID,
  data_transacao DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'credito',
  tipo_transacao TEXT,
  valor NUMERIC(15,2) NOT NULL,
  descricao TEXT,
  codigo_transacao TEXT UNIQUE,
  txid TEXT,
  codigo_barras TEXT,
  conciliado BOOLEAN DEFAULT false,
  origem_id UUID,
  origem_tipo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.extrato_bancario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access extrato" ON public.extrato_bancario FOR ALL USING (true);