-- Clean corrupted flipflop events from events_log (today's 7,000+ false transitions)
DELETE FROM events_log 
WHERE created_at >= CURRENT_DATE 
AND event_type = 'status_change'
AND old_status = 'offline' 
AND new_status = 'online';

-- Clean any duplicate online records from connection_history that were created by the bug
DELETE FROM connection_history 
WHERE event_type = 'online' 
AND created_at >= '2025-12-08'::date;