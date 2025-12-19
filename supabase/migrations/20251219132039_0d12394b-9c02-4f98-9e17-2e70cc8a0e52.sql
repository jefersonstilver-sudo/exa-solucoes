-- Function to auto-close uptime records on offline events (outside 1h-4h BRT)
CREATE OR REPLACE FUNCTION close_uptime_on_offline()
RETURNS TRIGGER AS $$
DECLARE
  current_hour_brt INTEGER;
  current_uptime_record RECORD;
  uptime_duration INTEGER;
BEGIN
  -- Only trigger on offline events
  IF NEW.event_type != 'offline' THEN
    RETURN NEW;
  END IF;

  -- Get current hour in BRT (UTC-3)
  current_hour_brt := EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'America/Sao_Paulo'));
  
  -- Skip if we're in scheduled shutdown period (1h-4h BRT)
  IF current_hour_brt >= 1 AND current_hour_brt < 4 THEN
    RAISE LOG '[close_uptime_on_offline] Skipping - currently in scheduled shutdown period (hour: %)', current_hour_brt;
    RETURN NEW;
  END IF;

  -- Find current active uptime record
  SELECT * INTO current_uptime_record
  FROM uptime_records
  WHERE is_current = true
  LIMIT 1;

  IF FOUND THEN
    -- Calculate duration in seconds
    uptime_duration := EXTRACT(EPOCH FROM (NOW() - current_uptime_record.started_at))::INTEGER;
    
    -- Close the uptime record
    UPDATE uptime_records
    SET 
      ended_at = NOW(),
      is_current = false,
      duration_seconds = uptime_duration,
      ended_by_device_name = (
        SELECT name FROM devices WHERE id = NEW.computer_id
      ),
      ended_by_device_id = NEW.computer_id
    WHERE id = current_uptime_record.id;

    RAISE LOG '[close_uptime_on_offline] Closed uptime record % after % seconds due to device offline', 
      current_uptime_record.id, uptime_duration;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on connection_history
DROP TRIGGER IF EXISTS trigger_close_uptime_on_offline ON connection_history;
CREATE TRIGGER trigger_close_uptime_on_offline
  AFTER INSERT ON connection_history
  FOR EACH ROW
  EXECUTE FUNCTION close_uptime_on_offline();

-- Add ended_by_device_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'uptime_records' AND column_name = 'ended_by_device_id'
  ) THEN
    ALTER TABLE uptime_records ADD COLUMN ended_by_device_id UUID REFERENCES devices(id);
  END IF;
END $$;