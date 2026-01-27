-- Adicionar colunas para recorrência avançada na tabela despesas_fixas
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS total_parcelas INTEGER;
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS parcelas_pagas INTEGER DEFAULT 0;
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS recorrencia_tipo TEXT DEFAULT 'infinita'; -- 'infinita', 'limitada', 'personalizada'
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS intervalo_dias INTEGER; -- para recorrência personalizada
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS dias_semana TEXT[]; -- para semanal (ex: ARRAY['seg', 'qui'])
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS lembrete_dias INTEGER DEFAULT 3;
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS reajuste_tipo TEXT DEFAULT 'nenhum'; -- 'nenhum', 'ipca', 'igpm', 'fixo'
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS reajuste_percentual DECIMAL(5,2);
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS data_proximo_reajuste DATE;

-- Adicionar colunas para agendamento de pagamento nas tabelas de despesas
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente'; -- 'pendente', 'pago', 'atrasado', 'agendado'
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS data_pagamento_agendado DATE;
ALTER TABLE despesas_fixas ADD COLUMN IF NOT EXISTS auto_pagar_na_data BOOLEAN DEFAULT FALSE;

ALTER TABLE despesas_variaveis ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente'; -- 'pendente', 'pago', 'atrasado', 'agendado'
ALTER TABLE despesas_variaveis ADD COLUMN IF NOT EXISTS data_pagamento_agendado DATE;
ALTER TABLE despesas_variaveis ADD COLUMN IF NOT EXISTS auto_pagar_na_data BOOLEAN DEFAULT FALSE;

-- Comentários para documentação
COMMENT ON COLUMN despesas_fixas.recorrencia_tipo IS 'Tipo de recorrência: infinita (rolling 12 meses), limitada (número fixo de parcelas), personalizada (intervalo customizado)';
COMMENT ON COLUMN despesas_fixas.intervalo_dias IS 'Para recorrência personalizada: número de dias entre cada parcela';
COMMENT ON COLUMN despesas_fixas.dias_semana IS 'Para periodicidade semanal: dias específicos (ex: seg, ter, qui)';
COMMENT ON COLUMN despesas_fixas.reajuste_tipo IS 'Tipo de reajuste automático: nenhum, ipca, igpm, fixo';
COMMENT ON COLUMN despesas_fixas.data_pagamento_agendado IS 'Data agendada para pagamento automático';
COMMENT ON COLUMN despesas_fixas.auto_pagar_na_data IS 'Se true, marca como pago automaticamente na data agendada';