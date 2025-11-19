-- Create sync_runs table for tracking ManyChat pull-sync operations
CREATE TABLE IF NOT EXISTS public.sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  finished_at TIMESTAMP WITH TIME ZONE,
  processed_count INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to messages table for ManyChat integration
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS external_message_id TEXT,
ADD COLUMN IF NOT EXISTS from_role TEXT DEFAULT 'contact',
ADD COLUMN IF NOT EXISTS has_image BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_audio BOOLEAN DEFAULT FALSE;

-- Add notify_preferences column to directors table
ALTER TABLE public.directors 
ADD COLUMN IF NOT EXISTS notify_preferences JSONB DEFAULT '{
  "min_severity": "medium",
  "channels": ["whatsapp"],
  "quiet_hours": null
}'::jsonb;

-- Create unique index on messages external_message_id for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_external_message_id_unique 
ON public.messages(external_message_id) 
WHERE external_message_id IS NOT NULL;

-- Create index on messages external_message_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_external_message_id 
ON public.messages(external_message_id);

-- Create unique index on conversations external_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_external_id_unique 
ON public.conversations(external_id) 
WHERE external_id IS NOT NULL;

-- Create index on sync_runs for performance
CREATE INDEX IF NOT EXISTS idx_sync_runs_started_at 
ON public.sync_runs(started_at DESC);

-- Add comments
COMMENT ON TABLE public.sync_runs IS 'Tracks ManyChat pull-sync operations for monitoring and debugging';
COMMENT ON COLUMN public.directors.notify_preferences IS 'Notification preferences for directors: min_severity, channels, quiet_hours';
COMMENT ON COLUMN public.messages.external_message_id IS 'External message ID from ManyChat for idempotency';
COMMENT ON COLUMN public.messages.from_role IS 'Role of message sender: contact or attendant';
COMMENT ON COLUMN public.messages.has_image IS 'Whether message contains image attachments';
COMMENT ON COLUMN public.messages.has_audio IS 'Whether message contains audio attachments';