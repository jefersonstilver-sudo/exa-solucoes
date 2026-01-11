-- Permitir periodicidade semanal em despesas_fixas
ALTER TABLE public.despesas_fixas
  DROP CONSTRAINT IF EXISTS despesas_fixas_periodicidade_check;

ALTER TABLE public.despesas_fixas
  ADD CONSTRAINT despesas_fixas_periodicidade_check
  CHECK (
    periodicidade = ANY (
      ARRAY[
        'semanal'::text,
        'mensal'::text,
        'trimestral'::text,
        'semestral'::text,
        'anual'::text
      ]
    )
  );
