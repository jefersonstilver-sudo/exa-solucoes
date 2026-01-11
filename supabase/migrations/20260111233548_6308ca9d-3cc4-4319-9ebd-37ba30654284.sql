-- Criar tabela de relação N:N entre despesas e prédios
CREATE TABLE IF NOT EXISTS public.despesas_predios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  despesa_fixa_id UUID REFERENCES public.despesas_fixas(id) ON DELETE CASCADE,
  despesa_variavel_id UUID REFERENCES public.despesas_variaveis(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_despesa_tipo CHECK (
    (despesa_fixa_id IS NOT NULL AND despesa_variavel_id IS NULL) OR
    (despesa_fixa_id IS NULL AND despesa_variavel_id IS NOT NULL)
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_despesas_predios_fixa ON public.despesas_predios(despesa_fixa_id);
CREATE INDEX IF NOT EXISTS idx_despesas_predios_variavel ON public.despesas_predios(despesa_variavel_id);
CREATE INDEX IF NOT EXISTS idx_despesas_predios_building ON public.despesas_predios(building_id);

-- Habilitar RLS
ALTER TABLE public.despesas_predios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Autenticados podem ver despesas_predios"
  ON public.despesas_predios FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Autenticados podem inserir despesas_predios"
  ON public.despesas_predios FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados podem atualizar despesas_predios"
  ON public.despesas_predios FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Autenticados podem deletar despesas_predios"
  ON public.despesas_predios FOR DELETE
  TO authenticated USING (true);