-- 1. Limpar referências de subcategoria em despesas_fixas
UPDATE despesas_fixas 
SET subcategoria_id = NULL;

-- 2. Atualizar categoria_id para uma das fixas em despesas_fixas
UPDATE despesas_fixas 
SET categoria_id = '00000000-0000-0000-0000-000000000001'
WHERE categoria_id IS NOT NULL
AND categoria_id NOT IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002', 
  '00000000-0000-0000-0000-000000000003'
);

-- 3. Limpar outras referências
UPDATE caixa_manual 
SET categoria_id = NULL
WHERE categoria_id IS NOT NULL 
AND categoria_id NOT IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002', 
  '00000000-0000-0000-0000-000000000003'
);

UPDATE assinaturas_operacionais 
SET categoria_id = NULL, subcategoria_id = NULL
WHERE categoria_id IS NOT NULL 
AND categoria_id NOT IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002', 
  '00000000-0000-0000-0000-000000000003'
);

-- 4. Deletar subcategorias antigas da tabela separada
DELETE FROM subcategorias_despesas;

-- 5. Agora remover TODAS as categorias não-fixas de categorias_despesas
DELETE FROM categorias_despesas 
WHERE id NOT IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002', 
  '00000000-0000-0000-0000-000000000003'
);

-- 6. Atualizar nomes oficiais das categorias-mãe
UPDATE categorias_despesas SET
  nome = 'Custos Fixos',
  cor = '#3B82F6',
  icone = 'building-2',
  tipo = 'fixa',
  nivel = 0,
  ordem = 1
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE categorias_despesas SET
  nome = 'Custos Variáveis',
  cor = '#F59E0B', 
  icone = 'trending-up',
  tipo = 'variavel',
  nivel = 0,
  ordem = 2
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE categorias_despesas SET
  nome = 'Investimentos',
  cor = '#10B981',
  icone = 'rocket',
  tipo = 'investimento',
  nivel = 0,
  ordem = 3
WHERE id = '00000000-0000-0000-0000-000000000003';

-- 7. Inserir as 8 subcategorias oficiais

-- CUSTOS FIXOS (3 subcategorias)
INSERT INTO categorias_despesas (id, nome, tipo, cor, icone, parent_id, nivel, ordem, ativo)
VALUES 
  (gen_random_uuid(), 'Sistema / Infraestrutura', 'fixa', '#3B82F6', 'server', '00000000-0000-0000-0000-000000000001', 1, 1, true),
  (gen_random_uuid(), 'Salários & Estrutura', 'fixa', '#3B82F6', 'users', '00000000-0000-0000-0000-000000000001', 1, 2, true),
  (gen_random_uuid(), 'Estrutura Administrativa', 'fixa', '#3B82F6', 'building', '00000000-0000-0000-0000-000000000001', 1, 3, true);

-- CUSTOS VARIÁVEIS (3 subcategorias)
INSERT INTO categorias_despesas (id, nome, tipo, cor, icone, parent_id, nivel, ordem, ativo)
VALUES 
  (gen_random_uuid(), 'Marketing & Aquisição', 'variavel', '#F59E0B', 'megaphone', '00000000-0000-0000-0000-000000000002', 1, 1, true),
  (gen_random_uuid(), 'Operação por Demanda', 'variavel', '#F59E0B', 'wrench', '00000000-0000-0000-0000-000000000002', 1, 2, true),
  (gen_random_uuid(), 'Taxas Variáveis', 'variavel', '#F59E0B', 'credit-card', '00000000-0000-0000-0000-000000000002', 1, 3, true);

-- INVESTIMENTOS (2 subcategorias)
INSERT INTO categorias_despesas (id, nome, tipo, cor, icone, parent_id, nivel, ordem, ativo)
VALUES 
  (gen_random_uuid(), 'Desenvolvimento & Evolução', 'investimento', '#10B981', 'code', '00000000-0000-0000-0000-000000000003', 1, 1, true),
  (gen_random_uuid(), 'Crescimento & Estratégia', 'investimento', '#10B981', 'target', '00000000-0000-0000-0000-000000000003', 1, 2, true);