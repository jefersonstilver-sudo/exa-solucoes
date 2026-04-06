
-- 1. Delete orphaned campaign_schedule_rules
DELETE FROM campaign_schedule_rules
WHERE campaign_video_schedule_id IN (
  SELECT cvs.id
  FROM campaign_video_schedules cvs
  JOIN campaigns_advanced ca ON ca.id = cvs.campaign_id
  WHERE NOT EXISTS (
    SELECT 1 FROM pedido_videos pv
    WHERE pv.video_id = cvs.video_id
      AND pv.pedido_id = ca.pedido_id
  )
);

-- 2. Delete orphaned campaign_video_schedules
DELETE FROM campaign_video_schedules
WHERE id IN (
  SELECT cvs.id
  FROM campaign_video_schedules cvs
  JOIN campaigns_advanced ca ON ca.id = cvs.campaign_id
  WHERE NOT EXISTS (
    SELECT 1 FROM pedido_videos pv
    WHERE pv.video_id = cvs.video_id
      AND pv.pedido_id = ca.pedido_id
  )
);

-- 3. Delete campaigns_advanced that have no remaining schedules
DELETE FROM campaigns_advanced
WHERE id NOT IN (
  SELECT DISTINCT campaign_id FROM campaign_video_schedules
) AND id IN (
  SELECT id FROM campaigns_advanced
);
