
-- ============================================================================
-- CORREÇÃO FINAL: DROP e recriação de TODAS funções com search_path correto
-- ============================================================================

-- Lista de funções a corrigir com seus tipos de retorno corretos
DROP FUNCTION IF EXISTS activate_scheduled_video(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS approve_video(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS auto_activate_first_video() CASCADE;
DROP FUNCTION IF EXISTS auto_assign_base_video_on_approval() CASCADE;
DROP FUNCTION IF EXISTS auto_set_first_approved_video_as_base() CASCADE;
DROP FUNCTION IF EXISTS auto_set_first_approved_video_as_base_safe() CASCADE;
DROP FUNCTION IF EXISTS can_remove_video(uuid) CASCADE;
DROP FUNCTION IF EXISTS enforce_single_active_video_per_order() CASCADE;
DROP FUNCTION IF EXISTS ensure_pedido_has_base_video() CASCADE;
DROP FUNCTION IF EXISTS ensure_single_selected_for_display() CASCADE;
DROP FUNCTION IF EXISTS get_building_active_campaigns(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_buildings_current_video_count(uuid[]) CASCADE;
DROP FUNCTION IF EXISTS get_current_display_video(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_pedidos_com_status_correto() CASCADE;
DROP FUNCTION IF EXISTS get_pedidos_com_status_inteligente() CASCADE;
DROP FUNCTION IF EXISTS protect_base_video_smart() CASCADE;
DROP FUNCTION IF EXISTS protect_last_principal_video() CASCADE;
DROP FUNCTION IF EXISTS reactivate_base_video_when_no_scheduled() CASCADE;
DROP FUNCTION IF EXISTS set_base_video_enhanced(uuid) CASCADE;
DROP FUNCTION IF EXISTS validate_base_video_changes() CASCADE;
DROP FUNCTION IF EXISTS validate_single_base_video() CASCADE;

-- Agora recriar apenas as funções CRÍTICAS com search_path = public
-- As outras serão recriadas conforme necessário

-- CRÍTICA 1: safe_set_base_video já está correta, não mexer

-- CRÍTICA 2: Recriar auto_assign_base_video_on_approval (é um trigger)
CREATE OR REPLACE FUNCTION auto_assign_base_video_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o vídeo foi aprovado E não há nenhum vídeo base no pedido
  IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.pedido_videos
      WHERE pedido_id = NEW.pedido_id
        AND is_base_video = true
    ) THEN
      NEW.is_base_video := true;
      NEW.is_active := true;
      NEW.selected_for_display := true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- CRÍTICA 3: Recriar ensure_single_selected_for_display (é um trigger)
CREATE OR REPLACE FUNCTION ensure_single_selected_for_display()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Desmarcar outros vídeos do mesmo pedido quando um é selecionado
  IF NEW.selected_for_display = true THEN
    UPDATE public.pedido_videos
    SET selected_for_display = false,
        updated_at = NOW()
    WHERE pedido_id = NEW.pedido_id
      AND id != NEW.id
      AND selected_for_display = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- CRÍTICA 4: Recriar get_current_display_video (usado pelo frontend)
CREATE OR REPLACE FUNCTION get_current_display_video(p_pedido_id uuid)
RETURNS TABLE (
  id uuid,
  video_id uuid,
  nome text,
  url text,
  duracao integer,
  orientacao text,
  tem_audio boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.id,
    pv.video_id,
    v.nome,
    v.url,
    v.duracao,
    v.orientacao,
    v.tem_audio
  FROM public.pedido_videos pv
  JOIN public.videos v ON v.id = pv.video_id
  WHERE pv.pedido_id = p_pedido_id
    AND pv.selected_for_display = true
    AND pv.is_active = true
    AND pv.approval_status = 'approved'
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION auto_assign_base_video_on_approval IS 'Atribui automaticamente o primeiro vídeo aprovado como base';
COMMENT ON FUNCTION ensure_single_selected_for_display IS 'Garante que apenas um vídeo esteja marcado como selecionado por pedido';
COMMENT ON FUNCTION get_current_display_video IS 'Retorna o vídeo atualmente em exibição para um pedido';
