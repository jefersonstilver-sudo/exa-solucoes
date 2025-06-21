
-- Função para validar se um pedido permite upload de vídeo
CREATE OR REPLACE FUNCTION public.validate_video_upload_permission(p_pedido_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pedido_status text;
BEGIN
  -- Buscar status do pedido
  SELECT status INTO v_pedido_status
  FROM public.pedidos
  WHERE id = p_pedido_id;
  
  -- Se pedido não existe, negar acesso
  IF v_pedido_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- Permitir upload apenas para pedidos pagos
  RETURN v_pedido_status IN ('pago', 'pago_pendente_video', 'video_aprovado', 'ativo');
END;
$$;

-- Trigger para validar upload de vídeo
CREATE OR REPLACE FUNCTION public.validate_video_upload_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar se o pedido permite upload
  IF NOT public.validate_video_upload_permission(NEW.pedido_id) THEN
    RAISE EXCEPTION 'Upload de vídeo não permitido para pedidos não pagos';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger na tabela pedido_videos
DROP TRIGGER IF EXISTS validate_video_upload_before_insert ON public.pedido_videos;
CREATE TRIGGER validate_video_upload_before_insert
  BEFORE INSERT ON public.pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_video_upload_trigger();

-- Corrigir função de ativação de contrato para definir datas apenas na ativação
CREATE OR REPLACE FUNCTION public.activate_contract_on_video_selection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pedido_id uuid;
  v_pedido RECORD;
BEGIN
  -- Verificar se o vídeo foi selecionado para exibição E está ativo
  IF NEW.selected_for_display = true AND NEW.is_active = true AND 
     (OLD.selected_for_display = false OR OLD.is_active = false) THEN
    
    -- Buscar pedido
    SELECT pedido_id INTO v_pedido_id FROM public.pedido_videos WHERE id = NEW.id;
    
    -- Buscar dados do pedido
    SELECT * INTO v_pedido FROM public.pedidos WHERE id = v_pedido_id;
    
    -- Só ativar se o pedido foi pago e não está ativo ainda
    IF v_pedido.status IN ('pago_pendente_video', 'video_aprovado') THEN
      -- Definir datas de início e fim do contrato AGORA
      UPDATE public.pedidos 
      SET 
        status = 'ativo',
        data_inicio = CURRENT_DATE,
        data_fim = CURRENT_DATE + (v_pedido.plano_meses || ' months')::INTERVAL
      WHERE id = v_pedido_id;
      
      -- Log do evento
      INSERT INTO public.log_eventos_sistema (
        tipo_evento,
        descricao
      ) VALUES (
        'CONTRACT_ACTIVATED',
        format('Contrato ativado para pedido %s - Data início: %s, Data fim: %s', 
               v_pedido_id, CURRENT_DATE, CURRENT_DATE + (v_pedido.plano_meses || ' months')::INTERVAL)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Função para auditoria de uploads indevidos
CREATE OR REPLACE FUNCTION public.audit_unauthorized_uploads()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_unauthorized_count integer := 0;
  v_pedidos_problematicos uuid[];
  v_result jsonb;
BEGIN
  -- Identificar pedidos com vídeos mas sem pagamento
  SELECT 
    COUNT(*),
    array_agg(DISTINCT pv.pedido_id)
  INTO v_unauthorized_count, v_pedidos_problematicos
  FROM public.pedido_videos pv
  JOIN public.pedidos p ON p.id = pv.pedido_id
  WHERE p.status NOT IN ('pago', 'pago_pendente_video', 'video_aprovado', 'ativo');
  
  v_result := jsonb_build_object(
    'unauthorized_uploads_found', v_unauthorized_count,
    'problematic_orders', v_pedidos_problematicos,
    'audit_timestamp', now()
  );
  
  -- Log da auditoria
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'SECURITY_AUDIT_UNAUTHORIZED_UPLOADS',
    format('Auditoria de segurança: %s uploads não autorizados encontrados', v_unauthorized_count)
  );
  
  RETURN v_result;
END;
$$;

-- Função para cleanup de uploads não autorizados
CREATE OR REPLACE FUNCTION public.cleanup_unauthorized_uploads()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;
