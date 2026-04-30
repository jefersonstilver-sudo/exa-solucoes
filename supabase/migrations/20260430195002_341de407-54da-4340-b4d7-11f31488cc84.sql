
-- A) Novas colunas em pedidos
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS tipo_cobranca text DEFAULT 'avista',
  ADD COLUMN IF NOT EXISTS valor_mensal numeric;

-- B) Reescreve get_orders_stats_real para somar direto de pedidos (independe de parcelas)
CREATE OR REPLACE FUNCTION public.get_orders_stats_real()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_orders', (SELECT COUNT(*) FROM pedidos),
    -- Receita confirmada: soma valor_total de pedidos pagos/ativos (inclui lançamentos manuais)
    'receita_confirmada', (
      SELECT COALESCE(SUM(valor_total), 0)
      FROM pedidos
      WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado')
    ),
    -- Receita prevista: confirmada + pedidos aguardando pagamento/contrato
    'receita_prevista', (
      SELECT COALESCE(SUM(valor_total), 0)
      FROM pedidos
      WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado',
                       'aguardando_contrato', 'pendente')
    ),
    -- Receita à vista
    'receita_avista', (
      SELECT COALESCE(SUM(valor_total), 0)
      FROM pedidos
      WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado')
        AND COALESCE(tipo_cobranca, 'avista') = 'avista'
    ),
    -- MRR: soma de valor_mensal dos pedidos mensais ativos
    'receita_mensal_recorrente', (
      SELECT COALESCE(SUM(COALESCE(valor_mensal, valor_total / NULLIF(plano_meses, 0))), 0)
      FROM pedidos
      WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado')
        AND tipo_cobranca = 'mensal'
    ),
    'pedidos_ativos', (
      SELECT COUNT(*) FROM pedidos
      WHERE status IN ('ativo', 'pago_pendente_video', 'video_aprovado')
    ),
    'pedidos_processando', (
      SELECT COUNT(*) FROM pedidos
      WHERE status IN ('aguardando_contrato', 'aguardando_video', 'video_enviado')
    ),
    'pedidos_aguardando_contrato', (
      SELECT COUNT(*) FROM pedidos WHERE status = 'aguardando_contrato'
    ),
    'pedidos_pendentes', (
      SELECT COUNT(*) FROM pedidos WHERE status = 'pendente'
    ),
    'pedidos_bloqueados', (
      SELECT COUNT(*) FROM pedidos WHERE status = 'bloqueado'
    ),
    'pedidos_cancelados', (
      SELECT COUNT(*) FROM pedidos
      WHERE status IN ('cancelado', 'cancelado_automaticamente')
    ),
    'pedidos_finalizados', (
      SELECT COUNT(*) FROM pedidos
      WHERE status = 'ativo' AND data_fim <= CURRENT_DATE
    ),
    'total_tentativas', (SELECT COUNT(*) FROM tentativas_compra),
    'valor_abandonado', (
      SELECT COALESCE(SUM(valor_total), 0) FROM tentativas_compra
    )
  ) INTO result;

  RETURN result;
END;
$function$;

-- C) Atualiza get_dashboard_stats_by_month com receita à vista, mensal e vendas
CREATE OR REPLACE FUNCTION public.get_dashboard_stats_by_month(p_year integer, p_month integer)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT json_build_object(
    'total_users', (
      SELECT COUNT(*) FROM public.users
      WHERE EXTRACT(YEAR FROM data_criacao) = p_year
        AND EXTRACT(MONTH FROM data_criacao) = p_month
    ),
    'total_users_accumulated', (
      SELECT COUNT(*) FROM public.users
      WHERE data_criacao <= DATE(p_year || '-' || p_month || '-01') + INTERVAL '1 month' - INTERVAL '1 day'
    ),
    'total_buildings', (
      SELECT COUNT(*) FROM public.pedidos
      WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado')
        AND EXTRACT(YEAR FROM created_at) = p_year
        AND EXTRACT(MONTH FROM created_at) = p_month
    ),
    'total_buildings_accumulated', (
      SELECT COUNT(*) FROM public.pedidos
      WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado')
        AND created_at <= DATE(p_year || '-' || p_month || '-01') + INTERVAL '1 month' - INTERVAL '1 day'
    ),
    'total_orders', (
      SELECT COUNT(*) FROM public.pedidos
      WHERE EXTRACT(YEAR FROM created_at) = p_year
        AND EXTRACT(MONTH FROM created_at) = p_month
    ),
    'vendas_realizadas', (
      SELECT COUNT(*) FROM public.pedidos
      WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado')
        AND EXTRACT(YEAR FROM created_at) = p_year
        AND EXTRACT(MONTH FROM created_at) = p_month
    ),
    'total_panels', (
      SELECT COUNT(*) FROM public.painels
      WHERE EXTRACT(YEAR FROM created_at) = p_year
        AND EXTRACT(MONTH FROM created_at) = p_month
    ),
    'total_panels_accumulated', (
      SELECT COUNT(*) FROM public.painels
      WHERE created_at <= DATE(p_year || '-' || p_month || '-01') + INTERVAL '1 month' - INTERVAL '1 day'
    ),
    'monthly_revenue', (
      SELECT COALESCE(SUM(valor_total), 0) FROM public.pedidos
      WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado')
        AND EXTRACT(YEAR FROM created_at) = p_year
        AND EXTRACT(MONTH FROM created_at) = p_month
    ),
    'monthly_revenue_avista', (
      SELECT COALESCE(SUM(valor_total), 0) FROM public.pedidos
      WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado')
        AND COALESCE(tipo_cobranca, 'avista') = 'avista'
        AND EXTRACT(YEAR FROM created_at) = p_year
        AND EXTRACT(MONTH FROM created_at) = p_month
    ),
    'monthly_revenue_recorrente', (
      SELECT COALESCE(SUM(COALESCE(valor_mensal, valor_total / NULLIF(plano_meses, 0))), 0)
      FROM public.pedidos
      WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado')
        AND tipo_cobranca = 'mensal'
        AND EXTRACT(YEAR FROM created_at) = p_year
        AND EXTRACT(MONTH FROM created_at) = p_month
    ),
    'active_orders', (
      SELECT COUNT(*) FROM public.pedidos
      WHERE status IN ('ativo', 'video_aprovado')
        AND EXTRACT(YEAR FROM created_at) = p_year
        AND EXTRACT(MONTH FROM created_at) = p_month
    ),
    'pending_orders', (
      SELECT COUNT(*) FROM public.pedidos
      WHERE status IN ('pendente', 'pago_pendente_video')
        AND EXTRACT(YEAR FROM created_at) = p_year
        AND EXTRACT(MONTH FROM created_at) = p_month
    ),
    'online_panels', (
      SELECT COUNT(*) FROM public.painels
      WHERE status = 'online'
        AND created_at <= DATE(p_year || '-' || p_month || '-01') + INTERVAL '1 month' - INTERVAL '1 day'
    ),
    'month_year', p_year || '-' || LPAD(p_month::text, 2, '0')
  );
$function$;
