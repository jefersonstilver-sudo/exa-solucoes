-- Adicionar tipos de contato faltantes para unificar a base de dados
INSERT INTO contact_types (name, label, icon, color, is_default)
VALUES 
  ('cliente_potencial', 'Cliente Potencial', '💼', '#10B981', false),
  ('administrativo', 'Administrativo', '📋', '#6366F1', false)
ON CONFLICT (name) DO NOTHING;