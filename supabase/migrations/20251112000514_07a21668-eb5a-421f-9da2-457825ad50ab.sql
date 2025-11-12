-- Fix schedule rule for cachorro video on Tuesday/Wednesday/Thursday to be all-day
-- Currently it's set for 09:00-18:00 but should be 00:00-23:59 (all day)

UPDATE campaign_schedule_rules
SET 
  start_time = '00:00:00',
  end_time = '23:59:00',
  is_all_day = true,
  updated_at = now()
WHERE id = '30238366-380e-4a66-925a-cf2d091cf44d';