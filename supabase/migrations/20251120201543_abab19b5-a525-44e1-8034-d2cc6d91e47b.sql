-- Drop old single-column unique constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_external_id_key;

-- Create new compound unique constraint
ALTER TABLE conversations 
ADD CONSTRAINT conversations_external_id_agent_key 
UNIQUE (external_id, agent_key);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_conversations_external_agent 
ON conversations(external_id, agent_key);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "service_role_manage_conversations" ON conversations;
DROP POLICY IF EXISTS "service_role_manage_messages" ON messages;

-- Ensure service_role can manage conversations
CREATE POLICY "service_role_manage_conversations"
ON conversations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure service_role can manage messages
CREATE POLICY "service_role_manage_messages"
ON messages FOR ALL
TO service_role
USING (true)
WITH CHECK (true);