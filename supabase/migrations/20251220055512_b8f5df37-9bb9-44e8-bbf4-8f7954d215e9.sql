-- Adicionar colunas de configuração da Sofia
ALTER TABLE configuracoes_adicionais 
ADD COLUMN IF NOT EXISTS sofia_2fa_gerente_master BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sofia_ativa BOOLEAN DEFAULT true;

-- Comentários explicativos
COMMENT ON COLUMN configuracoes_adicionais.sofia_2fa_gerente_master IS 'Se true, exige código 2FA via WhatsApp para ativar modo gerente master. Se false, Sofia inicia diretamente no modo gerente master.';
COMMENT ON COLUMN configuracoes_adicionais.sofia_ativa IS 'Se true, o botão da Sofia aparece no site. Se false, o ícone da Sofia fica oculto.';