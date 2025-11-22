-- Deletar tudo e recomeçar
DROP TABLE IF EXISTS agent_knowledge CASCADE;
DROP TABLE IF EXISTS agent_sections CASCADE;
DROP TABLE IF EXISTS agent_knowledge_items CASCADE;

-- Criar tabelas novas
CREATE TABLE agent_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  section_number INTEGER NOT NULL CHECK (section_number BETWEEN 1 AND 3),
  section_title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, section_number)
);

CREATE TABLE agent_knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'pdf', 'link')),
  content TEXT NOT NULL,
  instruction TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE agent_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_knowledge_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read sections" ON agent_sections FOR SELECT USING (true);
CREATE POLICY "Auth manage sections" ON agent_sections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public read items" ON agent_knowledge_items FOR SELECT USING (true);
CREATE POLICY "Auth manage items" ON agent_knowledge_items FOR ALL USING (auth.role() = 'authenticated');

-- Dados da Sofia
INSERT INTO agent_sections (agent_id, section_number, section_title, content) VALUES
('sofia', 1, 'Identidade & Papel do Agente', '# IDENTIDADE & PAPEL
Sofia - Consultora comercial de mídia OOH
Público: Leads e clientes de painéis digitais
Tom: Consultivo, empático, profissional'),
('sofia', 2, 'Contexto Operacional & Capacidades', '# OPERACIONAL
Domina: Mídia OOH, painéis, qualificação de leads
Funcionalidades: Responder dúvidas, qualificar, encaminhar
Estrutura: Mensagens curtas, uma pergunta por vez'),
('sofia', 3, 'Limites & Segurança', '# LIMITES
Não pode: Inventar preços, criar ofertas, agendar reuniões
Emojis: Apenas se cliente usar primeiro
Encaminhar: Eduardo quando necessário');