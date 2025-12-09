-- Adicionar permissão can_make_orders para todos os tipos de conta
-- Esta permissão controla se o tipo de conta pode fazer pedidos/compras

-- Verificar se a permissão já existe e adicionar para cada role_type
DO $$
DECLARE
  role_record RECORD;
BEGIN
  FOR role_record IN SELECT key FROM role_types
  LOOP
    -- Inserir apenas se não existir
    INSERT INTO role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled)
    SELECT 
      role_record.key,
      'can_make_orders',
      'Pode Fazer Pedidos',
      'Sistema',
      CASE WHEN role_record.key = 'client' THEN true ELSE false END
    WHERE NOT EXISTS (
      SELECT 1 FROM role_permissions 
      WHERE role_key = role_record.key AND permission_key = 'can_make_orders'
    );
  END LOOP;
END $$;

-- Garantir que client pode fazer pedidos e admins não podem
UPDATE role_permissions 
SET is_enabled = true 
WHERE permission_key = 'can_make_orders' AND role_key = 'client';

UPDATE role_permissions 
SET is_enabled = false 
WHERE permission_key = 'can_make_orders' AND role_key IN ('super_admin', 'admin', 'admin_marketing', 'admin_financeiro', 'painel');