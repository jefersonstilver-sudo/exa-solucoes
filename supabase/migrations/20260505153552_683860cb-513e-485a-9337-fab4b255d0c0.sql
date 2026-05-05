ALTER TABLE pedido_videos DISABLE TRIGGER prevent_base_video_removal_trg;
ALTER TABLE pedido_videos DISABLE TRIGGER prevent_last_video_removal_trg;
ALTER TABLE pedido_videos DISABLE TRIGGER protect_last_base_video_trigger;
DELETE FROM pedido_videos WHERE pedido_id = '8ac3c37d-1637-4571-a67c-93c90d205cb0' AND video_id IN ('228ef33e-3b52-4967-8bbe-3b2c0830539d','8c7a666e-4996-4191-9c93-0323dbad2c4a');
ALTER TABLE pedido_videos ENABLE TRIGGER prevent_base_video_removal_trg;
ALTER TABLE pedido_videos ENABLE TRIGGER prevent_last_video_removal_trg;
ALTER TABLE pedido_videos ENABLE TRIGGER protect_last_base_video_trigger;
DELETE FROM videos WHERE id IN ('228ef33e-3b52-4967-8bbe-3b2c0830539d','8c7a666e-4996-4191-9c93-0323dbad2c4a');