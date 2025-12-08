-- Add new fields to buildings table for complete Notion sync
ALTER TABLE public.buildings 
ADD COLUMN IF NOT EXISTS notion_email TEXT,
ADD COLUMN IF NOT EXISTS notion_internet TEXT,
ADD COLUMN IF NOT EXISTS notion_termo_aceite JSONB,
ADD COLUMN IF NOT EXISTS notion_instalado DATE,
ADD COLUMN IF NOT EXISTS notion_data_trabalho DATE,
ADD COLUMN IF NOT EXISTS contato_sindico_telefone TEXT;

-- Create table for user column visibility preferences
CREATE TABLE IF NOT EXISTS public.building_column_visibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  column_key TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, column_key)
);

-- Enable RLS
ALTER TABLE public.building_column_visibility ENABLE ROW LEVEL SECURITY;

-- Create policies for column visibility
CREATE POLICY "Users can view their own column visibility"
ON public.building_column_visibility
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own column visibility"
ON public.building_column_visibility
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own column visibility"
ON public.building_column_visibility
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own column visibility"
ON public.building_column_visibility
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_building_column_visibility_updated_at
  BEFORE UPDATE ON public.building_column_visibility
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_building_column_visibility_user_id 
ON public.building_column_visibility(user_id);