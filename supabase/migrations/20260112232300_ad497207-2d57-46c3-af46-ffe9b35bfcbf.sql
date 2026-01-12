-- ============================================================
-- MIGRATION: Fluxo Comercial Opção B - Contract-Gate System
-- ============================================================
-- Este migration implementa o fluxo onde:
-- 1. Contrato assinado é o gate de ativação (não pagamento)
-- 2. Upload só é liberado após assinatura do contrato
-- 3. Status do pedido reflete o estágio real do fluxo comercial
-- ============================================================

-- 1. NOVOS STATUS DO PEDIDO
-- Comentário: Não podemos alterar CHECK constraints facilmente, 
-- mas os status já existem no sistema sem constraint
-- Verificar se precisamos de constraint ou se é livre

-- 2. ADICIONAR COLUNAS DE RASTREAMENTO DE CONTRATO NO PEDIDO
ALTER TABLE public.pedidos 
  ADD COLUMN IF NOT EXISTS contrato_id UUID REFERENCES public.contratos_legais(id),
  ADD COLUMN IF NOT EXISTS contrato_assinado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contrato_enviado_em TIMESTAMPTZ;

-- 3. ADICIONAR COLUNAS DE ACEITE NA PROPOSTA (auditoria jurídica)
ALTER TABLE public.proposals 
  ADD COLUMN IF NOT EXISTS contract_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_accepted_ip TEXT,
  ADD COLUMN IF NOT EXISTS contract_accepted_user_agent TEXT,
  ADD COLUMN IF NOT EXISTS contract_terms_version TEXT DEFAULT '1.0';

-- 4. CRIAR TABELA DE LOG DE ACEITE DE CONTRATO (auditoria completa)
CREATE TABLE IF NOT EXISTS public.contract_acceptance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  contrato_id UUID REFERENCES public.contratos_legais(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  browser_fingerprint TEXT,
  client_data JSONB,
  terms_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.contract_acceptance_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas admins podem ver logs de aceite
CREATE POLICY "Admins can view contract acceptance logs"
  ON public.contract_acceptance_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'admin', 'admin_marketing', 'admin_financeiro')
    )
  );

-- Policy: Sistema pode inserir logs (via service role)
CREATE POLICY "System can insert contract acceptance logs"
  ON public.contract_acceptance_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_pedidos_contrato_id 
  ON public.pedidos(contrato_id);
  
CREATE INDEX IF NOT EXISTS idx_pedidos_status_contrato 
  ON public.pedidos(status, contrato_id);
  
CREATE INDEX IF NOT EXISTS idx_contract_acceptance_logs_proposal 
  ON public.contract_acceptance_logs(proposal_id);

CREATE INDEX IF NOT EXISTS idx_proposals_contract_accepted 
  ON public.proposals(contract_accepted_at);

-- 6. COMENTÁRIOS DE DOCUMENTAÇÃO
COMMENT ON COLUMN public.pedidos.contrato_id IS 'Referência ao contrato legal vinculado ao pedido';
COMMENT ON COLUMN public.pedidos.contrato_assinado_em IS 'Data/hora em que o contrato foi assinado (atualizado via clicksign-webhook)';
COMMENT ON COLUMN public.pedidos.contrato_enviado_em IS 'Data/hora em que o contrato foi enviado para assinatura';

COMMENT ON COLUMN public.proposals.contract_accepted_at IS 'Data/hora do aceite do contrato na proposta (antes do pagamento)';
COMMENT ON COLUMN public.proposals.contract_accepted_ip IS 'IP do cliente no momento do aceite (auditoria LGPD)';
COMMENT ON COLUMN public.proposals.contract_accepted_user_agent IS 'User-agent do navegador no aceite';

COMMENT ON TABLE public.contract_acceptance_logs IS 'Log de auditoria imutável para aceites de contrato - compliance jurídico';