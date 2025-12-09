-- Create retroactive offline records for devices that are offline but have no connection_history record today

-- Provence (offline since ~13:46 BRT = 16:46 UTC)
INSERT INTO connection_history (computer_id, event_type, started_at)
SELECT d.id, 'offline', COALESCE(d.last_online_at, '2024-12-09T16:46:00Z')
FROM devices d
WHERE d.name = 'Provence' 
  AND d.status = 'offline'
  AND NOT EXISTS (
    SELECT 1 FROM connection_history ch 
    WHERE ch.computer_id = d.id 
      AND ch.event_type = 'offline' 
      AND ch.ended_at IS NULL
  );

-- Provence 2 (offline since ~13:46 BRT = 16:46 UTC)
INSERT INTO connection_history (computer_id, event_type, started_at)
SELECT d.id, 'offline', COALESCE(d.last_online_at, '2024-12-09T16:46:00Z')
FROM devices d
WHERE d.name = 'Provence 2' 
  AND d.status = 'offline'
  AND NOT EXISTS (
    SELECT 1 FROM connection_history ch 
    WHERE ch.computer_id = d.id 
      AND ch.event_type = 'offline' 
      AND ch.ended_at IS NULL
  );

-- Sala Jeff (offline since ~03:59 BRT = 06:59 UTC)
INSERT INTO connection_history (computer_id, event_type, started_at)
SELECT d.id, 'offline', COALESCE(d.last_online_at, '2024-12-09T06:59:00Z')
FROM devices d
WHERE d.name = 'Sala Jeff' 
  AND d.status = 'offline'
  AND NOT EXISTS (
    SELECT 1 FROM connection_history ch 
    WHERE ch.computer_id = d.id 
      AND ch.event_type = 'offline' 
      AND ch.ended_at IS NULL
  );