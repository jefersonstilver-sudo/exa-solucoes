-- Add codigo_predio column to buildings table
ALTER TABLE buildings ADD COLUMN codigo_predio TEXT;

-- Add constraints for unique codes and 3-digit format
ALTER TABLE buildings ADD CONSTRAINT codigo_predio_unique UNIQUE (codigo_predio);
ALTER TABLE buildings ADD CONSTRAINT codigo_predio_format CHECK (codigo_predio ~ '^[0-9]{3}$');

-- Update buildings with their specific codes
UPDATE buildings SET codigo_predio = '107' WHERE nome = 'Edificio Luiz XV';
UPDATE buildings SET codigo_predio = '106' WHERE nome = 'Rio Negro';
UPDATE buildings SET codigo_predio = '102' WHERE nome ILIKE '%Las Brisas%' OR nome ILIKE '%Laris Brisas%';
UPDATE buildings SET codigo_predio = '103' WHERE nome = 'Pietro Angelo';
UPDATE buildings SET codigo_predio = '105' WHERE nome ILIKE '%Vale do Monjolo%';