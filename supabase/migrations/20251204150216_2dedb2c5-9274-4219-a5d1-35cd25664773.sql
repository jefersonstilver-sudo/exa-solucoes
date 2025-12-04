-- Atualizar função generate_contract_number para usar prefixo CTR (Contrato) ao invés de EXA
-- Isso evita confusão com as propostas que também usam EXA

CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
  contract_number TEXT;
BEGIN
  year_str := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Buscar próximo número sequencial para contratos com prefixo CTR
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_contrato, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.contratos_legais
  WHERE numero_contrato LIKE 'CTR-' || year_str || '-%';
  
  -- Se não encontrar com CTR, verificar também EXA para manter sequência contínua
  IF seq_num = 1 THEN
    SELECT COALESCE(MAX(
      CAST(SPLIT_PART(numero_contrato, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO seq_num
    FROM public.contratos_legais
    WHERE numero_contrato LIKE 'EXA-' || year_str || '-%';
  END IF;
  
  -- Formato: CTR-2025-0001
  contract_number := 'CTR-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN contract_number;
END;
$$;