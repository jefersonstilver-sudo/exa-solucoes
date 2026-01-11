-- ============================================================
-- CONSOLIDAÇÃO: Remover tabela legacy subcategorias_despesas
-- ============================================================

-- 1. Remover foreign keys que referenciam subcategorias_despesas
ALTER TABLE despesas_fixas DROP CONSTRAINT IF EXISTS despesas_fixas_subcategoria_id_fkey;
ALTER TABLE despesas_variaveis DROP CONSTRAINT IF EXISTS despesas_variaveis_subcategoria_id_fkey;
ALTER TABLE assinaturas_operacionais DROP CONSTRAINT IF EXISTS assinaturas_operacionais_subcategoria_id_fkey;

-- 2. Dropar a tabela subcategorias_despesas
DROP TABLE IF EXISTS subcategorias_despesas;

-- 3. Atualizar comentário da tabela categorias_despesas para refletir sua nova função
COMMENT ON TABLE categorias_despesas IS 'Tabela oficial de categorias financeiras hierárquicas. Suporta entrada (receitas) e saída (despesas) via coluna fluxo. Estrutura multinível com parent_id.';