-- Extend devices table with new fields
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS comments text,
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'Sem provedor',
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS total_events integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS offline_count integer DEFAULT 0;

-- Create connection_history table
CREATE TABLE IF NOT EXISTS connection_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  computer_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('online', 'offline')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz DEFAULT now()
);

-- Create events_log table
CREATE TABLE IF NOT EXISTS events_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  computer_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  old_status text,
  new_status text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create provider_alerts table
CREATE TABLE IF NOT EXISTS provider_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  computer_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  old_provider text,
  new_provider text NOT NULL,
  detected_at timestamptz DEFAULT now(),
  notified boolean DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_connection_history_computer ON connection_history(computer_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_history_ended ON connection_history(computer_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_log_computer ON events_log(computer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devices_provider ON devices(provider);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- Enable RLS
ALTER TABLE connection_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read connection_history" ON connection_history FOR SELECT USING (true);
CREATE POLICY "Service role manage connection_history" ON connection_history FOR ALL USING (true);

CREATE POLICY "Public read events_log" ON events_log FOR SELECT USING (true);
CREATE POLICY "Service role manage events_log" ON events_log FOR ALL USING (true);

CREATE POLICY "Admins view provider_alerts" ON provider_alerts FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')));

CREATE POLICY "Service role manage provider_alerts" ON provider_alerts FOR ALL USING (true);

-- Function to calculate device statistics
CREATE OR REPLACE FUNCTION calculate_device_stats(device_id uuid, period_start timestamptz DEFAULT now() - interval '30 days', period_end timestamptz DEFAULT now())
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  total_time_seconds bigint;
  offline_time_seconds bigint;
  event_count integer;
  avg_offline_duration numeric;
BEGIN
  -- Calculate total offline time in period
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN ended_at IS NULL THEN EXTRACT(EPOCH FROM (now() - started_at))
        ELSE duration_seconds 
      END
    ), 0)::bigint,
    COUNT(*)
  INTO offline_time_seconds, event_count
  FROM connection_history
  WHERE computer_id = device_id 
    AND event_type = 'offline'
    AND started_at BETWEEN period_start AND period_end;

  -- Calculate average offline duration
  IF event_count > 0 THEN
    avg_offline_duration := offline_time_seconds::numeric / event_count;
  ELSE
    avg_offline_duration := 0;
  END IF;

  -- Calculate total time in period
  total_time_seconds := EXTRACT(EPOCH FROM (period_end - period_start))::bigint;

  result := jsonb_build_object(
    'total_events', event_count,
    'offline_time_seconds', offline_time_seconds,
    'total_time_seconds', total_time_seconds,
    'uptime_percentage', CASE WHEN total_time_seconds > 0 THEN ((total_time_seconds - offline_time_seconds)::numeric / total_time_seconds * 100) ELSE 100 END,
    'avg_offline_duration_seconds', ROUND(avg_offline_duration, 2)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;