
-- Insert department-specific permissions (ON CONFLICT with new unique index)
-- Comercial
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled, departamento_id) VALUES 
  ('admin', 'crm_hub', 'CRM Hub', 'comercial', true, '8caa1ce0-724d-48dc-af94-6ac7719fab87'),
  ('admin', 'contatos', 'Contatos', 'comercial', true, '8caa1ce0-724d-48dc-af94-6ac7719fab87'),
  ('admin', 'contatos_kanban', 'Kanban', 'comercial', true, '8caa1ce0-724d-48dc-af94-6ac7719fab87'),
  ('admin', 'propostas', 'Propostas', 'comercial', true, '8caa1ce0-724d-48dc-af94-6ac7719fab87'),
  ('admin', 'pedidos', 'Pedidos', 'comercial', true, '8caa1ce0-724d-48dc-af94-6ac7719fab87'),
  ('admin', 'juridico', 'Jurídico', 'comercial', true, '8caa1ce0-724d-48dc-af94-6ac7719fab87'),
  ('admin', 'vendas', 'Vendas', 'comercial', true, '8caa1ce0-724d-48dc-af94-6ac7719fab87'),
  ('admin', 'posicoes', 'Posições', 'comercial', true, '8caa1ce0-724d-48dc-af94-6ac7719fab87'),
  ('admin', 'minha_manha', 'Minha Manhã', 'comercial', true, '8caa1ce0-724d-48dc-af94-6ac7719fab87'),
  ('admin', 'exa_alerts', 'EXA Alerts', 'comercial', true, '8caa1ce0-724d-48dc-af94-6ac7719fab87'),
  ('admin', 'assinaturas', 'Assinaturas', 'comercial', true, '8caa1ce0-724d-48dc-af94-6ac7719fab87')
ON CONFLICT DO NOTHING;

-- Administrativo
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled, departamento_id) VALUES 
  ('admin', 'predios', 'Prédios', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'paineis', 'Painéis', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'agenda', 'Agenda', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'beneficios', 'Benefícios', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'processos', 'Processos', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'aprovacoes', 'Aprovações', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'sync_notion', 'Sync Notion', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'videos_anunciantes', 'Vídeos', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'sindicos', 'Síndicos', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'leads', 'Leads', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'usuarios', 'Usuários', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'notificacoes', 'Notificações', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'minha_manha', 'Minha Manhã', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'exa_alerts', 'EXA Alerts', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'dashboard', 'Dashboard', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae'),
  ('admin', 'gestao_tempo', 'Gestão de Tempo', 'administrativo', true, '5d4bb166-c77f-4327-b0ac-7911b97a45ae')
ON CONFLICT DO NOTHING;

-- Marketing
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled, departamento_id) VALUES 
  ('admin', 'ticker', 'Ticker', 'marketing', true, 'a3f4ea0c-0316-468f-b158-b484e0b05abe'),
  ('admin', 'videos_site', 'Vídeos Site', 'marketing', true, 'a3f4ea0c-0316-468f-b158-b484e0b05abe'),
  ('admin', 'editor_videos', 'Editor Vídeos', 'marketing', true, 'a3f4ea0c-0316-468f-b158-b484e0b05abe'),
  ('admin', 'emails', 'Emails', 'marketing', true, 'a3f4ea0c-0316-468f-b158-b484e0b05abe'),
  ('admin', 'homepage_config', 'Homepage', 'marketing', true, 'a3f4ea0c-0316-468f-b158-b484e0b05abe'),
  ('admin', 'logos', 'Logos', 'marketing', true, 'a3f4ea0c-0316-468f-b158-b484e0b05abe'),
  ('admin', 'minha_manha', 'Minha Manhã', 'marketing', true, 'a3f4ea0c-0316-468f-b158-b484e0b05abe'),
  ('admin', 'exa_alerts', 'EXA Alerts', 'marketing', true, 'a3f4ea0c-0316-468f-b158-b484e0b05abe')
ON CONFLICT DO NOTHING;

-- Financeiro
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled, departamento_id) VALUES 
  ('admin', 'financeiro', 'Financeiro', 'financeiro', true, '98f1caa0-fc64-4d05-b601-03d3d530d6a9'),
  ('admin', 'financeiro_mp', 'Financeiro MP', 'financeiro', true, '98f1caa0-fc64-4d05-b601-03d3d530d6a9'),
  ('admin', 'relatorios', 'Relatórios', 'financeiro', true, '98f1caa0-fc64-4d05-b601-03d3d530d6a9'),
  ('admin', 'assinaturas', 'Assinaturas', 'financeiro', true, '98f1caa0-fc64-4d05-b601-03d3d530d6a9'),
  ('admin', 'cupons', 'Cupons', 'financeiro', true, '98f1caa0-fc64-4d05-b601-03d3d530d6a9'),
  ('admin', 'pedidos', 'Pedidos', 'financeiro', true, '98f1caa0-fc64-4d05-b601-03d3d530d6a9'),
  ('admin', 'minha_manha', 'Minha Manhã', 'financeiro', true, '98f1caa0-fc64-4d05-b601-03d3d530d6a9'),
  ('admin', 'exa_alerts', 'EXA Alerts', 'financeiro', true, '98f1caa0-fc64-4d05-b601-03d3d530d6a9')
ON CONFLICT DO NOTHING;

-- Tecnologia
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled, departamento_id) VALUES 
  ('admin', 'configuracoes', 'Configurações', 'tecnologia', true, '2e5cae63-a515-4e0b-8d5f-04d99c0c3305'),
  ('admin', 'seguranca', 'Segurança', 'tecnologia', true, '2e5cae63-a515-4e0b-8d5f-04d99c0c3305'),
  ('admin', 'minha_manha', 'Minha Manhã', 'tecnologia', true, '2e5cae63-a515-4e0b-8d5f-04d99c0c3305'),
  ('admin', 'exa_alerts', 'EXA Alerts', 'tecnologia', true, '2e5cae63-a515-4e0b-8d5f-04d99c0c3305'),
  ('admin', 'usuarios', 'Usuários', 'tecnologia', true, '2e5cae63-a515-4e0b-8d5f-04d99c0c3305'),
  ('admin', 'agentes_sofia', 'Agentes Sofia', 'tecnologia', true, '2e5cae63-a515-4e0b-8d5f-04d99c0c3305'),
  ('admin', 'predios', 'Prédios', 'tecnologia', true, '2e5cae63-a515-4e0b-8d5f-04d99c0c3305'),
  ('admin', 'paineis', 'Painéis', 'tecnologia', true, '2e5cae63-a515-4e0b-8d5f-04d99c0c3305')
ON CONFLICT DO NOTHING;
