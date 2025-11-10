-- Adicionar códigos automáticos sequenciais para prédios existentes
-- Atualizar prédios com códigos sequenciais (001, 002, 003...)
WITH numbered_buildings AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM buildings
  WHERE codigo_predio IS NULL
)
UPDATE buildings
SET codigo_predio = LPAD(numbered_buildings.row_num::TEXT, 3, '0')
FROM numbered_buildings
WHERE buildings.id = numbered_buildings.id;

-- Criar função para gerar próximo código automaticamente
CREATE OR REPLACE FUNCTION generate_building_code()
RETURNS TRIGGER AS $$
DECLARE
  next_code TEXT;
  max_code_num INTEGER;
BEGIN
  -- Se o código já foi fornecido, não fazer nada
  IF NEW.codigo_predio IS NOT NULL AND NEW.codigo_predio != '' THEN
    RETURN NEW;
  END IF;
  
  -- Buscar o maior código numérico existente
  SELECT COALESCE(MAX(CAST(codigo_predio AS INTEGER)), 0) + 1
  INTO max_code_num
  FROM buildings
  WHERE codigo_predio ~ '^\d+$'; -- Apenas códigos numéricos
  
  -- Gerar próximo código com padding de 3 dígitos
  NEW.codigo_predio := LPAD(max_code_num::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar código automaticamente em novos prédios
DROP TRIGGER IF EXISTS trigger_generate_building_code ON buildings;
CREATE TRIGGER trigger_generate_building_code
BEFORE INSERT ON buildings
FOR EACH ROW
EXECUTE FUNCTION generate_building_code();

-- Adicionar índice único no codigo_predio para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_buildings_codigo_predio_unique 
ON buildings(codigo_predio) 
WHERE codigo_predio IS NOT NULL;