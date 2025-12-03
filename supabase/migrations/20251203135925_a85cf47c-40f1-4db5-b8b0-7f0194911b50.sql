-- Create proposal_views table for tracking
CREATE TABLE IF NOT EXISTS public.proposal_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  time_spent_seconds INTEGER DEFAULT 0,
  device_type TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add tracking columns to proposals table
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_spent_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.proposal_views ENABLE ROW LEVEL SECURITY;

-- Public can insert views (for tracking)
CREATE POLICY "Anyone can insert proposal views"
ON public.proposal_views FOR INSERT
WITH CHECK (true);

-- Admins can view all proposal views
CREATE POLICY "Admins can view proposal views"
ON public.proposal_views FOR SELECT
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid() 
  AND users.role IN ('admin', 'super_admin')
));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_proposal_views_proposal_id ON public.proposal_views(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_views_viewed_at ON public.proposal_views(viewed_at DESC);