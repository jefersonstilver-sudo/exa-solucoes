
-- Add departamento_id column to role_permissions for department-specific permissions
ALTER TABLE public.role_permissions 
ADD COLUMN IF NOT EXISTS departamento_id uuid REFERENCES public.process_departments(id) ON DELETE CASCADE;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_dept 
ON public.role_permissions(role_key, departamento_id);

-- Insert department-specific permissions for Comercial (admin role)
-- Only the modules the Comercial team needs
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled, departamento_id)
SELECT 'admin', unnest, unnest, 'comercial', true, '8caa1ce0-724d-48dc-af94-6ac7719fab87'
FROM unnest(ARRAY[
  'crm_hub', 'contatos', 'contatos_kanban', 'propostas', 'pedidos', 
  'juridico', 'vendas', 'posicoes', 'minha_manha', 'exa_alerts'
])
ON CONFLICT DO NOTHING;

-- Insert department-specific permissions for Marketing (admin role)
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled, departamento_id)
SELECT 'admin', unnest, unnest, 'marketing', true, 'a3f4ea0c-0316-468f-b158-b484e0b05abe'
FROM unnest(ARRAY[
  'ticker', 'videos_site', 'editor_videos', 'emails', 'homepage_config', 
  'logos', 'minha_manha', 'exa_alerts'
])
ON CONFLICT DO NOTHING;

-- Insert department-specific permissions for Financeiro (admin role)
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled, departamento_id)
SELECT 'admin', unnest, unnest, 'financeiro', true, '98f1caa0-fc64-4d05-b601-03d3d530d6a9'
FROM unnest(ARRAY[
  'financeiro', 'financeiro_mp', 'relatorios', 'assinaturas', 'cupons',
  'minha_manha', 'exa_alerts', 'pedidos'
])
ON CONFLICT DO NOTHING;

-- Insert department-specific permissions for Operação/Administrativo (admin role)
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled, departamento_id)
SELECT 'admin', unnest, unnest, 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'
FROM unnest(ARRAY[
  'predios', 'paineis', 'agenda', 'beneficios', 'processos', 'aprovacoes',
  'sync_notion', 'videos_anunciantes', 'sindicos', 'leads', 'usuarios',
  'notificacoes', 'minha_manha', 'exa_alerts', 'gestao_tempo'
])
ON CONFLICT DO NOTHING;

-- Insert department-specific permissions for Tecnologia (admin role)
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled, departamento_id)
SELECT 'admin', unnest, unnest, 'tecnologia', true, '2e5cae63-a515-4e0b-8d5f-04d3d530d6a9'
FROM unnest(ARRAY[
  'configuracoes', 'seguranca', 'minha_manha', 'exa_alerts', 'usuarios',
  'agentes_sofia', 'predios', 'paineis'
])
ON CONFLICT DO NOTHING;
