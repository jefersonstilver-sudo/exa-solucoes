-- Criar função para calcular visualizações mensais
CREATE OR REPLACE FUNCTION calculate_monthly_views()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular: número de telas × 7200 exibições
  NEW.visualizacoes_mes := COALESCE(NEW.numero_elevadores, 0) * 7200;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger para atualizar automaticamente
DROP TRIGGER IF EXISTS update_visualizacoes_mes ON buildings;
CREATE TRIGGER update_visualizacoes_mes
  BEFORE INSERT OR UPDATE OF numero_elevadores
  ON buildings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_monthly_views();

-- Atualizar todos os prédios existentes com o cálculo correto
UPDATE buildings
SET visualizacoes_mes = COALESCE(numero_elevadores, 0) * 7200;

-- Adicionar comentário explicativo
COMMENT ON COLUMN buildings.visualizacoes_mes IS 'Exibições mensais calculadas automaticamente: numero_elevadores × 7200 exibições por tela';