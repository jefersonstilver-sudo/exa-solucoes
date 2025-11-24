
-- Remover constraint que limita section_number a 1-3
ALTER TABLE agent_sections DROP CONSTRAINT IF EXISTS agent_sections_section_number_check;

-- Adicionar nova constraint permitindo até 10 seções
ALTER TABLE agent_sections ADD CONSTRAINT agent_sections_section_number_check 
CHECK (section_number >= 1 AND section_number <= 10);

-- Criar Seção 4 - Base de Conhecimento & Documentos para a Sofia
INSERT INTO agent_sections (
  agent_id,
  section_number,
  section_title,
  content
) VALUES (
  'sofia',
  4,
  'Base de Conhecimento & Documentos',
  '## QUANDO USAR CADA DOCUMENTO

**Perguntas sobre a empresa:**
- Use "EXA Institucional" (versão resumida: 2.6KB)
- Para detalhes completos: "Institucional completo" (12.3KB)
- CNPJ, endereço, missão, história da empresa

**Perguntas sobre cupons/descontos:**
- Use "Cupons Vigentes" (sempre atualizado)
- Tabela oficial de descontos por quantidade de painéis
- NUNCA invente valores de desconto

**Perguntas de síndicos:**
- Use "Atendimento a Síndicos"
- Instalação, regras, coleta de dados
- Processo de instalação e aprovação

**Perguntas sobre como anunciar:**
- Use "Manual do Anunciante"
- Processo de compra, valores, exibições
- Como funciona a plataforma

**Apresentação de prédios:**
- Use "Template WhatsApp - Apresentação de Prédios"
- Formato OBRIGATÓRIO para listas de prédios
- SEMPRE usar dados reais do banco (ferramenta consultar_predios)

**Material para enviar:**
- Mídia Kit: Link do Google Drive disponível nos knowledge items
- Vídeo Institucional: Link do Google Drive disponível nos knowledge items

**Tom e estilo:**
- Sempre consultar "Engajamento Humanizado da Sofia"
- WhatsApp, emojis moderados, linguagem clara e acessível
- Responder de forma natural e integrada

**IMPORTANTE:** 
- SEMPRE verificar dados reais no banco de dados usando a ferramenta consultar_predios
- NUNCA inventar preços, visualizações ou informações sobre prédios
- Usar cupons apenas da tabela oficial de "Cupons Vigentes"
- Quando mencionar prédios específicos, SEMPRE consultar o banco primeiro
'
)
ON CONFLICT (agent_id, section_number) 
DO UPDATE SET 
  content = EXCLUDED.content,
  updated_at = NOW();

-- Criar tabela de métricas de performance dos agentes
CREATE TABLE IF NOT EXISTS agent_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER,
  tokens_used INTEGER,
  error_code TEXT,
  model TEXT,
  metadata JSONB
);

-- Criar índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_metrics_agent_time 
ON agent_performance_metrics(agent_key, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_type
ON agent_performance_metrics(metric_type, timestamp DESC);

-- Comentários para documentação
COMMENT ON TABLE agent_performance_metrics IS 'Métricas de performance dos agentes de IA para monitoramento e análise';
COMMENT ON COLUMN agent_performance_metrics.metric_type IS 'Tipo de métrica: success, error, rate_limit, timeout';
COMMENT ON COLUMN agent_performance_metrics.duration_ms IS 'Duração da requisição em milissegundos';
COMMENT ON COLUMN agent_performance_metrics.tokens_used IS 'Total de tokens usados pela OpenAI';
