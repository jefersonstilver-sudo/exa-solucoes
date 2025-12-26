-- Corrigir coordenadas do Torre Azul usando latitude/longitude direto
-- Vamos usar apenas latitude/longitude normal (não manual) para evitar trigger
UPDATE buildings 
SET 
  latitude = -25.5395,
  longitude = -54.5775
WHERE nome ILIKE '%torre azul%';