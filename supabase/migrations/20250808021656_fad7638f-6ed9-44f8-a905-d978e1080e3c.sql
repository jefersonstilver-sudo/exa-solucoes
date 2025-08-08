-- 1. Corrigir função approve_video para garantir auto-seleção do primeiro vídeo
CREATE OR REPLACE FUNCTION public.approve_video(p_pedido_video_id uuid, p_approved_by uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_pedido_id uuid;
  v_video_id uuid;
  v_other_video RECORD;
  v_is_advanced_campaign boolean := false;
  v_is_first_approval boolean := false;
  v_plano_meses integer;
  v_has_active_videos boolean := false;
BEGIN
  -- Get the pedido_id and video_id for this video
  SELECT pedido_id, video_id INTO v_pedido_id, v_video_id
  FROM public.pedido_videos 
  WHERE id = p_pedido_video_id;
  
  IF v_pedido_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verificar se é a primeira aprovação deste pedido
  SELECT NOT EXISTS (
    SELECT 1 FROM public.pedido_videos 
    WHERE pedido_id = v_pedido_id 
    AND approval_status = 'approved'
    AND id != p_pedido_video_id
  ) INTO v_is_first_approval;
  
  -- Verificar se já existem vídeos ativos no pedido
  SELECT EXISTS (
    SELECT 1 FROM public.pedido_videos 
    WHERE pedido_id = v_pedido_id 
    AND is_active = true
    AND approval_status = 'approved'
    AND id != p_pedido_video_id
  ) INTO v_has_active_videos;
  
  -- Update the video approval status AND activate it automatically
  UPDATE public.pedido_videos 
  SET 
    approval_status = 'approved',
    approved_by = p_approved_by,
    approved_at = now(),
    is_active = true,  -- Ativar automaticamente quando aprovado
    -- NOVO: Auto-selecionar se for o primeiro vídeo ou se não há vídeos ativos
    selected_for_display = CASE 
      WHEN v_is_first_approval OR NOT v_has_active_videos THEN true 
      ELSE false 
    END,
    updated_at = now()
  WHERE id = p_pedido_video_id
  AND approval_status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Se é a primeira aprovação, atualizar as datas do contrato
  IF v_is_first_approval THEN
    -- Buscar plano do pedido
    SELECT plano_meses INTO v_plano_meses
    FROM public.pedidos 
    WHERE id = v_pedido_id;
    
    -- Atualizar datas do contrato: começa hoje
    UPDATE public.pedidos 
    SET 
      data_inicio = CURRENT_DATE,
      data_fim = CURRENT_DATE + (v_plano_meses || ' months')::interval
    WHERE id = v_pedido_id;
    
    -- Log da atualização de datas
    INSERT INTO public.log_eventos_sistema (
      tipo_evento,
      descricao
    ) VALUES (
      'CONTRACT_ACTIVATION',
      format('Contrato ativado para pedido %s: início=%s, fim=%s. Primeiro vídeo aprovado: %s', 
             v_pedido_id, CURRENT_DATE, CURRENT_DATE + (v_plano_meses || ' months')::interval, p_pedido_video_id)
    );
  END IF;
  
  -- Se auto-selecionou este vídeo, desmarcar outros
  IF (v_is_first_approval OR NOT v_has_active_videos) THEN
    UPDATE public.pedido_videos 
    SET selected_for_display = false, updated_at = now()
    WHERE pedido_id = v_pedido_id 
    AND id != p_pedido_video_id
    AND selected_for_display = true;
  END IF;
  
  -- Verificar se este pedido é parte de uma campanha avançada
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns_advanced ca 
    WHERE ca.pedido_id = v_pedido_id
  ) INTO v_is_advanced_campaign;
  
  -- Para campanhas não avançadas: garantir apenas um vídeo selecionado
  IF NOT v_is_advanced_campaign THEN
    -- Se este vídeo foi auto-selecionado, garantir que outros não estejam selecionados
    IF (v_is_first_approval OR NOT v_has_active_videos) THEN
      UPDATE public.pedido_videos 
      SET selected_for_display = false, updated_at = now()
      WHERE pedido_id = v_pedido_id 
      AND id != p_pedido_video_id
      AND selected_for_display = true;
    END IF;
  END IF;
  
  -- Atualizar status do pedido para video_aprovado
  UPDATE public.pedidos 
  SET status = 'video_aprovado'
  WHERE id = v_pedido_id
  AND status IN ('pago', 'pago_pendente_video', 'video_enviado');
  
  RETURN TRUE;
END;
$function$;

-- 2. Criar função para prevenir remoção do último vídeo ativo
CREATE OR REPLACE FUNCTION public.prevent_last_video_removal()
RETURNS TRIGGER AS $$
DECLARE
  v_remaining_active_videos integer;
  v_contract_started boolean;
  v_pedido_status text;
BEGIN
  -- Verificar se é uma remoção (DELETE)
  IF TG_OP = 'DELETE' THEN
    -- Verificar se o contrato já foi iniciado
    SELECT 
      data_inicio IS NOT NULL AND data_inicio <= CURRENT_DATE,
      status
    INTO v_contract_started, v_pedido_status
    FROM public.pedidos 
    WHERE id = OLD.pedido_id;
    
    -- Se contrato ainda não iniciou, permitir remoção
    IF NOT v_contract_started THEN
      RETURN OLD;
    END IF;
    
    -- Contar quantos vídeos ativos restam (excluindo o que está sendo removido)
    SELECT COUNT(*) INTO v_remaining_active_videos
    FROM public.pedido_videos 
    WHERE pedido_id = OLD.pedido_id 
    AND id != OLD.id
    AND approval_status = 'approved'
    AND is_active = true;
    
    -- Se não restariam vídeos ativos, bloquear remoção
    IF v_remaining_active_videos = 0 THEN
      RAISE EXCEPTION 'CANNOT_REMOVE_LAST_VIDEO: Cannot remove the last active video from an active contract. Upload another video first.';
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para pedido_videos
DROP TRIGGER IF EXISTS prevent_last_video_removal_trigger ON public.pedido_videos;
CREATE TRIGGER prevent_last_video_removal_trigger
  BEFORE DELETE ON public.pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_video_removal();

-- 3. Corrigir dados existentes: pedidos com vídeos aprovados mas nenhum selecionado
DO $$
DECLARE
  v_pedido RECORD;
  v_first_video_id uuid;
  v_count_fixed integer := 0;
BEGIN
  -- Para cada pedido que tem vídeos aprovados mas nenhum selecionado
  FOR v_pedido IN 
    SELECT DISTINCT pv.pedido_id
    FROM public.pedido_videos pv
    WHERE pv.approval_status = 'approved'
    AND pv.pedido_id NOT IN (
      SELECT DISTINCT pedido_id 
      FROM public.pedido_videos 
      WHERE selected_for_display = true
    )
  LOOP
    -- Pegar o primeiro vídeo aprovado (mais antigo)
    SELECT id INTO v_first_video_id
    FROM public.pedido_videos
    WHERE pedido_id = v_pedido.pedido_id
    AND approval_status = 'approved'
    ORDER BY approved_at ASC, created_at ASC
    LIMIT 1;
    
    -- Marcar como selecionado para exibição
    IF v_first_video_id IS NOT NULL THEN
      UPDATE public.pedido_videos
      SET selected_for_display = true, updated_at = now()
      WHERE id = v_first_video_id;
      
      v_count_fixed := v_count_fixed + 1;
    END IF;
  END LOOP;
  
  -- Log da correção
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'DATA_FIX_AUTO_SELECT_VIDEOS',
    format('Corrigidos %s pedidos com vídeos aprovados mas não selecionados para exibição', v_count_fixed)
  );
END $$;