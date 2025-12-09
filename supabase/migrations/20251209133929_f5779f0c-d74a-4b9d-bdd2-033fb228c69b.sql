-- Add dashboard_preferences column to users table for storing period filter preferences
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS dashboard_preferences JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.users.dashboard_preferences IS 'Stores user dashboard preferences like period filter and save_period flag';