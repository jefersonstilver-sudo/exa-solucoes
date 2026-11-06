ALTER TABLE public.cupons ALTER COLUMN desconto_percentual TYPE numeric(12,2) USING desconto_percentual::numeric(12,2);
ALTER TABLE public.cupons
  ADD COLUMN IF NOT EXISTS tipo_produto text NOT NULL DEFAULT 'ambos',
  ADD COLUMN IF NOT EXISTS modo_predios text NOT NULL DEFAULT 'todos',
  ADD COLUMN IF NOT EXISTS predios_fora_da_lista text NOT NULL DEFAULT 'recusar';

CREATE OR REPLACE FUNCTION public.cupons_validar_config()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.codigo := upper(trim(NEW.codigo));
  IF NEW.tipo_produto NOT IN ('ambos','horizontal','vertical_premium') THEN RAISE EXCEPTION 'Tipo de produto inválido'; END IF;
  IF NEW.modo_predios NOT IN ('todos','especificos','quantidade','combinado') THEN RAISE EXCEPTION 'Modo de prédios inválido'; END IF;
  IF NEW.predios_fora_da_lista NOT IN ('recusar','desconto_parcial') THEN RAISE EXCEPTION 'Regra de prédios fora da lista inválida'; END IF;
  IF NEW.tipo_desconto NOT IN ('percentual','valor_fixo','preco_final','mensal_fixo') THEN RAISE EXCEPTION 'Tipo de desconto inválido'; END IF;
  IF NEW.desconto_percentual IS NULL OR NEW.desconto_percentual < 0 THEN RAISE EXCEPTION 'Valor do desconto inválido'; END IF;
  IF NEW.tipo_desconto = 'percentual' AND NEW.desconto_percentual > 100 THEN RAISE EXCEPTION 'Percentual não pode passar de 100'; END IF;
  IF NEW.max_usos IS NULL OR NEW.max_usos < 1 THEN RAISE EXCEPTION 'Máximo de usos deve ser ao menos 1'; END IF;
  IF NEW.uso_por_usuario IS NOT NULL AND NEW.uso_por_usuario < 1 THEN RAISE EXCEPTION 'Uso por cliente deve ser ao menos 1'; END IF;
  IF NEW.min_predios IS NOT NULL AND NEW.min_predios < 1 THEN RAISE EXCEPTION 'Mínimo de prédios deve ser ao menos 1'; END IF;
  IF NEW.min_predios IS NOT NULL AND NEW.max_predios IS NOT NULL AND NEW.max_predios < NEW.min_predios THEN RAISE EXCEPTION 'Máximo de prédios menor que o mínimo'; END IF;
  IF NEW.modo_predios IN ('quantidade','combinado') AND NEW.max_predios IS NULL THEN RAISE EXCEPTION 'Informe a quantidade máxima de prédios'; END IF;
  IF NEW.data_inicio IS NOT NULL AND NEW.expira_em IS NOT NULL AND NEW.expira_em <= NEW.data_inicio THEN RAISE EXCEPTION 'Expiração deve ser depois do início'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_cupons_validar_config ON public.cupons;
CREATE TRIGGER trg_cupons_validar_config BEFORE INSERT OR UPDATE ON public.cupons FOR EACH ROW EXECUTE FUNCTION public.cupons_validar_config();

CREATE TABLE IF NOT EXISTS public.cupom_predios (
  cupom_id uuid NOT NULL REFERENCES public.cupons(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cupom_id, building_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cupom_predios TO authenticated;
GRANT ALL ON public.cupom_predios TO service_role;
ALTER TABLE public.cupom_predios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam predios do cupom" ON public.cupom_predios FOR ALL TO authenticated
USING (public.is_super_admin_user() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','super_admin')))
WITH CHECK (public.is_super_admin_user() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','super_admin')));

-- Avaliação única (sem efeitos colaterais)
CREATE OR REPLACE FUNCTION public.cupom_avaliar(
  p_codigo text, p_user uuid, p_valor numeric, p_meses integer,
  p_building_ids uuid[], p_tipo_produto text, p_pedido_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.cupons%ROWTYPE;
  v_lista uuid[];
  v_pedidos uuid[] := COALESCE(p_building_ids, ARRAY[]::uuid[]);
  v_eleg uuid[];
  v_fora int;
  v_qtd int;
  v_usos int;
  v_user_usos int;
  v_tipo text := COALESCE(NULLIF(p_tipo_produto,''),'horizontal');
BEGIN
  SELECT * INTO c FROM public.cupons WHERE codigo = upper(trim(p_codigo));
  IF c.id IS NULL THEN RETURN jsonb_build_object('valid',false,'error','Cupom não encontrado'); END IF;
  IF NOT c.ativo THEN RETURN jsonb_build_object('valid',false,'error','Cupom inativo'); END IF;
  IF c.data_inicio IS NOT NULL AND c.data_inicio > now() THEN RETURN jsonb_build_object('valid',false,'error','Cupom ainda não está disponível'); END IF;
  IF c.expira_em IS NOT NULL AND c.expira_em < now() THEN RETURN jsonb_build_object('valid',false,'error','Cupom expirado'); END IF;
  IF v_tipo = 'vertical' THEN v_tipo := 'vertical_premium'; END IF;
  IF c.tipo_produto <> 'ambos' AND c.tipo_produto <> v_tipo THEN
    RETURN jsonb_build_object('valid',false,'error', CASE WHEN c.tipo_produto='vertical_premium' THEN 'Este cupom vale só para Vertical Premium' ELSE 'Este cupom vale só para Horizontal' END);
  END IF;
  IF c.min_meses IS NOT NULL AND p_meses IS NOT NULL AND p_meses < c.min_meses THEN
    RETURN jsonb_build_object('valid',false,'error',format('Este cupom exige plano de pelo menos %s meses', c.min_meses));
  END IF;
  IF c.valor_minimo_pedido IS NOT NULL AND c.valor_minimo_pedido > 0 AND COALESCE(p_valor,0) < c.valor_minimo_pedido THEN
    RETURN jsonb_build_object('valid',false,'error',format('Valor mínimo do pedido: R$ %s', to_char(c.valor_minimo_pedido,'FM999G990D00')));
  END IF;

  v_eleg := v_pedidos;
  IF c.modo_predios IN ('especificos','combinado') THEN
    SELECT array_agg(building_id) INTO v_lista FROM public.cupom_predios WHERE cupom_id = c.id;
    v_lista := COALESCE(v_lista, ARRAY[]::uuid[]);
    IF cardinality(v_pedidos) = 0 THEN RETURN jsonb_build_object('valid',false,'error','Escolha os prédios antes de aplicar este cupom'); END IF;
    SELECT array_agg(b) INTO v_eleg FROM unnest(v_pedidos) b WHERE b = ANY(v_lista);
    v_eleg := COALESCE(v_eleg, ARRAY[]::uuid[]);
    v_fora := cardinality(v_pedidos) - cardinality(v_eleg);
    IF cardinality(v_eleg) = 0 THEN RETURN jsonb_build_object('valid',false,'error','Nenhum dos prédios escolhidos participa deste cupom'); END IF;
    IF v_fora > 0 AND c.predios_fora_da_lista = 'recusar' THEN
      RETURN jsonb_build_object('valid',false,'error','Este cupom vale só para prédios específicos; remova os prédios que não participam');
    END IF;
  END IF;
  v_qtd := cardinality(v_eleg);
  IF c.min_predios IS NOT NULL AND v_qtd < c.min_predios THEN RETURN jsonb_build_object('valid',false,'error',format('Mínimo de %s prédios para este cupom', c.min_predios)); END IF;
  IF c.max_predios IS NOT NULL AND v_qtd > c.max_predios THEN RETURN jsonb_build_object('valid',false,'error',format('Máximo de %s prédios para este cupom', c.max_predios)); END IF;

  SELECT count(*) INTO v_usos FROM public.pedidos WHERE cupom_id = c.id AND status NOT IN ('cancelado','cancelado_automaticamente') AND (p_pedido_id IS NULL OR id <> p_pedido_id);
  IF v_usos >= c.max_usos THEN RETURN jsonb_build_object('valid',false,'error','Cupom atingiu o limite de usos'); END IF;
  IF c.uso_por_usuario IS NOT NULL AND p_user IS NOT NULL THEN
    SELECT count(*) INTO v_user_usos FROM public.pedidos WHERE cupom_id = c.id AND client_id = p_user AND status NOT IN ('cancelado','cancelado_automaticamente') AND (p_pedido_id IS NULL OR id <> p_pedido_id);
    IF v_user_usos >= c.uso_por_usuario THEN RETURN jsonb_build_object('valid',false,'error','Você já atingiu o limite de uso deste cupom'); END IF;
  END IF;

  RETURN jsonb_build_object('valid',true,'id',c.id,'codigo',c.codigo,'categoria',c.categoria,
    'desconto_percentual',c.desconto_percentual,'tipo_desconto',c.tipo_desconto,
    'min_meses',c.min_meses,'valor_minimo_pedido',c.valor_minimo_pedido,'min_predios',c.min_predios,'max_predios',c.max_predios,
    'descricao',c.descricao,'tipo_produto',c.tipo_produto,'modo_predios',c.modo_predios,
    'desconto_parcial', (c.modo_predios IN ('especificos','combinado') AND c.predios_fora_da_lista='desconto_parcial' AND cardinality(v_eleg) < cardinality(v_pedidos)),
    'predios_elegiveis', to_jsonb(v_eleg),
    'preco_final', CASE WHEN c.tipo_desconto='preco_final' THEN c.desconto_percentual END);
END $$;
REVOKE ALL ON FUNCTION public.cupom_avaliar(text,uuid,numeric,integer,uuid[],text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cupom_avaliar(text,uuid,numeric,integer,uuid[],text,uuid) TO service_role;

-- Entrada para o cliente (com limite de tentativas, sem gastar uso)
CREATE OR REPLACE FUNCTION public.validar_cupom(
  p_codigo text, p_valor_pedido numeric DEFAULT 0, p_meses integer DEFAULT NULL,
  p_building_ids uuid[] DEFAULT NULL, p_tipo_produto text DEFAULT 'horizontal')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_attempts int; r jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('valid',false,'error','Entre na sua conta para aplicar o cupom'); END IF;
  SELECT count(*) INTO v_attempts FROM public.log_eventos_sistema
   WHERE tipo_evento='COUPON_VALIDATION_ATTEMPT' AND descricao LIKE '%user_id: '||v_user::text||'%' AND created_at > now() - interval '1 hour';
  IF v_attempts >= 20 THEN RETURN jsonb_build_object('valid',false,'error','Muitas tentativas. Tente novamente mais tarde.'); END IF;
  INSERT INTO public.log_eventos_sistema(tipo_evento, descricao)
   VALUES ('COUPON_VALIDATION_ATTEMPT', format('Coupon validation attempt for code: %s, user_id: %s', p_codigo, v_user));
  r := public.cupom_avaliar(p_codigo, v_user, p_valor_pedido, p_meses, p_building_ids, p_tipo_produto, NULL);
  IF (r->>'valid')::boolean THEN
    INSERT INTO public.cupom_aplicacoes(cupom_id, user_id, valor_pedido_estimado, quantidade_predios, aplicado_em)
    VALUES ((r->>'id')::uuid, v_user, p_valor_pedido, COALESCE(cardinality(p_building_ids),0), now());
  END IF;
  RETURN r;
END $$;
GRANT EXECUTE ON FUNCTION public.validar_cupom(text,numeric,integer,uuid[],text) TO authenticated;

-- Compatibilidade: versões antigas passam pela regra única e não gastam uso
CREATE OR REPLACE FUNCTION public.validate_coupon_secure(p_codigo text, p_valor_pedido numeric DEFAULT 0)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.validar_cupom(p_codigo, p_valor_pedido, NULL, NULL, 'horizontal');
$$;
CREATE OR REPLACE FUNCTION public.validate_coupon_secure(p_codigo text, p_valor_pedido numeric DEFAULT 0, p_quantidade_predios integer DEFAULT 0)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.validar_cupom(p_codigo, p_valor_pedido, NULL, NULL, 'horizontal');
$$;

CREATE OR REPLACE FUNCTION public.apply_coupon_secure(p_codigo text, p_pedido_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); p public.pedidos%ROWTYPE; r jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success',false,'error','Entre na sua conta'); END IF;
  SELECT * INTO p FROM public.pedidos WHERE id = p_pedido_id AND client_id = v_user;
  IF p.id IS NULL THEN RETURN jsonb_build_object('success',false,'error','Pedido não encontrado'); END IF;
  r := public.cupom_avaliar(p_codigo, v_user, p.valor_total, p.plano_meses, p.lista_predios::uuid[], p.tipo_produto, p.id);
  IF NOT (r->>'valid')::boolean THEN RETURN jsonb_build_object('success',false,'error',r->>'error'); END IF;
  UPDATE public.pedidos SET cupom_id = (r->>'id')::uuid WHERE id = p_pedido_id;
  RETURN jsonb_build_object('success',true,'discount_percent',(r->>'desconto_percentual')::numeric,'coupon_id',r->>'id');
END $$;

-- Contagem de uso única, baseada em pedidos reais
DROP TRIGGER IF EXISTS increment_cupom_uso_trigger ON public.cupom_usos;
DROP TRIGGER IF EXISTS trigger_decrement_coupon_on_cancel ON public.pedidos;

DELETE FROM public.cupom_usos a USING public.cupom_usos b
 WHERE a.pedido_id IS NOT NULL AND a.cupom_id = b.cupom_id AND a.pedido_id = b.pedido_id AND a.ctid > b.ctid;
CREATE UNIQUE INDEX IF NOT EXISTS cupom_usos_cupom_pedido_uniq ON public.cupom_usos(cupom_id, pedido_id);

CREATE OR REPLACE FUNCTION public.cupom_recontar(p_cupom uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.cupons SET usos_atuais = (
    SELECT count(*) FROM public.pedidos WHERE cupom_id = p_cupom AND status NOT IN ('cancelado','cancelado_automaticamente'))
  WHERE id = p_cupom;
$$;
REVOKE ALL ON FUNCTION public.cupom_recontar(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.pedidos_cupom_antes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.cupons%ROWTYPE; v_usos int;
BEGIN
  IF NEW.cupom_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.cupom_id IS DISTINCT FROM OLD.cupom_id)
     AND COALESCE(NEW.status,'') NOT IN ('cancelado','cancelado_automaticamente') THEN
    SELECT * INTO c FROM public.cupons WHERE id = NEW.cupom_id FOR UPDATE;
    IF c.id IS NOT NULL THEN
      SELECT count(*) INTO v_usos FROM public.pedidos WHERE cupom_id = c.id AND status NOT IN ('cancelado','cancelado_automaticamente') AND id <> NEW.id;
      IF v_usos >= c.max_usos THEN RAISE EXCEPTION 'Cupom % atingiu o limite de usos', c.codigo; END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.pedidos_cupom_depois()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.cupom_id IS NOT NULL THEN
    PERFORM public.cupom_recontar(NEW.cupom_id);
    IF COALESCE(NEW.status,'') NOT IN ('cancelado','cancelado_automaticamente') THEN
      INSERT INTO public.cupom_usos(cupom_id, user_id, pedido_id) VALUES (NEW.cupom_id, NEW.client_id, NEW.id)
      ON CONFLICT (cupom_id, pedido_id) DO NOTHING;
    END IF;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.cupom_id IS NOT NULL AND OLD.cupom_id IS DISTINCT FROM NEW.cupom_id THEN
    PERFORM public.cupom_recontar(OLD.cupom_id);
  END IF;
  IF TG_OP = 'DELETE' AND OLD.cupom_id IS NOT NULL THEN
    PERFORM public.cupom_recontar(OLD.cupom_id);
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_pedidos_cupom_antes ON public.pedidos;
CREATE TRIGGER trg_pedidos_cupom_antes BEFORE INSERT OR UPDATE OF cupom_id ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.pedidos_cupom_antes();
DROP TRIGGER IF EXISTS trg_pedidos_cupom_depois ON public.pedidos;
CREATE TRIGGER trg_pedidos_cupom_depois AFTER INSERT OR UPDATE OF cupom_id, status OR DELETE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.pedidos_cupom_depois();

-- Recontagem a partir dos pedidos reais
UPDATE public.cupons c SET usos_atuais = (
  SELECT count(*) FROM public.pedidos p WHERE p.cupom_id = c.id AND p.status NOT IN ('cancelado','cancelado_automaticamente'));