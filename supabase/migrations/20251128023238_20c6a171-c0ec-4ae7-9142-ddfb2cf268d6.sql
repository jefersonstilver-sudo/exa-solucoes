-- Adicionar tipo de contato "outros" para contatos não identificados
INSERT INTO contact_types (name, label, color, icon, is_default)
VALUES ('outros', 'Outros', '#6B7280', 'User', false)
ON CONFLICT (name) DO NOTHING;