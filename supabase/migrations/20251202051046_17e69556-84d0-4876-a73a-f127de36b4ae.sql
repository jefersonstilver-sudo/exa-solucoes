-- Allow anyone to view agents (read-only for anonymous)
CREATE POLICY "Allow public read access to agents" 
ON public.agents 
FOR SELECT 
USING (true);

-- Allow anyone to view agent_sections
CREATE POLICY "Allow public read access to agent_sections" 
ON public.agent_sections 
FOR SELECT 
USING (true);

-- Allow anyone to view agent_knowledge_items  
CREATE POLICY "Allow public read access to agent_knowledge_items" 
ON public.agent_knowledge_items 
FOR SELECT 
USING (true);