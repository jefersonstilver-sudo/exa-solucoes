-- =============================================
-- MÓDULO CONTATOS & INTELIGÊNCIA COMERCIAL
-- =============================================

-- Tabela principal de contatos
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identidade
  nome TEXT NOT NULL,
  sobrenome TEXT,
  empresa TEXT,
  telefone TEXT NOT NULL,
  email TEXT,
  website TEXT,
  cnpj TEXT,
  
  -- Localização
  endereco TEXT,
  bairro TEXT,
  cidade TEXT DEFAULT 'Foz do Iguaçu',
  estado TEXT DEFAULT 'PR',
  cep TEXT,
  
  -- Categoria (OBRIGATÓRIA)
  categoria TEXT NOT NULL CHECK (categoria IN (
    'lead', 'anunciante', 'sindico_exa', 'sindico_lead',
    'parceiro_exa', 'parceiro_lead', 'prestador_elevador',
    'eletricista', 'provedor', 'equipe_exa', 'outros'
  )),
  
  -- Classificação Comercial
  temperatura TEXT CHECK (temperatura IN ('quente', 'morno', 'frio')),
  
  -- Pontuação (automática)
  pontuacao_atual INTEGER DEFAULT 0,
  pontuacao_calculada_em TIMESTAMPTZ,
  
  -- Inteligência Comercial
  onde_anuncia_hoje JSONB DEFAULT '[]',
  publico_alvo TEXT,
  dores_identificadas TEXT,
  observacoes_estrategicas TEXT,
  tomador_decisao TEXT,
  cargo_tomador TEXT,
  tipo_negocio TEXT,
  
  -- Controle
  bloqueado BOOLEAN DEFAULT true,
  motivo_bloqueio TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado', 'duplicado')),
  
  -- Responsável
  responsavel_id UUID REFERENCES auth.users(id),
  
  -- Metadados
  origem TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  last_contact_at TIMESTAMPTZ,
  last_action TEXT
);

-- Tabela de regras de pontuação
CREATE TABLE public.contact_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campo TEXT NOT NULL,
  label TEXT NOT NULL,
  pontos INTEGER NOT NULL DEFAULT 0,
  categoria TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de configuração de pontuação por categoria
CREATE TABLE public.contact_scoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL UNIQUE,
  pontuacao_minima INTEGER NOT NULL DEFAULT 50,
  pontuacao_ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de histórico de interações
CREATE TABLE public.contact_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'whatsapp_enviado', 'whatsapp_recebido', 
    'ligacao_realizada', 'ligacao_recebida',
    'email_enviado', 'email_recebido',
    'reuniao', 'visita', 'proposta_enviada',
    'anotacao', 'status_alterado'
  )),
  descricao TEXT,
  metadata JSONB DEFAULT '{}',
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_contacts_categoria ON public.contacts(categoria);
CREATE INDEX idx_contacts_telefone ON public.contacts(telefone);
CREATE INDEX idx_contacts_status ON public.contacts(status);
CREATE INDEX idx_contacts_bloqueado ON public.contacts(bloqueado);
CREATE INDEX idx_contacts_responsavel ON public.contacts(responsavel_id);
CREATE INDEX idx_contact_interactions_contact ON public.contact_interactions(contact_id);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_scoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para contacts
CREATE POLICY "Usuários autenticados podem ver contatos"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar contatos"
  ON public.contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar contatos"
  ON public.contacts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar contatos"
  ON public.contacts FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies para contact_scoring_rules
CREATE POLICY "Usuários autenticados podem ver regras"
  ON public.contact_scoring_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem gerenciar regras"
  ON public.contact_scoring_rules FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies para contact_scoring_config
CREATE POLICY "Usuários autenticados podem ver config"
  ON public.contact_scoring_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem gerenciar config"
  ON public.contact_scoring_config FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies para contact_interactions
CREATE POLICY "Usuários autenticados podem ver interações"
  ON public.contact_interactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar interações"
  ON public.contact_interactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Seed data para regras de pontuação
INSERT INTO public.contact_scoring_rules (campo, label, pontos, ordem, ativo) VALUES
  ('telefone', 'Telefone válido', 25, 1, true),
  ('email', 'Email corporativo', 15, 2, true),
  ('cnpj', 'CNPJ válido', 20, 3, true),
  ('endereco', 'Endereço completo', 10, 4, true),
  ('tomador_decisao', 'Tomador de decisão identificado', 30, 5, true),
  ('empresa', 'Nome da empresa', 10, 6, true),
  ('bairro', 'Bairro/localização', 5, 7, true),
  ('publico_alvo', 'Público-alvo definido', 10, 8, true),
  ('dores_identificadas', 'Dores identificadas', 15, 9, true);

-- Seed data para config de pontuação (apenas 3 categorias)
INSERT INTO public.contact_scoring_config (categoria, pontuacao_minima, pontuacao_ativa) VALUES
  ('lead', 50, true),
  ('sindico_lead', 40, true),
  ('anunciante', 30, true);

-- Trigger para calcular pontuação automaticamente
CREATE OR REPLACE FUNCTION calculate_contact_score()
RETURNS TRIGGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_min_score INTEGER;
  v_has_scoring BOOLEAN;
BEGIN
  -- Verificar se categoria tem pontuação
  SELECT pontuacao_ativa, pontuacao_minima INTO v_has_scoring, v_min_score
  FROM public.contact_scoring_config 
  WHERE categoria = NEW.categoria;

  IF NOT FOUND OR NOT v_has_scoring THEN
    NEW.pontuacao_atual := NULL;
    NEW.bloqueado := false;
    NEW.motivo_bloqueio := NULL;
    RETURN NEW;
  END IF;

  -- Calcular pontuação baseado nas regras
  IF NEW.telefone IS NOT NULL AND NEW.telefone != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'telefone' AND ativo = true), 0);
  END IF;
  
  IF NEW.email IS NOT NULL AND NEW.email LIKE '%@%.%' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'email' AND ativo = true), 0);
  END IF;
  
  IF NEW.cnpj IS NOT NULL AND length(regexp_replace(NEW.cnpj, '[^0-9]', '', 'g')) >= 11 THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'cnpj' AND ativo = true), 0);
  END IF;
  
  IF NEW.endereco IS NOT NULL AND NEW.endereco != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'endereco' AND ativo = true), 0);
  END IF;
  
  IF NEW.tomador_decisao IS NOT NULL AND NEW.tomador_decisao != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'tomador_decisao' AND ativo = true), 0);
  END IF;
  
  IF NEW.empresa IS NOT NULL AND NEW.empresa != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'empresa' AND ativo = true), 0);
  END IF;
  
  IF NEW.bairro IS NOT NULL AND NEW.bairro != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'bairro' AND ativo = true), 0);
  END IF;
  
  IF NEW.publico_alvo IS NOT NULL AND NEW.publico_alvo != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'publico_alvo' AND ativo = true), 0);
  END IF;
  
  IF NEW.dores_identificadas IS NOT NULL AND NEW.dores_identificadas != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'dores_identificadas' AND ativo = true), 0);
  END IF;

  -- Atualizar pontuação
  NEW.pontuacao_atual := v_score;
  NEW.pontuacao_calculada_em := now();

  -- Verificar bloqueio
  IF v_score < v_min_score THEN
    NEW.bloqueado := true;
    NEW.motivo_bloqueio := 'Pontuação insuficiente: ' || v_score || '/' || v_min_score;
  ELSE
    NEW.bloqueado := false;
    NEW.motivo_bloqueio := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_contact_score
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_contact_score();

-- Trigger para updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();