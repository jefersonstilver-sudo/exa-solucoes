-- Limpar registros duplicados, mantendo apenas o mais recente
DELETE FROM configuracoes_sindico 
WHERE id NOT IN (
  SELECT id FROM configuracoes_sindico 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Criar função para prevenir múltiplos registros
CREATE OR REPLACE FUNCTION prevent_multiple_config_rows()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM configuracoes_sindico) >= 1 AND TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Apenas um registro de configuração é permitido. Use UPDATE ao invés de INSERT.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para garantir apenas um registro
DROP TRIGGER IF EXISTS enforce_single_config ON configuracoes_sindico;
CREATE TRIGGER enforce_single_config
BEFORE INSERT ON configuracoes_sindico
FOR EACH ROW
EXECUTE FUNCTION prevent_multiple_config_rows();

-- Adicionar comentário explicativo
COMMENT ON TRIGGER enforce_single_config ON configuracoes_sindico IS 
'Garante que apenas um registro de configuração existe na tabela. Use UPDATE para modificar configurações existentes.';