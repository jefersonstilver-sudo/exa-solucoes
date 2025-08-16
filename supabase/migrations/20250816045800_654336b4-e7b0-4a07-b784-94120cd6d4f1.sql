-- Limpar cache de geocoding genérico incorreto
DELETE FROM building_geocodes WHERE address = 'Foz do Iguaçu, PR';

-- Corrigir endereços e coordenadas dos prédios
UPDATE buildings SET 
  endereco = 'R. Mal. Deodoro, 366 - Centro',
  bairro = 'Centro',
  latitude = -25.5478,
  longitude = -54.5882
WHERE nome = 'Rio Negro';

UPDATE buildings SET 
  endereco = 'R. Dom Pedro II, 123 - Vila Portes',
  bairro = 'Vila Portes',
  latitude = -25.5356,
  longitude = -54.5794
WHERE nome = 'Edificio Vale do Monjolo';

-- Corrigir coordenadas para Edificio Luiz XV (endereço já está correto)
UPDATE buildings SET 
  latitude = -25.5475,
  longitude = -54.5890
WHERE nome = 'Edificio Luiz XV';

-- Inserir geocodes corretos para os prédios
INSERT INTO building_geocodes (building_id, address, normalized_address, lat, lng, precision, provider) VALUES
(
  (SELECT id FROM buildings WHERE nome = 'Rio Negro'),
  'R. Mal. Deodoro, 366 - Centro, Foz do Iguaçu - PR',
  'r. mal. deodoro, 366 - centro, foz do iguacu - pr',
  -25.5478,
  -54.5882,
  'rooftop',
  'manual'
),
(
  (SELECT id FROM buildings WHERE nome = 'Edificio Vale do Monjolo'),
  'R. Dom Pedro II, 123 - Vila Portes, Foz do Iguaçu - PR',
  'r. dom pedro ii, 123 - vila portes, foz do iguacu - pr',
  -25.5356,
  -54.5794,
  'rooftop',
  'manual'
),
(
  (SELECT id FROM buildings WHERE nome = 'Edificio Luiz XV'),
  'R. Mal. Floriano Peixoto, 1157 - Centro, Foz do Iguaçu - PR',
  'r. mal. floriano peixoto, 1157 - centro, foz do iguacu - pr',
  -25.5475,
  -54.5890,
  'rooftop',
  'manual'
);