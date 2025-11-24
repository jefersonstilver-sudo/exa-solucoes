-- Tabela para tipos de contato customizáveis
CREATE TABLE contact_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  icon TEXT DEFAULT 'user',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir tipos padrão
INSERT INTO contact_types (name, label, color, icon, is_default) VALUES
  ('unknown', 'Desconhecido', '#6b7280', 'help-circle', true),
  ('sindico', 'Síndico', '#3b82f6', 'building', true),
  ('administrativo', 'Administrativo', '#8b5cf6', 'briefcase', true),
  ('cliente_potencial', 'Cliente Potencial', '#f59e0b', 'star', true),
  ('cliente_ativo', 'Cliente Ativo', '#10b981', 'check-circle', true),
  ('prestador_servico', 'Prestador de Serviço', '#ec4899', 'tool', true),
  ('parceiro', 'Parceiro', '#06b6d4', 'handshake', true),
  ('outro', 'Outro', '#64748b', 'user', true);

-- Enable RLS
ALTER TABLE contact_types ENABLE ROW LEVEL SECURITY;

-- Política para leitura (todos autenticados)
CREATE POLICY "contact_types_select" ON contact_types
  FOR SELECT TO authenticated USING (true);

-- Política para inserção (todos autenticados)
CREATE POLICY "contact_types_insert" ON contact_types
  FOR INSERT TO authenticated WITH CHECK (true);

-- Política para atualização (apenas tipos não-default)
CREATE POLICY "contact_types_update" ON contact_types
  FOR UPDATE TO authenticated USING (is_default = false);

-- Política para deleção (apenas tipos não-default)
CREATE POLICY "contact_types_delete" ON contact_types
  FOR DELETE TO authenticated USING (is_default = false);