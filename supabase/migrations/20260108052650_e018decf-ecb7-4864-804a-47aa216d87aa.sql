-- ============================================
-- SISTEMA DE GERAÇÃO AUTOMÁTICA DE TAREFAS (SIMPLIFICADO)
-- ============================================

-- Criar tabela de regras de geração de tarefas
CREATE TABLE IF NOT EXISTS tarefa_regras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  tabela_origem TEXT NOT NULL,
  evento TEXT NOT NULL,
  prioridade TEXT DEFAULT 'Média',
  template_titulo TEXT NOT NULL,
  template_descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de tarefas geradas automaticamente
CREATE TABLE IF NOT EXISTS tarefas_geradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regra_id UUID REFERENCES tarefa_regras(id),
  origem TEXT NOT NULL,
  origem_id UUID,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade TEXT DEFAULT 'Média',
  status TEXT DEFAULT 'aberta',
  responsavel_id UUID,
  cliente_id UUID,
  prazo TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tarefas_geradas_origem ON tarefas_geradas(origem, origem_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_geradas_status ON tarefas_geradas(status);

-- RLS
ALTER TABLE tarefa_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas_geradas ENABLE ROW LEVEL SECURITY;

-- Políticas simples
CREATE POLICY "Regras visíveis" ON tarefa_regras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tarefas visíveis" ON tarefas_geradas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Criar tarefas" ON tarefas_geradas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Atualizar tarefas" ON tarefas_geradas FOR UPDATE TO authenticated USING (true);

-- Inserir regras padrão
INSERT INTO tarefa_regras (nome, descricao, tabela_origem, evento, prioridade, template_titulo, template_descricao) VALUES
('Proposta Aceita', 'Criar venda quando proposta aceita', 'proposals', 'UPDATE', 'Alta', 'Criar venda para proposta', 'Proposta aceita. Iniciar processo comercial.'),
('Venda Ganha', 'Gerar contrato quando venda fechada', 'vendas', 'INSERT', 'Alta', 'Gerar contrato', 'Venda concluída. Gerar contrato.'),
('Novo Lead', 'Follow-up de novo contato', 'contacts', 'INSERT', 'Média', 'Follow-up: Novo lead', 'Fazer primeiro contato.')
ON CONFLICT DO NOTHING;