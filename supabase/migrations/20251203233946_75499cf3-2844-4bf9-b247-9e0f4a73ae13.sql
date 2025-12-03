-- Add columns for real-time viewing status
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS is_viewing BOOLEAN DEFAULT false;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient viewing queries
CREATE INDEX IF NOT EXISTS idx_proposals_is_viewing ON proposals(is_viewing) WHERE is_viewing = true;

-- Enable realtime for proposals table (for viewing status changes)
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;