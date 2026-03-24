-- Clean orphaned campaign_schedule_rules and campaign_video_schedules for pedido fac11754
-- The video "teste 6" (54700369-3a68-4230-8c70-396c0580ff02) was removed from pedido_videos but its campaign schedule remained

DELETE FROM campaign_schedule_rules 
WHERE campaign_video_schedule_id = '8640a2d4-c55d-42a9-bc4c-469f6c58926f';

DELETE FROM campaign_video_schedules 
WHERE id = '8640a2d4-c55d-42a9-bc4c-469f6c58926f';

-- Also clean up the orphaned campaign if it has no more schedules
DELETE FROM campaigns_advanced 
WHERE id = '5e640096-f861-4a59-8835-447e1626bb0a'
AND NOT EXISTS (
  SELECT 1 FROM campaign_video_schedules WHERE campaign_id = '5e640096-f861-4a59-8835-447e1626bb0a'
);