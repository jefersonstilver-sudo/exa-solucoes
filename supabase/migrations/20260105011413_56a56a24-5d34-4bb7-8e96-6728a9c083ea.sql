-- Adicionar todas as categorias faltantes à tabela contact_scoring_config
INSERT INTO contact_scoring_config (categoria, pontuacao_minima, pontuacao_ativa)
SELECT categoria, 0, false
FROM unnest(ARRAY['sindico_exa', 'prestador_elevador', 'eletricista', 'provedor', 'equipe_exa', 'parceiro_exa', 'parceiro_lead', 'outros']) AS categoria
WHERE NOT EXISTS (
  SELECT 1 FROM contact_scoring_config csc WHERE csc.categoria = categoria
)
ON CONFLICT DO NOTHING;