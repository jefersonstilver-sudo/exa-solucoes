-- Adicionar UNIQUE INDEX na tabela agent_context para lock atômico
CREATE UNIQUE INDEX IF NOT EXISTS agent_context_key_unique 
ON agent_context(key);