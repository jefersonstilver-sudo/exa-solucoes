-- Insert missing categories into contact_scoring_config
INSERT INTO contact_scoring_config (categoria, pontuacao_minima, pontuacao_ativa) 
VALUES
  ('sindico_exa', 0, false),
  ('prestador_elevador', 0, false),
  ('eletricista', 0, false),
  ('provedor', 0, false),
  ('equipe_exa', 0, false),
  ('parceiro_exa', 0, false),
  ('parceiro_lead', 0, false),
  ('outros', 0, false)
ON CONFLICT (categoria) DO NOTHING;