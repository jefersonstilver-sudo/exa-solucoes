-- FASE 1: Atualizar homepage_config para nova estrutura de marcas
UPDATE homepage_config 
SET 
  title = 'LINKAÊ',
  href = '/linkae',
  button_text = 'Estratégia Digital',
  button_icon = 'megaphone'
WHERE service_type = 'marketing';

UPDATE homepage_config 
SET 
  title = 'EXA',
  href = '/exa',
  button_text = 'Publicidade Inteligente',
  button_icon = 'zap'
WHERE service_type = 'paineis';

-- FASE 2: Reestruturar tabelas de leads
-- Renomear tabela de leads de campanhas para leads linkae
ALTER TABLE leads_campanhas RENAME TO leads_linkae;

-- Criar nova tabela para leads EXA
CREATE TABLE leads_exa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  nome_empresa text NOT NULL,
  cargo text NOT NULL,
  whatsapp text NOT NULL,
  objetivo text,
  status text NOT NULL DEFAULT 'novo_lead_exa',
  contato_realizado boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS para leads_exa
ALTER TABLE leads_exa ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para leads_exa
CREATE POLICY "Super admins can view all leads exa" 
ON leads_exa 
FOR ALL 
USING (is_super_admin());

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_leads_exa()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para updated_at
CREATE TRIGGER update_leads_exa_updated_at
  BEFORE UPDATE ON leads_exa
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_leads_exa();