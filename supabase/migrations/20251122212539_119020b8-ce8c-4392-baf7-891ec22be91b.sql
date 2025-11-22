-- Inserir 3 seções vazias para Sofia (section_number 1-3)
-- A Seção 4 (Base) vem dos knowledge_items
INSERT INTO agent_sections (agent_id, section_number, section_title, content)
VALUES 
  ('6e0278e4-c95d-4d90-b976-d19c375b644b', 1, 'Identidade & Papel do Agente', ''),
  ('6e0278e4-c95d-4d90-b976-d19c375b644b', 2, 'Contexto Operacional', ''),
  ('6e0278e4-c95d-4d90-b976-d19c375b644b', 3, 'Limites e Segurança', '')
ON CONFLICT (agent_id, section_number) DO NOTHING;