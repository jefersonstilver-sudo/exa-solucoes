-- Fix 1: Backfill approved_at for 4 orphan approved videos
UPDATE public.pedido_videos
SET approved_at = updated_at
WHERE approval_status = 'approved' AND approved_at IS NULL;

-- Fix 2: Create schedule for orphan v4-delivery video (pedido 7419ff78..., video 85b2adf6...)
-- Window: Monday-Thursday 14:00-17:00 (only free slot between v3 and V5-happy hour)
WITH new_schedule AS (
  INSERT INTO public.campaign_video_schedules (campaign_id, video_id, slot_position, priority)
  VALUES (
    '84dab934-673c-4143-b706-9eab8d04f61a',
    '85b2adf6-22cb-40f6-9591-8042e4b837ef',
    4,
    1
  )
  RETURNING id
)
INSERT INTO public.campaign_schedule_rules (campaign_video_schedule_id, days_of_week, start_time, end_time, is_all_day, is_active)
SELECT id, ARRAY[1,2,3,4], '14:00:00'::time, '17:00:00'::time, false, true FROM new_schedule;