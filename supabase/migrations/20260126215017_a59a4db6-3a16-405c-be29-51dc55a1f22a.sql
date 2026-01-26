-- Atualiza a proposta específica para validade indeterminada (expires_at = null)
UPDATE public.proposals 
SET expires_at = NULL, 
    updated_at = NOW() 
WHERE id = '17099044-5534-4022-8283-5d9d2260a9b1';