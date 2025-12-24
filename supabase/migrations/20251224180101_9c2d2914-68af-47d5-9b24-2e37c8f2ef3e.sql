-- Tabela para cache de transações do Mercado Pago
CREATE TABLE public.mp_transactions_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mp_payment_id TEXT NOT NULL UNIQUE,
  external_reference TEXT,
  status TEXT NOT NULL,
  status_detail TEXT,
  payment_method TEXT,
  payment_type TEXT,
  transaction_amount DECIMAL(12,2) NOT NULL,
  net_received_amount DECIMAL(12,2),
  fee_amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  payer_email TEXT,
  payer_name TEXT,
  payer_identification TEXT,
  date_created TIMESTAMP WITH TIME ZONE,
  date_approved TIMESTAMP WITH TIME ZONE,
  money_release_date TIMESTAMP WITH TIME ZONE,
  pedido_id UUID REFERENCES public.pedidos(id),
  proposal_id UUID REFERENCES public.proposals(id),
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_mp_cache_external_ref ON public.mp_transactions_cache(external_reference);
CREATE INDEX idx_mp_cache_status ON public.mp_transactions_cache(status);
CREATE INDEX idx_mp_cache_date_approved ON public.mp_transactions_cache(date_approved);
CREATE INDEX idx_mp_cache_pedido_id ON public.mp_transactions_cache(pedido_id);

-- Tabela para alertas de auditoria financeira
CREATE TABLE public.financial_audit_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('critical', 'warning', 'info')),
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  pedido_id UUID REFERENCES public.pedidos(id),
  client_name TEXT,
  client_email TEXT,
  order_value DECIMAL(12,2),
  mp_value DECIMAL(12,2),
  mp_payer_name TEXT,
  details JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_audit_alerts_level ON public.financial_audit_alerts(level);
CREATE INDEX idx_audit_alerts_resolved ON public.financial_audit_alerts(resolved);
CREATE INDEX idx_audit_alerts_pedido ON public.financial_audit_alerts(pedido_id);
CREATE INDEX idx_audit_alerts_created ON public.financial_audit_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE public.mp_transactions_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_audit_alerts ENABLE ROW LEVEL SECURITY;

-- Policies para mp_transactions_cache (apenas admins)
CREATE POLICY "Admins can view MP transactions cache"
ON public.mp_transactions_cache
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "System can manage MP transactions cache"
ON public.mp_transactions_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- Policies para financial_audit_alerts (apenas admins)
CREATE POLICY "Admins can view audit alerts"
ON public.financial_audit_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can manage audit alerts"
ON public.financial_audit_alerts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "System can insert audit alerts"
ON public.financial_audit_alerts
FOR INSERT
WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_financial_tables_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mp_transactions_cache_timestamp
  BEFORE UPDATE ON public.mp_transactions_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_tables_timestamp();

CREATE TRIGGER update_financial_audit_alerts_timestamp
  BEFORE UPDATE ON public.financial_audit_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_tables_timestamp();