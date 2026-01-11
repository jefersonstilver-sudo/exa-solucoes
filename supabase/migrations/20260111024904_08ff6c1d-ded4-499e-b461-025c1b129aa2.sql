-- =============================================
-- FASE 3: Popular Subcategorias + Trigger Automático
-- =============================================

-- 1. Popular subcategorias para cada categoria existente
INSERT INTO subcategorias_despesas (categoria_id, nome, descricao, ativo)
SELECT 
  c.id,
  s.nome,
  s.descricao,
  true
FROM categorias_despesas c
CROSS JOIN (
  VALUES 
    -- Marketing
    ('Tráfego Pago', 'Google Ads, Meta Ads, etc.'),
    ('Ferramentas Marketing', 'Ferramentas de automação e análise'),
    ('Conteúdo', 'Produção de vídeos, fotos, textos'),
    ('Eventos', 'Participação em feiras e eventos')
) AS s(nome, descricao)
WHERE c.nome ILIKE '%marketing%'
AND NOT EXISTS (
  SELECT 1 FROM subcategorias_despesas sub 
  WHERE sub.categoria_id = c.id AND sub.nome = s.nome
);

INSERT INTO subcategorias_despesas (categoria_id, nome, descricao, ativo)
SELECT 
  c.id,
  s.nome,
  s.descricao,
  true
FROM categorias_despesas c
CROSS JOIN (
  VALUES 
    ('Salários', 'Folha de pagamento CLT'),
    ('Freelancers', 'Prestadores de serviço'),
    ('Benefícios', 'VR, VT, Plano de saúde'),
    ('INSS', 'Contribuição previdenciária'),
    ('FGTS', 'Fundo de garantia')
) AS s(nome, descricao)
WHERE (c.nome ILIKE '%folha%' OR c.nome ILIKE '%pessoal%' OR c.nome ILIKE '%salário%')
AND NOT EXISTS (
  SELECT 1 FROM subcategorias_despesas sub 
  WHERE sub.categoria_id = c.id AND sub.nome = s.nome
);

INSERT INTO subcategorias_despesas (categoria_id, nome, descricao, ativo)
SELECT 
  c.id,
  s.nome,
  s.descricao,
  true
FROM categorias_despesas c
CROSS JOIN (
  VALUES 
    ('APIs', 'OpenAI, Z-API, etc.'),
    ('Infraestrutura', 'AWS, Supabase, servidores'),
    ('Licenças', 'Softwares e licenciamento'),
    ('Servidores', 'Hospedagem e cloud')
) AS s(nome, descricao)
WHERE (c.nome ILIKE '%software%' OR c.nome ILIKE '%tecnologia%' OR c.nome ILIKE '%saas%')
AND NOT EXISTS (
  SELECT 1 FROM subcategorias_despesas sub 
  WHERE sub.categoria_id = c.id AND sub.nome = s.nome
);

INSERT INTO subcategorias_despesas (categoria_id, nome, descricao, ativo)
SELECT 
  c.id,
  s.nome,
  s.descricao,
  true
FROM categorias_despesas c
CROSS JOIN (
  VALUES 
    ('Escritório', 'Aluguel do escritório principal'),
    ('Coworking', 'Espaço compartilhado'),
    ('Depósito', 'Aluguel de depósito/estoque')
) AS s(nome, descricao)
WHERE c.nome ILIKE '%aluguel%'
AND NOT EXISTS (
  SELECT 1 FROM subcategorias_despesas sub 
  WHERE sub.categoria_id = c.id AND sub.nome = s.nome
);

INSERT INTO subcategorias_despesas (categoria_id, nome, descricao, ativo)
SELECT 
  c.id,
  s.nome,
  s.descricao,
  true
FROM categorias_despesas c
CROSS JOIN (
  VALUES 
    ('Internet Fibra', 'Internet do escritório'),
    ('Celular', 'Planos de celular corporativo'),
    ('VoIP', 'Telefonia IP')
) AS s(nome, descricao)
WHERE (c.nome ILIKE '%internet%' OR c.nome ILIKE '%telefone%' OR c.nome ILIKE '%telecom%')
AND NOT EXISTS (
  SELECT 1 FROM subcategorias_despesas sub 
  WHERE sub.categoria_id = c.id AND sub.nome = s.nome
);

INSERT INTO subcategorias_despesas (categoria_id, nome, descricao, ativo)
SELECT 
  c.id,
  s.nome,
  s.descricao,
  true
FROM categorias_despesas c
CROSS JOIN (
  VALUES 
    ('Hardware', 'Computadores, notebooks, periféricos'),
    ('Móveis', 'Mesas, cadeiras, armários'),
    ('Manutenção Equipamentos', 'Reparos e manutenção preventiva')
) AS s(nome, descricao)
WHERE c.nome ILIKE '%equipamento%'
AND NOT EXISTS (
  SELECT 1 FROM subcategorias_despesas sub 
  WHERE sub.categoria_id = c.id AND sub.nome = s.nome
);

INSERT INTO subcategorias_despesas (categoria_id, nome, descricao, ativo)
SELECT 
  c.id,
  s.nome,
  s.descricao,
  true
FROM categorias_despesas c
CROSS JOIN (
  VALUES 
    ('Honorários Contábeis', 'Mensalidade do contador'),
    ('Consultoria Fiscal', 'Consultoria tributária'),
    ('Certidões', 'Emissão de certidões e documentos')
) AS s(nome, descricao)
WHERE c.nome ILIKE '%contabil%'
AND NOT EXISTS (
  SELECT 1 FROM subcategorias_despesas sub 
  WHERE sub.categoria_id = c.id AND sub.nome = s.nome
);

INSERT INTO subcategorias_despesas (categoria_id, nome, descricao, ativo)
SELECT 
  c.id,
  s.nome,
  s.descricao,
  true
FROM categorias_despesas c
CROSS JOIN (
  VALUES 
    ('Advocacia', 'Honorários advocatícios'),
    ('Contratos', 'Elaboração e revisão de contratos'),
    ('Registros', 'Registros em cartório')
) AS s(nome, descricao)
WHERE c.nome ILIKE '%jurídico%' OR c.nome ILIKE '%juridico%'
AND NOT EXISTS (
  SELECT 1 FROM subcategorias_despesas sub 
  WHERE sub.categoria_id = c.id AND sub.nome = s.nome
);

INSERT INTO subcategorias_despesas (categoria_id, nome, descricao, ativo)
SELECT 
  c.id,
  s.nome,
  s.descricao,
  true
FROM categorias_despesas c
CROSS JOIN (
  VALUES 
    ('Manutenção Predial', 'Reparos no escritório'),
    ('Manutenção Equipamentos', 'Manutenção de máquinas'),
    ('Manutenção Veículos', 'Manutenção da frota')
) AS s(nome, descricao)
WHERE c.nome ILIKE '%manutenção%' OR c.nome ILIKE '%manutencao%'
AND NOT EXISTS (
  SELECT 1 FROM subcategorias_despesas sub 
  WHERE sub.categoria_id = c.id AND sub.nome = s.nome
);

INSERT INTO subcategorias_despesas (categoria_id, nome, descricao, ativo)
SELECT 
  c.id,
  s.nome,
  s.descricao,
  true
FROM categorias_despesas c
CROSS JOIN (
  VALUES 
    ('Diversos', 'Despesas diversas não categorizadas'),
    ('Emergenciais', 'Gastos emergenciais')
) AS s(nome, descricao)
WHERE c.nome ILIKE '%outro%'
AND NOT EXISTS (
  SELECT 1 FROM subcategorias_despesas sub 
  WHERE sub.categoria_id = c.id AND sub.nome = s.nome
);

-- 2. Criar função para geração automática de parcelas
CREATE OR REPLACE FUNCTION generate_expense_installments()
RETURNS TRIGGER AS $$
DECLARE
  i INTEGER;
  interval_months INTEGER;
  next_due_date DATE;
  dia_real INTEGER;
BEGIN
  -- Determinar intervalo baseado na periodicidade
  CASE NEW.periodicidade
    WHEN 'mensal' THEN interval_months := 1;
    WHEN 'trimestral' THEN interval_months := 3;
    WHEN 'semestral' THEN interval_months := 6;
    WHEN 'anual' THEN interval_months := 12;
    ELSE interval_months := 1;
  END CASE;

  -- Gerar 12 parcelas a partir do próximo mês
  FOR i IN 1..12 LOOP
    -- Calcular a data base do próximo mês
    next_due_date := (CURRENT_DATE + (i * interval_months || ' months')::interval)::DATE;
    
    -- Ajustar para o dia de vencimento correto
    dia_real := LEAST(COALESCE(NEW.dia_vencimento, 10), 
                      EXTRACT(DAY FROM (DATE_TRUNC('month', next_due_date) + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER);
    next_due_date := DATE_TRUNC('month', next_due_date)::DATE + (dia_real - 1);
    
    INSERT INTO parcelas_despesas (
      despesa_fixa_id,
      competencia,
      valor,
      data_vencimento,
      status
    ) VALUES (
      NEW.id,
      TO_CHAR(next_due_date, 'YYYY-MM'),
      NEW.valor,
      next_due_date,
      'pendente'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Criar trigger para disparar após INSERT em despesas_fixas
DROP TRIGGER IF EXISTS after_insert_despesa_fixa ON despesas_fixas;
CREATE TRIGGER after_insert_despesa_fixa
  AFTER INSERT ON despesas_fixas
  FOR EACH ROW
  EXECUTE FUNCTION generate_expense_installments();