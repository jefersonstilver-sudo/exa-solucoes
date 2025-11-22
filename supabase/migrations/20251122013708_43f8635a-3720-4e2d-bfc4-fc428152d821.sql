-- ============================================
-- CORREÇÃO DA BASE DE CONHECIMENTO DA SOFIA
-- ============================================

-- 1. Corrigir seção PERFIL (identidade errada)
UPDATE agent_knowledge
SET content = REPLACE(content, 'especializada em mídia OOH digital', 'da EXA Mídia - empresa de publicidade inteligente')
WHERE agent_key = 'sofia' 
AND section = 'perfil';

UPDATE agent_knowledge
SET content = REPLACE(content, 'Mais de 50 prédios ativos', 'Consulte sempre os dados reais injetados automaticamente no contexto')
WHERE agent_key = 'sofia' 
AND section = 'perfil';

-- 2. Corrigir seção FAQ (números fictícios)
UPDATE agent_knowledge
SET content = REPLACE(
  content, 
  'Estamos na fase inicial com até 50 prédios. A loja mostra os que ja estão online no momento.',
  '✅ A quantidade exata de prédios está sempre atualizada nos dados reais injetados automaticamente. Posso consultar agora mesmo pra você!'
)
WHERE agent_key = 'sofia' 
AND section = 'faq';

-- 3. Adicionar regra sobre mensagens curtas
UPDATE agent_knowledge
SET content = content || E'\n\n🗣️ ESTILO DE COMUNICAÇÃO:\n- Nunca envie mensagens longas\n- Quebre suas respostas em frases curtas e naturais\n- Envie uma ideia por vez\n- Seja objetiva e humana'
WHERE agent_key = 'sofia' 
AND section = 'regras_basicas';

-- ============================================
-- CRIAR TABELAS PARA NOVOS RECURSOS
-- ============================================

-- Tabela para assuntos específicos (documentos/links/textos)
CREATE TABLE IF NOT EXISTS agent_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  type text NOT NULL CHECK (type IN ('documento', 'link', 'texto', 'pdf')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_topics_agent_key ON agent_topics(agent_key);
CREATE INDEX IF NOT EXISTS idx_agent_topics_keywords ON agent_topics USING GIN(keywords);

-- Tabela para log de modificações (rastreamento)
CREATE TABLE IF NOT EXISTS agent_modification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key text NOT NULL,
  section text NOT NULL,
  field_modified text NOT NULL,
  old_value text,
  new_value text,
  modified_by text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_mod_logs_agent_key ON agent_modification_logs(agent_key);
CREATE INDEX IF NOT EXISTS idx_agent_mod_logs_created_at ON agent_modification_logs(created_at DESC);

-- ============================================
-- REGISTRAR MODIFICAÇÕES NO LOG
-- ============================================

INSERT INTO agent_modification_logs (agent_key, section, field_modified, old_value, new_value, modified_by)
VALUES 
  ('sofia', 'perfil', 'identidade', 'especializada em mídia OOH digital', 'da EXA Mídia - empresa de publicidade inteligente', 'system'),
  ('sofia', 'perfil', 'quantidade_predios', 'Mais de 50 prédios ativos', 'Consulte sempre os dados reais injetados automaticamente', 'system'),
  ('sofia', 'faq', 'resposta_predios', 'Estamos na fase inicial com até 50 prédios', 'A quantidade exata está nos dados reais', 'system'),
  ('sofia', 'regras_basicas', 'estilo_comunicacao', NULL, 'Mensagens curtas e naturais, uma ideia por vez', 'system');