-- Corrigir função reactivate_base_video_when_no_schedules removendo chamada inexistente

CREATE OR REPLACE FUNCTION reactivate_base_video_when_no_schedules()
RETURNS TRIGGER AS $$
DECLARE
  v_pedido_id UUID;
  v_remaining_schedules INT;
BEGIN
  -- Obter pedido_id através do JOIN com campaigns_advanced
  SELECT ca.pedido_id
  INTO v_pedido_id
  FROM campaign_video_schedules cvs
  JOIN campaigns_advanced ca ON ca.id = cvs.campaign_id
  WHERE cvs.id = OLD.campaign_video_schedule_id;

  -- Contar regras ativas restantes para este vídeo
  SELECT COUNT(*)
  INTO v_remaining_schedules
  FROM campaign_schedule_rules csr
  WHERE csr.campaign_video_schedule_id = OLD.campaign_video_schedule_id
    AND csr.is_active = true
    AND csr.id != OLD.id;

  -- Log para debug
  RAISE NOTICE 'Remaining schedules for video: %', v_remaining_schedules;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_reactivate_base_video ON campaign_schedule_rules;

CREATE TRIGGER trigger_reactivate_base_video
AFTER DELETE OR UPDATE OF is_active ON campaign_schedule_rules
FOR EACH ROW
WHEN (OLD.is_active = true)
EXECUTE FUNCTION reactivate_base_video_when_no_schedules();