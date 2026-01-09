-- Desativar Natália como signatária (manter apenas Jeferson como único representante legal)
UPDATE signatarios_exa 
SET is_active = false, 
    is_default = false,
    updated_at = NOW()
WHERE cpf = '116.228.359-99';

-- Garantir que Jeferson seja o único signatário padrão ativo
UPDATE signatarios_exa 
SET is_default = true,
    is_active = true,
    updated_at = NOW()
WHERE cpf = '055.031.279-00';