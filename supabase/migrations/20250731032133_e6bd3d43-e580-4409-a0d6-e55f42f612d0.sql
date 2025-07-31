-- Continue fixing remaining database functions with search path protection
-- Batch 2: Fix next set of critical functions

-- Fix function: get_coupon_usage_details
CREATE OR REPLACE FUNCTION public.get_coupon_usage_details(cupom_id_param uuid)
 RETURNS TABLE(user_email text, pedido_id uuid, valor_pedido numeric, valor_desconto numeric, data_uso timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT 
    COALESCE(au.email, 'Email não encontrado') as user_email,
    p.id as pedido_id,
    p.valor_total as valor_pedido,
    p.valor_total * (c.desconto_percentual / 100.0) as valor_desconto,
    p.created_at as data_uso
  FROM public.pedidos p
  JOIN public.cupons c ON c.id = p.cupom_id
  LEFT JOIN auth.users au ON au.id = p.client_id
  WHERE p.cupom_id = cupom_id_param
  ORDER BY p.created_at DESC;
$function$;

-- Fix function: get_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.users),
    'total_buildings', (SELECT COUNT(*) FROM public.buildings),
    'total_orders', (SELECT COUNT(*) FROM public.pedidos),
    'total_panels', (SELECT COUNT(*) FROM public.painels),
    'monthly_revenue', (SELECT COALESCE(SUM(valor_total), 0) FROM public.pedidos WHERE status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado')),
    'active_orders', (SELECT COUNT(*) FROM public.pedidos WHERE status IN ('ativo', 'video_aprovado')),
    'pending_orders', (SELECT COUNT(*) FROM public.pedidos WHERE status IN ('pendente', 'pago_pendente_video')),
    'online_panels', (SELECT COUNT(*) FROM public.painels WHERE status = 'online')
  );
$function$;

-- Fix function: get_dashboard_stats_by_month
CREATE OR REPLACE FUNCTION public.get_dashboard_stats_by_month(p_year integer, p_month integer)
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
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

-- Fix function: check_user_data_integrity
CREATE OR REPLACE FUNCTION public.check_user_data_integrity()
 RETURNS TABLE(user_id uuid, email text, users_role text, metadata_role text, is_consistent boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    users.role as users_role,
    au.raw_user_meta_data->>'role' as metadata_role,
    (users.role = au.raw_user_meta_data->>'role') as is_consistent
  FROM auth.users au
  LEFT JOIN users ON users.id = au.id
  WHERE au.email IS NOT NULL
  ORDER BY au.created_at;
END;
$function$;

-- Fix function: check_panel_availability
CREATE OR REPLACE FUNCTION public.check_panel_availability(p_panel_id uuid, p_start_date date, p_end_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.campanhas
    WHERE painel_id = p_panel_id
    AND status IN ('pendente', 'ativo')
    AND (
      (data_inicio <= p_end_date AND data_fim >= p_start_date)
    )
  );
END;
$function$;

-- Fix function: detect_financial_anomalies
CREATE OR REPLACE FUNCTION public.detect_financial_anomalies()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  v_duplicate_orders integer;
  v_zero_value_orders integer;
  v_suspicious_timing integer;
  v_missing_logs integer;
  v_result jsonb;
BEGIN
  -- Detectar pedidos duplicados
  SELECT COUNT(*) INTO v_duplicate_orders
  FROM (
    SELECT client_id, valor_total, COUNT(*) as cnt
    FROM public.pedidos
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    AND status IN ('pago', 'pago_pendente_video')
    GROUP BY client_id, valor_total, DATE(created_at)
    HAVING COUNT(*) > 1
  ) duplicates;

  -- Detectar pedidos com valor zero ou negativo
  SELECT COUNT(*) INTO v_zero_value_orders
  FROM public.pedidos
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND (valor_total <= 0 OR valor_total IS NULL);

  -- Detectar múltiplos pedidos no mesmo minuto (suspeito)
  SELECT COUNT(*) INTO v_suspicious_timing
  FROM (
    SELECT client_id, DATE_TRUNC('minute', created_at) as minute_group, COUNT(*) as cnt
    FROM public.pedidos
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY client_id, DATE_TRUNC('minute', created_at)
    HAVING COUNT(*) > 1
  ) suspicious;

  -- Detectar pedidos sem logs de pagamento
  SELECT COUNT(*) INTO v_missing_logs
  FROM public.pedidos
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND status IN ('pago', 'pago_pendente_video')
  AND (log_pagamento IS NULL OR log_pagamento = '{}'::jsonb);

  v_result := jsonb_build_object(
    'duplicate_orders', v_duplicate_orders,
    'zero_value_orders', v_zero_value_orders,
    'suspicious_timing', v_suspicious_timing,
    'missing_payment_logs', v_missing_logs,
    'anomaly_score', v_duplicate_orders + v_zero_value_orders + v_suspicious_timing + v_missing_logs,
    'status', CASE 
      WHEN (v_duplicate_orders + v_zero_value_orders + v_suspicious_timing + v_missing_logs) = 0 THEN 'HEALTHY'
      WHEN (v_duplicate_orders + v_zero_value_orders + v_suspicious_timing + v_missing_logs) <= 3 THEN 'WARNING'
      ELSE 'CRITICAL'
    END,
    'timestamp', now()
  );

  -- Log das anomalias
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'FINANCIAL_ANOMALY_DETECTION',
    format('Detecção de anomalias: %s', v_result::text)
  );

  RETURN v_result;
END;
$function$;

-- Fix function: cleanup_unauthorized_uploads
CREATE OR REPLACE FUNCTION public.cleanup_unauthorized_uploads()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  v_cleaned_count integer := 0;
  v_video_record RECORD;
  v_result jsonb;
BEGIN
  -- Identificar e remover vídeos de pedidos não pagos
  FOR v_video_record IN
    SELECT pv.*, p.status as pedido_status
    FROM public.pedido_videos pv
    JOIN public.pedidos p ON p.id = pv.pedido_id
    WHERE p.status NOT IN ('pago', 'pago_pendente_video', 'video_aprovado', 'ativo')
  LOOP
    -- Log antes de remover
    INSERT INTO public.log_eventos_sistema (
      tipo_evento,
      descricao
    ) VALUES (
      'UNAUTHORIZED_UPLOAD_REMOVED',
      format('Removido upload não autorizado: pedido %s, status %s', 
             v_video_record.pedido_id, v_video_record.pedido_status)
    );
    
    -- Remover registro de vídeo não autorizado
    DELETE FROM public.pedido_videos WHERE id = v_video_record.id;
    v_cleaned_count := v_cleaned_count + 1;
  END LOOP;
  
  v_result := jsonb_build_object(
    'success', true,
    'cleaned_uploads', v_cleaned_count,
    'cleanup_timestamp', now()
  );
  
  RETURN v_result;
END;
$function$;

-- Fix function: emergency_financial_audit_and_fix
CREATE OR REPLACE FUNCTION public.emergency_financial_audit_and_fix()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  v_duplicates_found integer := 0;
  v_duplicates_fixed integer := 0;
  v_orphaned_attempts integer := 0;
  v_total_corrected_value numeric := 0;
  v_result jsonb;
  v_duplicate_group RECORD;
  v_attempt RECORD;
BEGIN
  -- Log início da auditoria emergencial
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'EMERGENCY_FINANCIAL_AUDIT_START',
    'Iniciando auditoria emergencial e correção de dados financeiros'
  );

  -- Identificar e corrigir pedidos duplicados
  FOR v_duplicate_group IN
    SELECT 
      client_id,
      valor_total,
      COUNT(*) as duplicate_count,
      array_agg(id ORDER BY created_at) as pedido_ids,
      MIN(created_at) as first_created
    FROM public.pedidos
    WHERE created_at >= '2025-06-01'
    AND created_at < '2025-07-01'
    AND status IN ('pago', 'pago_pendente_video')
    GROUP BY client_id, valor_total
    HAVING COUNT(*) > 1
  LOOP
    v_duplicates_found := v_duplicates_found + v_duplicate_group.duplicate_count - 1;
    
    -- Manter apenas o primeiro pedido, deletar os duplicados
    FOR i IN 2..array_length(v_duplicate_group.pedido_ids, 1) LOOP
      DELETE FROM public.pedidos 
      WHERE id = v_duplicate_group.pedido_ids[i];
      
      v_duplicates_fixed := v_duplicates_fixed + 1;
      
      -- Log da correção
      INSERT INTO public.log_eventos_sistema (
        tipo_evento,
        descricao
      ) VALUES (
        'DUPLICATE_ORDER_REMOVED',
        format('Pedido duplicado removido: %s (valor: %s)', 
               v_duplicate_group.pedido_ids[i], v_duplicate_group.valor_total)
      );
    END LOOP;
  END LOOP;

  -- Migrar tentativas órfãs para pedidos válidos
  FOR v_attempt IN
    SELECT * FROM public.tentativas_compra
    WHERE created_at >= '2025-06-01'
    AND created_at < '2025-07-01'
    AND valor_total > 0
  LOOP
    -- Verificar se já existe pedido para esta tentativa
    IF NOT EXISTS (
      SELECT 1 FROM public.pedidos 
      WHERE client_id = v_attempt.id_user 
      AND valor_total = v_attempt.valor_total
      AND created_at >= v_attempt.created_at - INTERVAL '1 hour'
      AND created_at <= v_attempt.created_at + INTERVAL '1 hour'
    ) THEN
      -- Criar pedido para tentativa órfã
      INSERT INTO public.pedidos (
        client_id,
        lista_paineis,
        plano_meses,
        valor_total,
        status,
        data_inicio,
        data_fim,
        termos_aceitos,
        log_pagamento,
        created_at
      ) VALUES (
        v_attempt.id_user,
        COALESCE(v_attempt.predios_selecionados::text[], '{}'),
        1,
        v_attempt.valor_total,
        'pago_pendente_video',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '1 month',
        true,
        jsonb_build_object(
          'payment_method', 'pix',
          'payment_status', 'approved',
          'migrated_from_tentativa', v_attempt.id,
          'emergency_fix', true,
          'fixed_at', now()
        ),
        v_attempt.created_at
      );
      
      v_total_corrected_value := v_total_corrected_value + v_attempt.valor_total;
    END IF;
    
    -- Remover tentativa após migração
    DELETE FROM public.tentativas_compra WHERE id = v_attempt.id;
    v_orphaned_attempts := v_orphaned_attempts + 1;
  END LOOP;

  -- Calcular totais finais após correção
  v_result := jsonb_build_object(
    'success', true,
    'duplicates_found', v_duplicates_found,
    'duplicates_fixed', v_duplicates_fixed,
    'orphaned_attempts_migrated', v_orphaned_attempts,
    'total_corrected_value', v_total_corrected_value,
    'final_june_total', (
      SELECT COALESCE(SUM(valor_total), 0)
      FROM public.pedidos
      WHERE created_at >= '2025-06-01'
      AND created_at < '2025-07-01'
      AND status IN ('pago', 'pago_pendente_video')
    ),
    'audit_timestamp', now()
  );

  -- Log resultado da auditoria
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'EMERGENCY_FINANCIAL_AUDIT_COMPLETED',
    format('Auditoria emergencial concluída: %s', v_result::text)
  );

  RETURN v_result;
END;
$function$;