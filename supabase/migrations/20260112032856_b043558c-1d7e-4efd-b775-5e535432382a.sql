-- Gerar parcelas do mês atual para despesas fixas que ainda não têm
-- Isso corrige o problema de parcelas faltando no fluxo de caixa

-- Inserir parcelas para despesas fixas MENSAIS que ainda não têm parcela no mês atual
INSERT INTO parcelas_despesas (despesa_fixa_id, competencia, data_vencimento, valor, status, origem)
SELECT 
  df.id,
  TO_CHAR(CURRENT_DATE, 'YYYY-MM') as competencia,
  make_date(
    EXTRACT(YEAR FROM CURRENT_DATE)::int,
    EXTRACT(MONTH FROM CURRENT_DATE)::int,
    LEAST(COALESCE(df.dia_vencimento, 1), 28)
  ) as data_vencimento,
  COALESCE(df.valor, 0) as valor,
  'pendente' as status,
  'despesa_fixa' as origem
FROM despesas_fixas df
WHERE df.ativo = true
  AND df.periodicidade IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual')
  AND NOT EXISTS (
    SELECT 1 FROM parcelas_despesas pd 
    WHERE pd.despesa_fixa_id = df.id 
      AND EXTRACT(YEAR FROM pd.data_vencimento) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND EXTRACT(MONTH FROM pd.data_vencimento) = EXTRACT(MONTH FROM CURRENT_DATE)
  )
ON CONFLICT DO NOTHING;

-- Inserir parcelas para despesas SEMANAIS usando data_primeiro_lancamento
INSERT INTO parcelas_despesas (despesa_fixa_id, competencia, data_vencimento, valor, status, origem)
SELECT 
  df.id,
  TO_CHAR(weeks.week_date, 'YYYY-MM') as competencia,
  weeks.week_date::date as data_vencimento,
  COALESCE(df.valor, 0) as valor,
  'pendente' as status,
  'despesa_fixa' as origem
FROM despesas_fixas df
CROSS JOIN LATERAL (
  SELECT (df.data_primeiro_lancamento + (n * INTERVAL '1 week'))::date as week_date
  FROM generate_series(0, 51) n
) weeks
WHERE df.ativo = true
  AND df.periodicidade = 'semanal'
  AND df.data_primeiro_lancamento IS NOT NULL
  AND weeks.week_date >= df.data_primeiro_lancamento
  AND weeks.week_date <= (df.data_primeiro_lancamento + INTERVAL '1 year')::date
  AND NOT EXISTS (
    SELECT 1 FROM parcelas_despesas pd 
    WHERE pd.despesa_fixa_id = df.id 
      AND pd.data_vencimento = weeks.week_date
  )
ON CONFLICT DO NOTHING;