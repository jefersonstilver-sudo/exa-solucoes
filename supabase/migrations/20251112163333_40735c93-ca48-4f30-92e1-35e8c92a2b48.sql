-- Simplificar função reactivate_base_video_when_no_schedules (remover chamada inexistente)

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

  -- Se não há mais regras ativas, apenas logar (remover sincronização automática)
  IF v_remaining_schedules = 0 THEN
    RAISE NOTICE 'No more active schedules for campaign_video_schedule_id: %, pedido_id: %', 
      OLD.campaign_video_schedule_id, v_pedido_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Agora adicionar as foreign keys

-- 1. Limpar dados órfãos
DELETE FROM campaign_video_schedules 
WHERE video_id NOT IN (SELECT id FROM videos);

DELETE FROM campaign_video_schedules 
WHERE campaign_id NOT IN (SELECT id FROM campaigns_advanced);

-- 2. Adicionar foreign keys
ALTER TABLE campaign_video_schedules
ADD CONSTRAINT fk_campaign_video_schedules_video
FOREIGN KEY (video_id) 
REFERENCES videos(id) 
ON DELETE CASCADE;

ALTER TABLE campaign_video_schedules
ADD CONSTRAINT fk_campaign_video_schedules_campaign
FOREIGN KEY (campaign_id) 
REFERENCES campaigns_advanced(id) 
ON DELETE CASCADE;

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_campaign_video_schedules_video_id 
ON campaign_video_schedules(video_id);

CREATE INDEX IF NOT EXISTS idx_campaign_video_schedules_campaign_id 
ON campaign_video_schedules(campaign_id);

-- 4. Constraint de unicidade
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_video_schedules_unique 
ON campaign_video_schedules(campaign_id, video_id, slot_position);