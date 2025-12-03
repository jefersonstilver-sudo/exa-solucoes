-- ============================================
-- MÓDULO DE PROPOSTAS COMERCIAIS EXA MÍDIA
-- ============================================

-- 1. Tabela principal de propostas
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT UNIQUE NOT NULL, -- Ex: "EXA-2025-0001"
  
  -- Dados do cliente
  client_name TEXT NOT NULL,
  client_cnpj TEXT,
  client_phone TEXT,
  client_email TEXT,
  
  -- Prédios selecionados (JSON array com building_id, nome, telas, impressões)
  selected_buildings JSONB NOT NULL DEFAULT '[]',
  
  -- Valores calculados
  total_panels INTEGER NOT NULL DEFAULT 0,
  total_impressions_month INTEGER NOT NULL DEFAULT 0,
  fidel_monthly_value NUMERIC(10,2) NOT NULL,
  cash_total_value NUMERIC(10,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 10.00, -- Desconto à vista (default 10%)
  
  -- Período
  duration_months INTEGER DEFAULT 6,
  
  -- Status e controle
  status TEXT DEFAULT 'rascunho', -- rascunho, enviada, visualizada, aceita, recusada, expirada
  chosen_plan TEXT, -- 'avista' ou 'fidelidade'
  
  -- Token para acesso público (segurança)
  access_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Datas
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Criador (vendedor)
  created_by UUID REFERENCES auth.users(id),
  seller_name TEXT,
  seller_phone TEXT,
  seller_email TEXT,
  
  -- Rejeição
  rejection_reason TEXT,
  
  -- PDF gerado
  pdf_url TEXT,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}'
);

-- 2. Tabela de logs de ações nas propostas
CREATE TABLE public.proposal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'criada', 'enviada_whatsapp', 'enviada_email', 'visualizada', 'aceita', 'recusada', 'expirada', 'pdf_gerado'
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de destinatários de alertas de propostas (vendedores)
CREATE TABLE public.proposal_alert_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  receive_whatsapp BOOLEAN DEFAULT true,
  receive_email BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_alert_recipients ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para proposals
CREATE POLICY "Admins podem ver todas as propostas" ON public.proposals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'admin_marketing', 'admin_financeiro', 'super_admin')
    )
  );

CREATE POLICY "Admins podem criar propostas" ON public.proposals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'admin_marketing', 'admin_financeiro', 'super_admin')
    )
  );

CREATE POLICY "Admins podem atualizar propostas" ON public.proposals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'admin_marketing', 'admin_financeiro', 'super_admin')
    )
  );

CREATE POLICY "Admins podem deletar propostas" ON public.proposals
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'admin_marketing', 'admin_financeiro', 'super_admin')
    )
  );

-- 6. Políticas RLS para proposal_logs
CREATE POLICY "Admins podem ver logs de propostas" ON public.proposal_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'admin_marketing', 'admin_financeiro', 'super_admin')
    )
  );

CREATE POLICY "Admins podem criar logs de propostas" ON public.proposal_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'admin_marketing', 'admin_financeiro', 'super_admin')
    )
  );

-- 7. Políticas RLS para proposal_alert_recipients
CREATE POLICY "Admins podem gerenciar destinatários" ON public.proposal_alert_recipients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'admin_marketing', 'super_admin')
    )
  );

-- 8. Índices para performance
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposals_created_at ON public.proposals(created_at DESC);
CREATE INDEX idx_proposals_created_by ON public.proposals(created_by);
CREATE INDEX idx_proposals_access_token ON public.proposals(access_token);
CREATE INDEX idx_proposals_number ON public.proposals(number);
CREATE INDEX idx_proposal_logs_proposal_id ON public.proposal_logs(proposal_id);
CREATE INDEX idx_proposal_logs_created_at ON public.proposal_logs(created_at DESC);

-- 9. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_proposals_updated_at();

-- 10. Função para gerar número sequencial de proposta
CREATE OR REPLACE FUNCTION generate_proposal_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(number FROM 10 FOR 4) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.proposals
  WHERE number LIKE 'EXA-' || year_part || '-%';
  
  new_number := 'EXA-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 11. Política para acesso público via token (propostas públicas)
CREATE POLICY "Acesso público via token" ON public.proposals
  FOR SELECT
  USING (true); -- Controlado no frontend/edge function via access_token

-- 12. Política para logs - inserção anônima (para quando cliente acessa)
CREATE POLICY "Inserção anônima de logs" ON public.proposal_logs
  FOR INSERT
  WITH CHECK (true); -- Permite inserção sem autenticação para tracking