-- Add is_read column to zapi_logs for tracking read status
ALTER TABLE zapi_logs ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE zapi_logs ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Create index for performance on unread messages
CREATE INDEX IF NOT EXISTS idx_zapi_logs_unread ON zapi_logs(phone_number, agent_key, is_read);
CREATE INDEX IF NOT EXISTS idx_zapi_logs_phone_agent ON zapi_logs(phone_number, agent_key, created_at DESC);

-- Create conversation_notes table for internal notes
CREATE TABLE IF NOT EXISTS conversation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  agent_key TEXT NOT NULL,
  note_text TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for notes lookup
CREATE INDEX IF NOT EXISTS idx_conversation_notes_phone ON conversation_notes(phone_number, agent_key, created_at DESC);

-- Enable RLS on conversation_notes
ALTER TABLE conversation_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all notes
CREATE POLICY "Users can view conversation notes" ON conversation_notes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Users can create notes
CREATE POLICY "Users can create conversation notes" ON conversation_notes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own notes
CREATE POLICY "Users can update own conversation notes" ON conversation_notes
  FOR UPDATE USING (auth.uid() = created_by);

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete own conversation notes" ON conversation_notes
  FOR DELETE USING (auth.uid() = created_by);

-- Create conversation_tags table
CREATE TABLE IF NOT EXISTS conversation_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on conversation_tags
ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view tags
CREATE POLICY "Users can view conversation tags" ON conversation_tags
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can create tags
CREATE POLICY "Users can create conversation tags" ON conversation_tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create conversation_tag_assignments table
CREATE TABLE IF NOT EXISTS conversation_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  agent_key TEXT NOT NULL,
  tag_id UUID REFERENCES conversation_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phone_number, agent_key, tag_id)
);

-- Create index for tag assignments
CREATE INDEX IF NOT EXISTS idx_conversation_tag_assignments_phone ON conversation_tag_assignments(phone_number, agent_key);

-- Enable RLS on conversation_tag_assignments
ALTER TABLE conversation_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tag assignments
CREATE POLICY "Users can view conversation tag assignments" ON conversation_tag_assignments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Users can create tag assignments
CREATE POLICY "Users can create conversation tag assignments" ON conversation_tag_assignments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can delete tag assignments
CREATE POLICY "Users can delete conversation tag assignments" ON conversation_tag_assignments
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insert some default tags
INSERT INTO conversation_tags (name, color) VALUES
  ('Lead Quente', '#EF4444'),
  ('Cliente VIP', '#8B5CF6'),
  ('Follow-up', '#F59E0B'),
  ('Suporte', '#3B82F6'),
  ('Interessado', '#10B981'),
  ('Arquivado', '#6B7280')
ON CONFLICT (name) DO NOTHING;