-- Remover foreign keys duplicadas e manter apenas uma

-- 1. Listar e remover todas as constraints existentes
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    -- Buscar todas as foreign keys de campaign_id em campaign_video_schedules
    FOR constraint_record IN 
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'campaign_video_schedules'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%campaign%'
    LOOP
        EXECUTE format('ALTER TABLE campaign_video_schedules DROP CONSTRAINT IF EXISTS %I', constraint_record.constraint_name);
    END LOOP;
    
    -- Buscar todas as foreign keys de video_id em campaign_video_schedules
    FOR constraint_record IN 
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'campaign_video_schedules'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%video%'
    LOOP
        EXECUTE format('ALTER TABLE campaign_video_schedules DROP CONSTRAINT IF EXISTS %I', constraint_record.constraint_name);
    END LOOP;
END $$;

-- 2. Adicionar as foreign keys corretas (apenas uma de cada)
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

-- 3. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_campaign_video_schedules_video_id 
ON campaign_video_schedules(video_id);

CREATE INDEX IF NOT EXISTS idx_campaign_video_schedules_campaign_id 
ON campaign_video_schedules(campaign_id);

-- 4. Adicionar constraint de unicidade
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_video_schedules_unique 
ON campaign_video_schedules(campaign_id, video_id, slot_position);