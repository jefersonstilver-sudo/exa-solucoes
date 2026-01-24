-- =====================================================
-- FASE 1: TABELA CONFIGURACOES_EMPRESA (Single Source of Truth)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.configuracoes_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados Jurídicos
  razao_social TEXT NOT NULL DEFAULT 'INDEXA MIDIA LTDA',
  nome_fantasia TEXT NOT NULL DEFAULT 'ExaMídia',
  cnpj TEXT NOT NULL DEFAULT '38.142.638/0001-30',
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  
  -- Endereço Sede
  endereco_logradouro TEXT NOT NULL DEFAULT 'Avenida Paraná',
  endereco_numero TEXT NOT NULL DEFAULT '974',
  endereco_complemento TEXT DEFAULT 'Sala 301',
  endereco_bairro TEXT NOT NULL DEFAULT 'Centro',
  endereco_cidade TEXT NOT NULL DEFAULT 'Foz do Iguaçu',
  endereco_estado TEXT NOT NULL DEFAULT 'PR',
  endereco_cep TEXT NOT NULL DEFAULT '85852-000',
  
  -- Representante Legal Único
  representante_nome TEXT NOT NULL DEFAULT 'Jeferson Stilver Rodrigues Encina',
  representante_cpf TEXT NOT NULL DEFAULT '055.031.279-00',
  representante_rg TEXT DEFAULT '8.812.269-0',
  representante_cargo TEXT NOT NULL DEFAULT 'Sócio Administrador',
  representante_email TEXT NOT NULL DEFAULT 'jefersonstilver@gmail.com',
  
  -- Contato Institucional
  telefone_principal TEXT DEFAULT '(45) 9 9141-5856',
  email_institucional TEXT DEFAULT 'contato@examidia.com.br',
  whatsapp_comercial TEXT DEFAULT '(45) 9 9141-5856',
  website TEXT DEFAULT 'https://www.examidia.com.br',
  instagram TEXT DEFAULT '@exa.publicidade',
  
  -- Foro Jurídico Padrão
  foro_comarca TEXT NOT NULL DEFAULT 'Foz do Iguaçu',
  foro_estado TEXT NOT NULL DEFAULT 'PR',
  
  -- Configurações de Contrato
  multa_rescisao_percentual NUMERIC(5,2) DEFAULT 20.00,
  prazo_aviso_rescisao_dias INTEGER DEFAULT 30,
  indice_reajuste TEXT DEFAULT 'IPCA',
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir registro único com dados oficiais
INSERT INTO public.configuracoes_empresa (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.configuracoes_empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública configuracoes_empresa" ON public.configuracoes_empresa
  FOR SELECT USING (true);

CREATE POLICY "Edição apenas super_admin configuracoes_empresa" ON public.configuracoes_empresa
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'super_admin'
    )
  );

COMMENT ON TABLE public.configuracoes_empresa IS 'Fonte única de verdade para dados institucionais da empresa (SST)';

-- =====================================================
-- FASE 2: EVOLUÇÃO DO SCHEMA BUILDINGS E CONTRATOS_LEGAIS
-- =====================================================

-- Adicionar cnpj_condominio em buildings
ALTER TABLE public.buildings 
ADD COLUMN IF NOT EXISTS cnpj_condominio TEXT;

COMMENT ON COLUMN public.buildings.cnpj_condominio IS 'CNPJ do condomínio para contratos de comodato';

-- Adicionar contrato_origem_id em contratos_legais para vínculo entre contratos
ALTER TABLE public.contratos_legais 
ADD COLUMN IF NOT EXISTS contrato_origem_id UUID REFERENCES public.contratos_legais(id);

COMMENT ON COLUMN public.contratos_legais.contrato_origem_id IS 'FK para contrato de origem (ex: Comodato vinculado ao Termo de Aceite)';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_contratos_origem ON public.contratos_legais(contrato_origem_id);

-- =====================================================
-- FASE 3: TABELA CLAUSULAS_PADRAO (Cláusulas Imutáveis)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.clausulas_padrao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  tipos_contrato TEXT[] DEFAULT ARRAY[]::TEXT[],
  ordem INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.clausulas_padrao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública clausulas_padrao" ON public.clausulas_padrao
  FOR SELECT USING (true);

CREATE POLICY "Edição apenas super_admin clausulas_padrao" ON public.clausulas_padrao
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'super_admin'
    )
  );

-- Inserir cláusulas padrão
INSERT INTO public.clausulas_padrao (codigo, titulo, conteudo, tipos_contrato, ordem) VALUES
('foro_foz', 'DO FORO', 'Elegem as partes o foro da comarca de Foz do Iguaçu/PR para dirimir quaisquer controvérsias oriundas do presente instrumento, com renúncia expressa a qualquer outro, por mais privilegiado que seja.', ARRAY['comodato', 'anunciante', 'parceria_clt', 'parceria_pj', 'permuta', 'termo_aceite'], 100),
('rescisao_padrao', 'DA RESCISÃO', 'A rescisão antecipada e imotivada por qualquer das partes implicará no pagamento de multa equivalente a 20% (vinte por cento) sobre o valor total remanescente do contrato, salvo outras condições previamente acordadas por escrito entre as partes.', ARRAY['anunciante', 'parceria_pj', 'comodato'], 90),
('lgpd', 'DA PROTEÇÃO DE DADOS', 'As partes se comprometem a observar a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), garantindo a confidencialidade e segurança das informações pessoais tratadas em razão deste contrato.', ARRAY['comodato', 'anunciante', 'parceria_clt', 'parceria_pj', 'permuta', 'termo_aceite'], 95),
('caso_fortuito', 'DO CASO FORTUITO E FORÇA MAIOR', 'Nenhuma das partes será responsabilizada por eventuais prejuízos decorrentes de caso fortuito ou força maior, assim entendidos os eventos imprevisíveis e inevitáveis, incluindo, mas não se limitando a: desastres naturais, interrupções de energia elétrica, falhas de conexão à internet, atos governamentais e pandemias.', ARRAY['comodato', 'anunciante'], 85)
ON CONFLICT (codigo) DO NOTHING;

COMMENT ON TABLE public.clausulas_padrao IS 'Cláusulas jurídicas padrão para uso em contratos';