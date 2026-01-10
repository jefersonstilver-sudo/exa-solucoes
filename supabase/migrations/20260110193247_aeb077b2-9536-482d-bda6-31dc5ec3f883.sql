-- ============================================================
-- FASE 4: CRIAÇÃO COMPLETA DE ENUMS, TABELAS E FUNÇÕES
-- ============================================================

-- 1. ENUMS
CREATE TYPE public.log_financeiro_evento AS ENUM (
  'pagamento_recebido',
  'pagamento_estornado',
  'baixa_manual',
  'cobranca_criada',
  'cobranca_cancelada',
  'despesa_registrada',
  'despesa_paga',
  'contrato_ativado',
  'contrato_encerrado',
  'aporte_registrado',
  'caixa_ajuste',
  'reconciliacao_automatica',
  'reconciliacao_manual',
  'inadimplencia_detectada',
  'alerta_gerado'
);

CREATE TYPE public.log_financeiro_origem AS ENUM (
  'asaas_webhook',
  'sistema',
  'admin',
  'cron',
  'reconciliacao'
);

CREATE TYPE public.alerta_financeiro_tipo AS ENUM (
  'inadimplencia',
  'vencimento_proximo',
  'caixa_minimo',
  'contrato_vencendo',
  'despesa_vencendo',
  'meta_receita',
  'reconciliacao_pendente',
  'divergencia_valor'
);

CREATE TYPE public.alerta_nivel AS ENUM (
  'info',
  'warning',
  'critical'
);

-- 2. FUNÇÃO TRIGGER
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. TABELA LOG_FINANCEIRO (IMUTÁVEL)
CREATE TABLE public.log_financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_tipo public.log_financeiro_evento NOT NULL,
  origem public.log_financeiro_origem NOT NULL,
  entidade_tipo TEXT NOT NULL,
  entidade_id UUID,
  valor_antes NUMERIC(15,2),
  valor_depois NUMERIC(15,2),
  dados_antes JSONB,
  dados_depois JSONB,
  descricao TEXT NOT NULL,
  referencia_externa TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nome TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_log_financeiro_evento ON public.log_financeiro(evento_tipo);
CREATE INDEX idx_log_financeiro_origem ON public.log_financeiro(origem);
CREATE INDEX idx_log_financeiro_entidade ON public.log_financeiro(entidade_tipo, entidade_id);
CREATE INDEX idx_log_financeiro_created ON public.log_financeiro(created_at DESC);
CREATE INDEX idx_log_financeiro_referencia ON public.log_financeiro(referencia_externa);

ALTER TABLE public.log_financeiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "log_financeiro_select_admin" ON public.log_financeiro
  FOR SELECT TO authenticated
  USING (public.has_any_admin_role(auth.uid()));

-- 4. TABELA ALERTAS_FINANCEIROS
CREATE TABLE public.alertas_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.alerta_financeiro_tipo NOT NULL,
  nivel public.alerta_nivel NOT NULL DEFAULT 'warning',
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  entidade_tipo TEXT,
  entidade_id UUID,
  valor_referencia NUMERIC(15,2),
  data_referencia DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  resolvido BOOLEAN NOT NULL DEFAULT false,
  resolvido_por UUID REFERENCES auth.users(id),
  resolvido_em TIMESTAMPTZ,
  resolucao_nota TEXT,
  notificacao_whatsapp BOOLEAN NOT NULL DEFAULT false,
  notificado_em TIMESTAMPTZ,
  notificacao_erro TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alertas_tipo ON public.alertas_financeiros(tipo);
CREATE INDEX idx_alertas_nivel ON public.alertas_financeiros(nivel);
CREATE INDEX idx_alertas_ativo ON public.alertas_financeiros(ativo) WHERE ativo = true;
CREATE INDEX idx_alertas_created ON public.alertas_financeiros(created_at DESC);

ALTER TABLE public.alertas_financeiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alertas_select_admin" ON public.alertas_financeiros
  FOR SELECT TO authenticated
  USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "alertas_update_admin" ON public.alertas_financeiros
  FOR UPDATE TO authenticated
  USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "alertas_insert_admin" ON public.alertas_financeiros
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE TRIGGER set_alertas_financeiros_updated_at
  BEFORE UPDATE ON public.alertas_financeiros
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- 5. CONFIGURAÇÕES ADICIONAIS
INSERT INTO public.configuracoes_financeiro (chave, valor, descricao)
VALUES 
  ('caixa_minimo_alerta', '5000.00', 'Valor mínimo de caixa antes de gerar alerta'),
  ('alertas_whatsapp_ativos', 'true', 'Se alertas críticos devem ser enviados via WhatsApp'),
  ('dias_contrato_vencendo', '30', 'Dias antes do vencimento para alertar sobre contratos'),
  ('dias_despesa_vencendo', '5', 'Dias antes do vencimento para alertar sobre despesas'),
  ('alertas_email_ativos', 'true', 'Se alertas devem ser enviados por email')
ON CONFLICT (chave) DO NOTHING;

-- 6. FUNÇÃO REGISTRAR LOG FINANCEIRO
CREATE OR REPLACE FUNCTION public.registrar_log_financeiro(
  p_evento_tipo public.log_financeiro_evento,
  p_origem public.log_financeiro_origem,
  p_entidade_tipo TEXT,
  p_entidade_id UUID,
  p_descricao TEXT,
  p_valor_antes NUMERIC DEFAULT NULL,
  p_valor_depois NUMERIC DEFAULT NULL,
  p_dados_antes JSONB DEFAULT NULL,
  p_dados_depois JSONB DEFAULT NULL,
  p_referencia_externa TEXT DEFAULT NULL,
  p_usuario_id UUID DEFAULT NULL,
  p_usuario_nome TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.log_financeiro (
    evento_tipo, origem, entidade_tipo, entidade_id, descricao,
    valor_antes, valor_depois, dados_antes, dados_depois,
    referencia_externa, usuario_id, usuario_nome, metadata
  ) VALUES (
    p_evento_tipo, p_origem, p_entidade_tipo, p_entidade_id, p_descricao,
    p_valor_antes, p_valor_depois, p_dados_antes, p_dados_depois,
    p_referencia_externa, p_usuario_id, p_usuario_nome, p_metadata
  )
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$;

-- 7. FUNÇÃO CRIAR ALERTA FINANCEIRO
CREATE OR REPLACE FUNCTION public.criar_alerta_financeiro(
  p_tipo public.alerta_financeiro_tipo,
  p_nivel public.alerta_nivel,
  p_titulo TEXT,
  p_mensagem TEXT,
  p_entidade_tipo TEXT DEFAULT NULL,
  p_entidade_id UUID DEFAULT NULL,
  p_valor_referencia NUMERIC DEFAULT NULL,
  p_data_referencia DATE DEFAULT NULL,
  p_notificar_whatsapp BOOLEAN DEFAULT false,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alerta_id UUID;
  v_existe BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.alertas_financeiros
    WHERE tipo = p_tipo
      AND COALESCE(entidade_tipo, '') = COALESCE(p_entidade_tipo, '')
      AND entidade_id IS NOT DISTINCT FROM p_entidade_id
      AND ativo = true AND resolvido = false
  ) INTO v_existe;
  
  IF v_existe THEN
    UPDATE public.alertas_financeiros
    SET updated_at = NOW(), metadata = p_metadata
    WHERE tipo = p_tipo
      AND COALESCE(entidade_tipo, '') = COALESCE(p_entidade_tipo, '')
      AND entidade_id IS NOT DISTINCT FROM p_entidade_id
      AND ativo = true AND resolvido = false
    RETURNING id INTO v_alerta_id;
    RETURN v_alerta_id;
  END IF;
  
  INSERT INTO public.alertas_financeiros (
    tipo, nivel, titulo, mensagem, entidade_tipo, entidade_id,
    valor_referencia, data_referencia, notificacao_whatsapp, metadata
  ) VALUES (
    p_tipo, p_nivel, p_titulo, p_mensagem, p_entidade_tipo, p_entidade_id,
    p_valor_referencia, p_data_referencia, p_notificar_whatsapp, p_metadata
  )
  RETURNING id INTO v_alerta_id;
  
  RETURN v_alerta_id;
END;
$$;

-- 8. FUNÇÃO RESOLVER ALERTA
CREATE OR REPLACE FUNCTION public.resolver_alerta_financeiro(
  p_alerta_id UUID,
  p_usuario_id UUID,
  p_nota TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.alertas_financeiros
  SET resolvido = true,
      resolvido_por = p_usuario_id,
      resolvido_em = NOW(),
      resolucao_nota = p_nota,
      ativo = false,
      updated_at = NOW()
  WHERE id = p_alerta_id AND resolvido = false;
  
  RETURN FOUND;
END;
$$;