-- Corrigir inserção na role_permissions com todos os campos obrigatórios
INSERT INTO role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled)
SELECT DISTINCT role_key, 'agenda', 'Agenda', 'Gestão Principal', true
FROM role_permissions
WHERE role_key IN ('super_admin', 'admin', 'admin_marketing', 'admin_financeiro')
ON CONFLICT (role_key, permission_key) DO NOTHING;