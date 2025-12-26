-- Criar building "Sala Jeff" com campos obrigatórios
INSERT INTO buildings (nome, endereco, bairro, latitude, longitude, manual_latitude, manual_longitude)
SELECT 
  'Sala Jeff',
  'Avenida Paraná, 974 - Centro, Foz do Iguaçu - PR',
  'Centro',
  -25.5406,
  -54.5880,
  -25.5406,
  -54.5880
WHERE NOT EXISTS (
  SELECT 1 FROM buildings WHERE nome = 'Sala Jeff'
);