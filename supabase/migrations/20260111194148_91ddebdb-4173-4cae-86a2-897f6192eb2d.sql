-- =====================================================
-- MÓDULO DE CATEGORIAS HIERÁRQUICO v1.0
-- Migration completa em ordem correta
-- =====================================================

-- PASSO 1: Remover constraint único de nome PRIMEIRO
ALTER TABLE categorias_despesas 
DROP CONSTRAINT IF EXISTS categorias_despesas_nome_key;

-- PASSO 2: Adicionar colunas para hierarquia
ALTER TABLE categorias_despesas 
ADD COLUMN parent_id UUID REFERENCES categorias_despesas(id) ON DELETE CASCADE;

ALTER TABLE categorias_despesas
ADD COLUMN ordem INTEGER DEFAULT 0;

ALTER TABLE categorias_despesas
ADD COLUMN nivel INTEGER DEFAULT 0;

-- PASSO 3: Criar índices para performance
CREATE INDEX idx_categorias_parent ON categorias_despesas(parent_id);
CREATE INDEX idx_categorias_ordem ON categorias_despesas(ordem);
CREATE INDEX idx_categorias_nivel ON categorias_despesas(nivel);

-- PASSO 4: Criar índice único composto (nome + parent_id)
CREATE UNIQUE INDEX idx_categorias_nome_parent 
ON categorias_despesas (nome, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- PASSO 5: Atualizar constraint de tipo
ALTER TABLE categorias_despesas 
DROP CONSTRAINT IF EXISTS categorias_despesas_tipo_check;

ALTER TABLE categorias_despesas
ADD CONSTRAINT categorias_despesas_tipo_check 
CHECK (tipo = ANY (ARRAY['fixa'::text, 'variavel'::text, 'ambos'::text, 'investimento'::text]));

-- PASSO 6: Atualizar categorias existentes
UPDATE categorias_despesas 
SET nivel = 0, ordem = 0 
WHERE parent_id IS NULL;

-- PASSO 7: Inserir categorias-mãe fixas
INSERT INTO categorias_despesas (id, nome, tipo, cor, icone, parent_id, nivel, ordem, ativo)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Custos Fixos', 'fixa', '#3B82F6', 'building', NULL, 0, 1, true),
  ('00000000-0000-0000-0000-000000000002', 'Custos Variáveis', 'variavel', '#F59E0B', 'trending-up', NULL, 0, 2, true),
  ('00000000-0000-0000-0000-000000000003', 'Investimentos', 'investimento', '#10B981', 'target', NULL, 0, 3, true)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  tipo = EXCLUDED.tipo,
  cor = EXCLUDED.cor,
  icone = EXCLUDED.icone,
  nivel = EXCLUDED.nivel,
  ordem = EXCLUDED.ordem;

-- PASSO 8: Migrar subcategorias existentes
INSERT INTO categorias_despesas (nome, tipo, cor, icone, parent_id, nivel, ordem, ativo)
SELECT 
  s.nome,
  c.tipo,
  COALESCE(c.cor, '#6B7280'),
  'circle',
  s.categoria_id,
  1,
  ROW_NUMBER() OVER (PARTITION BY s.categoria_id ORDER BY s.nome)::INTEGER,
  COALESCE(s.ativo, true)
FROM subcategorias_despesas s
JOIN categorias_despesas c ON c.id = s.categoria_id
ON CONFLICT DO NOTHING;

-- PASSO 9: Funções auxiliares
CREATE OR REPLACE FUNCTION get_categoria_children_count(cat_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM categorias_despesas
  WHERE parent_id = cat_id;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION categoria_has_children(cat_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM categorias_despesas WHERE parent_id = cat_id
  );
$$ LANGUAGE sql STABLE;