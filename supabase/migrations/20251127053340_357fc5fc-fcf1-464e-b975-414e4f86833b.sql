-- Create table to link conversations to buildings
CREATE TABLE IF NOT EXISTS public.conversation_buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, building_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_conversation_buildings_conversation_id 
ON public.conversation_buildings(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_buildings_building_id 
ON public.conversation_buildings(building_id);

-- Enable RLS
ALTER TABLE public.conversation_buildings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view buildings linked to conversations they can access
CREATE POLICY "Users can view conversation buildings"
ON public.conversation_buildings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = conversation_buildings.conversation_id
  )
);

-- Policy: Only admins can insert/update/delete conversation buildings
CREATE POLICY "Admins can manage conversation buildings"
ON public.conversation_buildings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_conversation_buildings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_buildings_updated_at
BEFORE UPDATE ON public.conversation_buildings
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_buildings_updated_at();