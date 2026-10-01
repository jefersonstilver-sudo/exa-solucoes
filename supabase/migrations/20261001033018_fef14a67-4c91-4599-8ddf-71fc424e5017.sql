CREATE TABLE public.asaas_extrato_movimentos (
  id text PRIMARY KEY,
  data date NOT NULL,
  tipo text NOT NULL,
  descricao text,
  valor numeric(18,2) NOT NULL,
  saldo numeric(18,2) NOT NULL,
  payment_id text,
  transfer_id text,
  bill_payment_id text,
  external_reference text,
  correspondencia_status text NOT NULL DEFAULT 'sem_correspondencia',
  correspondencia_tipo text,
  correspondencia_id text,
  raw_data jsonb NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.asaas_extrato_movimentos TO authenticated;
GRANT ALL ON public.asaas_extrato_movimentos TO service_role;
ALTER TABLE public.asaas_extrato_movimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY asaas_extrato_admin_read ON public.asaas_extrato_movimentos FOR SELECT TO authenticated USING (public.has_any_admin_role(auth.uid()));
CREATE INDEX asaas_extrato_data_idx ON public.asaas_extrato_movimentos (data DESC, id DESC);
CREATE INDEX asaas_extrato_payment_idx ON public.asaas_extrato_movimentos (payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX asaas_extrato_transfer_idx ON public.asaas_extrato_movimentos (transfer_id) WHERE transfer_id IS NOT NULL;
CREATE TRIGGER asaas_extrato_updated BEFORE UPDATE ON public.asaas_extrato_movimentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();