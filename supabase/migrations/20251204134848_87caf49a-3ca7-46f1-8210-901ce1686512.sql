-- Tabela principal de contratos legais
CREATE TABLE public.contratos_legais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  numero_contrato TEXT UNIQUE NOT NULL,
  tipo_contrato TEXT NOT NULL CHECK (tipo_contrato IN ('anunciante', 'sindico')),
  
  -- Vínculo opcional
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  proposta_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  predio_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  
  -- Dados do Cliente/Signatário
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  cliente_telefone TEXT,
  cliente_cnpj TEXT,
  cliente_cpf TEXT,
  cliente_razao_social TEXT,
  cliente_cargo TEXT,
  cliente_endereco TEXT,
  cliente_cidade TEXT,
  cliente_segmento TEXT,
  
  -- Dados do Contrato
  objeto TEXT NOT NULL DEFAULT 'Veiculação de anúncios publicitários em vídeo nos painéis digitais da EXA MÍDIA',
  valor_mensal NUMERIC(10,2),
  valor_total NUMERIC(10,2),
  plano_meses INTEGER,
  dia_vencimento INTEGER,
  metodo_pagamento TEXT,
  lista_predios JSONB,
  parcelas JSONB,
  clausulas_especiais TEXT,
  total_paineis INTEGER,
  
  -- Datas
  data_inicio DATE,
  data_fim DATE,
  prazo_assinatura DATE,
  
  -- ClickSign Integration
  clicksign_envelope_id TEXT,
  clicksign_document_key TEXT,
  clicksign_signer_key TEXT,
  clicksign_request_signature_key TEXT,
  clicksign_download_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'rascunho' 
    CHECK (status IN ('rascunho', 'enviado', 'visualizado', 'assinado', 'recusado', 'expirado', 'cancelado')),
  
  -- Timestamps de eventos
  enviado_em TIMESTAMPTZ,
  visualizado_em TIMESTAMPTZ,
  assinado_em TIMESTAMPTZ,
  recusado_em TIMESTAMPTZ,
  expirado_em TIMESTAMPTZ,
  cancelado_em TIMESTAMPTZ,
  
  -- Audit
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs de contrato
CREATE TABLE public.contratos_legais_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES public.contratos_legais(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  detalhes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  executado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_contratos_legais_status ON public.contratos_legais(status);
CREATE INDEX idx_contratos_legais_tipo ON public.contratos_legais(tipo_contrato);
CREATE INDEX idx_contratos_legais_clicksign ON public.contratos_legais(clicksign_envelope_id);
CREATE INDEX idx_contratos_legais_pedido ON public.contratos_legais(pedido_id);
CREATE INDEX idx_contratos_legais_proposta ON public.contratos_legais(proposta_id);
CREATE INDEX idx_contratos_legais_numero ON public.contratos_legais(numero_contrato);
CREATE INDEX idx_contratos_logs_contrato ON public.contratos_legais_logs(contrato_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contratos_legais_updated_at
BEFORE UPDATE ON public.contratos_legais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.contratos_legais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_legais_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Admins can view all contracts"
ON public.contratos_legais FOR SELECT
USING (true);

CREATE POLICY "Admins can insert contracts"
ON public.contratos_legais FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update contracts"
ON public.contratos_legais FOR UPDATE
USING (true);

CREATE POLICY "Admins can delete contracts"
ON public.contratos_legais FOR DELETE
USING (true);

CREATE POLICY "Admins can view contract logs"
ON public.contratos_legais_logs FOR SELECT
USING (true);

CREATE POLICY "Admins can insert contract logs"
ON public.contratos_legais_logs FOR INSERT
WITH CHECK (true);

-- Função para gerar número de contrato sequencial
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TEXT AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
  contract_number TEXT;
BEGIN
  year_str := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_contrato, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.contratos_legais
  WHERE numero_contrato LIKE 'EXA-' || year_str || '-%';
  
  contract_number := 'EXA-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN contract_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;