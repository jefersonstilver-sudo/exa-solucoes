-- Adicionar o role admin_departamental à tabela role_types
INSERT INTO role_types (key, display_name, description, icon, color, is_active, is_system)
VALUES (
  'admin_departamental',
  'Admin Departamental',
  'Acesso restrito ao seu próprio departamento',
  'building-2',
  '#8B5CF6',
  true,
  true
)
ON CONFLICT (key) DO NOTHING;