-- Fase 1: Adicionar campo fluxo e categorias de entrada (receitas)
-- Usando tipo 'variavel' para categorias de entrada (compatível com constraint existente)

-- 1. Adicionar campo fluxo para distinguir entrada/saída
ALTER TABLE categorias_despesas 
ADD COLUMN fluxo TEXT NOT NULL DEFAULT 'saida' 
CHECK (fluxo IN ('entrada', 'saida'));

-- 2. Criar índice para performance
CREATE INDEX idx_categorias_fluxo ON categorias_despesas(fluxo);

-- 3. Inserir as 4 categorias-mãe de ENTRADA (fixas)

-- Receita Operacional
INSERT INTO categorias_despesas (id, nome, tipo, cor, icone, parent_id, nivel, ordem, ativo, fluxo)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'Receita Operacional',
  'variavel',
  '#22C55E',
  'banknote',
  NULL,
  0,
  1,
  true,
  'entrada'
);

-- Receita Recorrente
INSERT INTO categorias_despesas (id, nome, tipo, cor, icone, parent_id, nivel, ordem, ativo, fluxo)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  'Receita Recorrente',
  'fixa',
  '#3B82F6',
  'refresh-cw',
  NULL,
  0,
  2,
  true,
  'entrada'
);

-- Receita Financeira
INSERT INTO categorias_despesas (id, nome, tipo, cor, icone, parent_id, nivel, ordem, ativo, fluxo)
VALUES (
  '00000000-0000-0000-0000-000000000012',
  'Receita Financeira',
  'variavel',
  '#8B5CF6',
  'coins',
  NULL,
  0,
  3,
  true,
  'entrada'
);

-- Aportes & Capital
INSERT INTO categorias_despesas (id, nome, tipo, cor, icone, parent_id, nivel, ordem, ativo, fluxo)
VALUES (
  '00000000-0000-0000-0000-000000000013',
  'Aportes & Capital',
  'variavel',
  '#F59E0B',
  'landmark',
  NULL,
  0,
  4,
  true,
  'entrada'
);

-- 4. Inserir as 5 subcategorias oficiais de ENTRADA

-- Vendas Avulsas (sob Receita Operacional)
INSERT INTO categorias_despesas (id, nome, tipo, cor, icone, parent_id, nivel, ordem, ativo, fluxo)
VALUES (
  gen_random_uuid(),
  'Vendas Avulsas',
  'variavel',
  '#22C55E',
  'shopping-bag',
  '00000000-0000-0000-0000-000000000010',
  1,
  1,
  true,
  'entrada'
);

-- Assinaturas (sob Receita Recorrente)
INSERT INTO categorias_despesas (id, nome, tipo, cor, icone, parent_id, nivel, ordem, ativo, fluxo)
VALUES (
  gen_random_uuid(),
  'Assinaturas',
  'fixa',
  '#3B82F6',
  'repeat',
  '00000000-0000-0000-0000-000000000011',
  1,
  1,
  true,
  'entrada'
);

-- Rendimentos Financeiros (sob Receita Financeira)
INSERT INTO categorias_despesas (id, nome, tipo, cor, icone, parent_id, nivel, ordem, ativo, fluxo)
VALUES (
  gen_random_uuid(),
  'Rendimentos Financeiros',
  'variavel',
  '#8B5CF6',
  'trending-up',
  '00000000-0000-0000-0000-000000000012',
  1,
  1,
  true,
  'entrada'
);

-- Aportes dos Sócios (sob Aportes & Capital)
INSERT INTO categorias_despesas (id, nome, tipo, cor, icone, parent_id, nivel, ordem, ativo, fluxo)
VALUES (
  gen_random_uuid(),
  'Aportes dos Sócios',
  'variavel',
  '#F59E0B',
  'user-plus',
  '00000000-0000-0000-0000-000000000013',
  1,
  1,
  true,
  'entrada'
);

-- Empréstimos (sob Aportes & Capital)
INSERT INTO categorias_despesas (id, nome, tipo, cor, icone, parent_id, nivel, ordem, ativo, fluxo)
VALUES (
  gen_random_uuid(),
  'Empréstimos',
  'variavel',
  '#F59E0B',
  'building-2',
  '00000000-0000-0000-0000-000000000013',
  1,
  2,
  true,
  'entrada'
);

-- 5. Atualizar política de DELETE para incluir novas categorias fixas de entrada
DROP POLICY IF EXISTS "Usuários autenticados podem deletar categorias não-fixas" ON public.categorias_despesas;

CREATE POLICY "Usuários autenticados podem deletar categorias não-fixas"
ON public.categorias_despesas
FOR DELETE
TO authenticated
USING (
  id NOT IN (
    -- Categorias fixas de SAÍDA
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    -- Categorias fixas de ENTRADA
    '00000000-0000-0000-0000-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000012'::uuid,
    '00000000-0000-0000-0000-000000000013'::uuid
  )
);