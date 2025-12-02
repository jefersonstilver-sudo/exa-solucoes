-- =============================================
-- SISTEMA DE ASSINATURAS COM FIDELIDADE
-- =============================================

-- 1. Adicionar novas colunas na tabela pedidos
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS tipo_pagamento TEXT DEFAULT 'pix_avista',
ADD COLUMN IF NOT EXISTS is_fidelidade BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dia_vencimento INTEGER,
ADD COLUMN IF NOT EXISTS parcela_atual INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_parcelas INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS status_adimplencia TEXT DEFAULT 'em_dia',
ADD COLUMN IF NOT EXISTS dias_atraso INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_suspensao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contrato_status TEXT DEFAULT 'nao_aplicavel',
ADD COLUMN IF NOT EXISTS contrato_enviado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contrato_assinado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS proxima_cobranca DATE,
ADD COLUMN IF NOT EXISTS ultima_notificacao_cobranca TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS desconto_pix_avista NUMERIC(10,2) DEFAULT 0;

-- 2. Criar tabela de parcelas
CREATE TABLE IF NOT EXISTS public.parcelas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  valor_original NUMERIC(10,2) NOT NULL,
  valor_desconto NUMERIC(10,2) DEFAULT 0,
  valor_multa NUMERIC(10,2) DEFAULT 0,
  valor_juros NUMERIC(10,2) DEFAULT 0,
  valor_final NUMERIC(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pendente',
  metodo_pagamento TEXT,
  mercadopago_payment_id TEXT,
  mercadopago_external_reference TEXT,
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  boleto_url TEXT,
  boleto_barcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para parcelas
CREATE INDEX IF NOT EXISTS idx_parcelas_pedido_id ON public.parcelas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_status ON public.parcelas(status);
CREATE INDEX IF NOT EXISTS idx_parcelas_data_vencimento ON public.parcelas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_mercadopago_payment_id ON public.parcelas(mercadopago_payment_id);

-- 3. Criar tabela de logs de cobrança
CREATE TABLE IF NOT EXISTS public.cobranca_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parcela_id UUID REFERENCES public.parcelas(id) ON DELETE SET NULL,
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo_notificacao TEXT NOT NULL,
  canal TEXT NOT NULL,
  destinatario TEXT,
  mensagem TEXT,
  status TEXT NOT NULL DEFAULT 'enviado',
  erro TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para cobranca_logs
CREATE INDEX IF NOT EXISTS idx_cobranca_logs_parcela_id ON public.cobranca_logs(parcela_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_logs_pedido_id ON public.cobranca_logs(pedido_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_logs_client_id ON public.cobranca_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_logs_created_at ON public.cobranca_logs(created_at);

-- 4. Criar tabela de aceites de termos de fidelidade
CREATE TABLE IF NOT EXISTS public.termos_fidelidade_aceites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  versao_termo TEXT NOT NULL DEFAULT 'v1.0',
  ip_address TEXT,
  user_agent TEXT,
  dados_empresa JSONB,
  aceito_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para termos_fidelidade_aceites
CREATE INDEX IF NOT EXISTS idx_termos_fidelidade_client_id ON public.termos_fidelidade_aceites(client_id);
CREATE INDEX IF NOT EXISTS idx_termos_fidelidade_pedido_id ON public.termos_fidelidade_aceites(pedido_id);

-- 5. Enable RLS
ALTER TABLE public.parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobranca_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termos_fidelidade_aceites ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies para parcelas
CREATE POLICY "Users can view their own parcelas"
ON public.parcelas
FOR SELECT
USING (
  pedido_id IN (
    SELECT id FROM public.pedidos WHERE client_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all parcelas"
ON public.parcelas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can insert parcelas"
ON public.parcelas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update parcelas"
ON public.parcelas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- 7. RLS Policies para cobranca_logs
CREATE POLICY "Users can view their own cobranca_logs"
ON public.cobranca_logs
FOR SELECT
USING (client_id = auth.uid());

CREATE POLICY "Admins can view all cobranca_logs"
ON public.cobranca_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- 8. RLS Policies para termos_fidelidade_aceites
CREATE POLICY "Users can view their own termos"
ON public.termos_fidelidade_aceites
FOR SELECT
USING (client_id = auth.uid());

CREATE POLICY "Users can insert their own termos"
ON public.termos_fidelidade_aceites
FOR INSERT
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Admins can view all termos"
ON public.termos_fidelidade_aceites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- 9. Trigger para atualizar updated_at em parcelas
CREATE OR REPLACE FUNCTION public.update_parcelas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_parcelas_updated_at ON public.parcelas;
CREATE TRIGGER trigger_parcelas_updated_at
BEFORE UPDATE ON public.parcelas
FOR EACH ROW
EXECUTE FUNCTION public.update_parcelas_updated_at();

-- 10. Função para calcular multa e juros (2% multa + 1% juros ao mês)
CREATE OR REPLACE FUNCTION public.calcular_multa_juros(
  p_valor_original NUMERIC,
  p_data_vencimento DATE
)
RETURNS TABLE(valor_multa NUMERIC, valor_juros NUMERIC, valor_total NUMERIC) AS $$
DECLARE
  v_dias_atraso INTEGER;
  v_multa NUMERIC;
  v_juros NUMERIC;
BEGIN
  v_dias_atraso := GREATEST(0, CURRENT_DATE - p_data_vencimento);
  
  IF v_dias_atraso > 0 THEN
    v_multa := p_valor_original * 0.02;
    v_juros := p_valor_original * 0.01 * (v_dias_atraso / 30.0);
  ELSE
    v_multa := 0;
    v_juros := 0;
  END IF;
  
  RETURN QUERY SELECT 
    ROUND(v_multa, 2),
    ROUND(v_juros, 2),
    ROUND(p_valor_original + v_multa + v_juros, 2);
END;
$$ LANGUAGE plpgsql;

-- 11. Função para verificar status de adimplência de um pedido
CREATE OR REPLACE FUNCTION public.verificar_adimplencia_pedido(p_pedido_id UUID)
RETURNS TABLE(
  status_adimplencia TEXT,
  dias_atraso INTEGER,
  parcela_atrasada_id UUID,
  valor_pendente NUMERIC
) AS $$
DECLARE
  v_parcela RECORD;
  v_dias INTEGER;
BEGIN
  SELECT p.*, (CURRENT_DATE - p.data_vencimento) as dias
  INTO v_parcela
  FROM public.parcelas p
  WHERE p.pedido_id = p_pedido_id
    AND p.status IN ('pendente', 'atrasado', 'aguardando_pagamento')
    AND p.data_vencimento < CURRENT_DATE
  ORDER BY p.data_vencimento ASC
  LIMIT 1;
  
  IF v_parcela IS NULL THEN
    RETURN QUERY SELECT 'em_dia'::TEXT, 0, NULL::UUID, 0::NUMERIC;
  ELSE
    v_dias := v_parcela.dias;
    
    IF v_dias >= 10 THEN
      RETURN QUERY SELECT 'suspenso'::TEXT, v_dias, v_parcela.id, v_parcela.valor_final;
    ELSE
      RETURN QUERY SELECT 'atrasado'::TEXT, v_dias, v_parcela.id, v_parcela.valor_final;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;