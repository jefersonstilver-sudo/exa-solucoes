-- ================================================
-- FASE 1: Resolver alertas órfãos (dispositivos online com alertas não resolvidos)
-- ================================================

UPDATE panel_alerts 
SET resolved = true, 
    resolved_at = NOW()
WHERE resolved = false 
  AND device_id IN (
    SELECT id FROM devices WHERE status = 'online'
  );

-- ================================================
-- FASE 2: Criar sistema RBAC robusto - Tipos de Conta
-- ================================================

-- Enum para roles do sistema (se não existir, criar)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM (
      'super_admin', 
      'admin', 
      'admin_marketing', 
      'admin_financeiro',
      'comercial',
      'client', 
      'painel'
    );
  END IF;
END $$;

-- Tabela de tipos de conta/roles customizados
CREATE TABLE IF NOT EXISTS public.role_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT 'user',
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir tipos de conta padrão do sistema
INSERT INTO public.role_types (key, display_name, description, color, icon, is_system) VALUES
  ('super_admin', 'Super Admin', 'Acesso total ao sistema, pode gerenciar todos os módulos e configurações', '#9C1E1E', 'shield', true),
  ('admin', 'Admin Geral', 'Acesso administrativo completo, exceto configurações de sistema', '#3B82F6', 'settings', true),
  ('admin_marketing', 'Admin Marketing', 'Acesso a módulos de marketing, conteúdo e campanhas', '#8B5CF6', 'megaphone', true),
  ('admin_financeiro', 'Admin Financeiro', 'Acesso a relatórios financeiros, cobranças e pagamentos', '#10B981', 'wallet', true),
  ('comercial', 'Comercial', 'Acesso a propostas, leads e CRM comercial', '#F59E0B', 'briefcase', true),
  ('client', 'Cliente/Anunciante', 'Acesso à área do anunciante', '#6B7280', 'user', true),
  ('painel', 'Painel', 'Conta de dispositivo/painel', '#374151', 'monitor', true)
ON CONFLICT (key) DO NOTHING;

-- Tabela de permissões por role
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key TEXT NOT NULL REFERENCES public.role_types(key) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  permission_label TEXT NOT NULL,
  permission_group TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_key, permission_key)
);

-- Definir todas as permissões disponíveis baseadas no sidebar
-- GESTÃO PRINCIPAL
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled)
SELECT rt.key, p.permission_key, p.permission_label, p.permission_group, p.default_enabled
FROM public.role_types rt
CROSS JOIN (VALUES
  -- GESTÃO PRINCIPAL
  ('dashboard', 'Dashboard', 'Gestão Principal', true),
  ('pedidos', 'Pedidos', 'Gestão Principal', true),
  ('assinaturas', 'Assinaturas', 'Gestão Principal', true),
  ('aprovacoes', 'Aprovações', 'Gestão Principal', true),
  ('cupons', 'Cupons', 'Gestão Principal', true),
  ('beneficios', 'Benefícios Prestadores', 'Gestão Principal', true),
  
  -- CRM
  ('crm_site', 'CRM Site', 'CRM', true),
  ('crm_chat', 'CRM Chat', 'CRM', true),
  ('escalacoes', 'Escalações', 'CRM', true),
  
  -- COMERCIAL
  ('propostas', 'Propostas', 'Comercial', true),
  ('leads', 'Leads & Clientes', 'Comercial', true),
  
  -- JURÍDICO
  ('contratos', 'Contratos', 'Jurídico', true),
  
  -- INTELIGÊNCIA
  ('agentes_sofia', 'Agentes Sofia', 'Inteligência', true),
  ('exa_alerts', 'EXA Alerts', 'Inteligência', true),
  
  -- ATIVOS
  ('predios', 'Prédios', 'Ativos', true),
  ('paineis', 'Painéis EXA', 'Ativos', true),
  
  -- CONTEÚDO
  ('videos_anunciantes', 'Vídeos Anunciantes', 'Conteúdo', true),
  ('videos_site', 'Vídeos Site EXA', 'Conteúdo', true),
  ('ticker', 'Ticker', 'Conteúdo', true),
  ('editor_videos', 'Editor Vídeos', 'Conteúdo', true),
  ('emails', 'Emails', 'Conteúdo', true),
  
  -- SISTEMA
  ('usuarios', 'Usuários', 'Sistema', true),
  ('notificacoes', 'Notificações', 'Sistema', true),
  ('relatorios', 'Relatórios Financeiros', 'Sistema', true),
  ('seguranca', 'Segurança', 'Sistema', true),
  ('configuracoes', 'Configurações', 'Sistema', true),
  ('tipos_conta', 'Tipos de Conta', 'Sistema', true)
) AS p(permission_key, permission_label, permission_group, default_enabled)
WHERE rt.key = 'super_admin'
ON CONFLICT (role_key, permission_key) DO NOTHING;

-- Configurar permissões padrão para cada role
-- Admin Geral: quase tudo exceto configurações de sistema críticas
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled)
SELECT 'admin', p.permission_key, p.permission_label, p.permission_group, 
  CASE WHEN p.permission_key IN ('seguranca', 'tipos_conta', 'configuracoes') THEN false ELSE true END
FROM public.role_permissions p
WHERE p.role_key = 'super_admin'
ON CONFLICT (role_key, permission_key) DO NOTHING;

-- Admin Marketing: marketing, conteúdo, campanhas
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled)
SELECT 'admin_marketing', p.permission_key, p.permission_label, p.permission_group,
  CASE WHEN p.permission_key IN ('dashboard', 'aprovacoes', 'videos_anunciantes', 'videos_site', 'ticker', 'editor_videos', 'emails', 'crm_site', 'crm_chat') THEN true ELSE false END
FROM public.role_permissions p
WHERE p.role_key = 'super_admin'
ON CONFLICT (role_key, permission_key) DO NOTHING;

-- Admin Financeiro: finanças, relatórios, cobranças
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled)
SELECT 'admin_financeiro', p.permission_key, p.permission_label, p.permission_group,
  CASE WHEN p.permission_key IN ('dashboard', 'pedidos', 'assinaturas', 'relatorios', 'cupons') THEN true ELSE false END
FROM public.role_permissions p
WHERE p.role_key = 'super_admin'
ON CONFLICT (role_key, permission_key) DO NOTHING;

-- Comercial: propostas, leads, CRM
INSERT INTO public.role_permissions (role_key, permission_key, permission_label, permission_group, is_enabled)
SELECT 'comercial', p.permission_key, p.permission_label, p.permission_group,
  CASE WHEN p.permission_key IN ('dashboard', 'propostas', 'leads', 'crm_site', 'crm_chat', 'escalacoes', 'predios') THEN true ELSE false END
FROM public.role_permissions p
WHERE p.role_key = 'super_admin'
ON CONFLICT (role_key, permission_key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.role_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Função segura para verificar role (SECURITY DEFINER para evitar recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;

-- Função para verificar permissão específica
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role::text = rp.role_key
    WHERE ur.user_id = _user_id
      AND rp.permission_key = _permission_key
      AND rp.is_enabled = true
  )
$$;

-- Políticas RLS para role_types
CREATE POLICY "Super admins can manage role types"
ON public.role_types
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view role types"
ON public.role_types
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Políticas RLS para role_permissions
CREATE POLICY "Super admins can manage role permissions"
ON public.role_permissions
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view role permissions"
ON public.role_permissions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_role_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_role_types_timestamp
BEFORE UPDATE ON public.role_types
FOR EACH ROW
EXECUTE FUNCTION update_role_types_updated_at();

CREATE TRIGGER update_role_permissions_timestamp
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION update_role_types_updated_at();