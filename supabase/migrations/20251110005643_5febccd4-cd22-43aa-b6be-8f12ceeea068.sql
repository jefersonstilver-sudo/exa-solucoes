-- =====================================================
-- SOLUÇÃO DEFINITIVA: Recria approve_video com exception handling
-- e debug detalhado para identificar exatamente onde o erro ocorre
-- =====================================================

DROP FUNCTION IF EXISTS public.approve_video(uuid, uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.approve_video(p_pedido_video_id uuid, p_approved_by uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido_id uuid;
  v_video_id uuid;
  v_is_first_approval boolean := false;
  v_plano_meses integer;
  v_existing_base boolean := false;
  v_will_be_base boolean;
BEGIN
  RAISE NOTICE '🎬 INICIO approve_video para pedido_video_id: %', p_pedido_video_id;
  
  -- Get the pedido_id and video_id for this video
  BEGIN
    SELECT pedido_id, video_id INTO v_pedido_id, v_video_id
    FROM pedido_videos 
    WHERE id = p_pedido_video_id;
    
    RAISE NOTICE '✅ Pedido encontrado: % | Video: %', v_pedido_id, v_video_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO ao buscar pedido_video: %', SQLERRM;
    RETURN FALSE;
  END;
  
  IF v_pedido_id IS NULL THEN
    RAISE NOTICE '⚠️ Pedido ID é NULL';
    RETURN FALSE;
  END IF;

  -- Verificar se é a primeira aprovação deste pedido
  SELECT NOT EXISTS (
    SELECT 1 FROM pedido_videos 
    WHERE pedido_id = v_pedido_id 
    AND approval_status = 'approved'
    AND id != p_pedido_video_id
  ) INTO v_is_first_approval;
  
  RAISE NOTICE '📋 É primeira aprovação? %', v_is_first_approval;
  
  -- Verificar se já existe um vídeo base
  SELECT EXISTS (
    SELECT 1 FROM pedido_videos 
    WHERE pedido_id = v_pedido_id 
    AND is_base_video = true
    AND approval_status = 'approved'
    AND id != p_pedido_video_id
  ) INTO v_existing_base;
  
  RAISE NOTICE '📋 Já existe vídeo base? %', v_existing_base;
  
  -- Determinar se será vídeo base
  v_will_be_base := v_is_first_approval OR NOT v_existing_base;
  RAISE NOTICE '⭐ Será vídeo base? %', v_will_be_base;

  -- Update the video approval status
  BEGIN
    RAISE NOTICE '🔄 Atualizando pedido_videos...';
    UPDATE pedido_videos 
    SET 
      approval_status = 'approved',
      approved_by = p_approved_by,
      approved_at = now(),
      is_active = true,
      is_base_video = v_will_be_base,
      selected_for_display = v_will_be_base,
      updated_at = now()
    WHERE id = p_pedido_video_id
    AND approval_status = 'pending';
    
    IF NOT FOUND THEN
      RAISE NOTICE '⚠️ Nenhum registro atualizado em pedido_videos';
      RETURN FALSE;
    END IF;
    
    RAISE NOTICE '✅ pedido_videos atualizado com sucesso';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO ao atualizar pedido_videos: %', SQLERRM;
    RAISE;
  END;

  -- Se este vídeo foi definido como base, desmarcar outros
  IF v_will_be_base THEN
    BEGIN
      RAISE NOTICE '🔄 Desmarcando outros vídeos base...';
      UPDATE pedido_videos 
      SET 
        is_base_video = false, 
        selected_for_display = false,
        updated_at = now()
      WHERE pedido_id = v_pedido_id 
      AND id != p_pedido_video_id;
      
      RAISE NOTICE '✅ Outros vídeos desmarcados';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ ERRO ao desmarcar outros vídeos: %', SQLERRM;
      RAISE;
    END;
  END IF;

  -- Se é a primeira aprovação, atualizar as datas do contrato
  IF v_is_first_approval THEN
    BEGIN
      RAISE NOTICE '🔄 Buscando plano_meses...';
      SELECT plano_meses INTO v_plano_meses
      FROM pedidos 
      WHERE id = v_pedido_id;
      
      RAISE NOTICE '📅 Plano: % meses', v_plano_meses;
      
      -- Atualizar datas do contrato - SEM updated_at!
      RAISE NOTICE '🔄 Atualizando datas do pedido...';
      UPDATE pedidos 
      SET 
        data_inicio = CURRENT_DATE,
        data_fim = CURRENT_DATE + (v_plano_meses || ' months')::interval
      WHERE id = v_pedido_id;
      
      RAISE NOTICE '✅ Datas do pedido atualizadas';
      
      -- Log da atualização de datas
      INSERT INTO log_eventos_sistema (tipo_evento, descricao)
      VALUES (
        'CONTRACT_ACTIVATION',
        format('Contrato ativado para pedido %s: início=%s, fim=%s. Primeiro vídeo aprovado: %s', 
               v_pedido_id, CURRENT_DATE, CURRENT_DATE + (v_plano_meses || ' months')::interval, p_pedido_video_id)
      );
      
      RAISE NOTICE '✅ Log de ativação criado';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ ERRO ao atualizar datas do contrato: %', SQLERRM;
      RAISE;
    END;
  END IF;
  
  -- Atualizar status do pedido - SEM updated_at!
  BEGIN
    RAISE NOTICE '🔄 Atualizando status do pedido...';
    UPDATE pedidos 
    SET status = 'video_aprovado'
    WHERE id = v_pedido_id
    AND status IN ('pago', 'pago_pendente_video', 'video_enviado');
    
    RAISE NOTICE '✅ Status do pedido atualizado';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO ao atualizar status do pedido: %', SQLERRM;
    RAISE;
  END;
  
  RAISE NOTICE '🎉 approve_video concluído com sucesso';
  RETURN TRUE;
END;
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.approve_video(uuid, uuid) TO authenticated;

-- Log migration
INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
VALUES ('MIGRATION', 'Função approve_video recriada com exception handling e logs detalhados para debug');