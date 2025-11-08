-- Dropar tabela existente se houver (CASCADE para remover policies e triggers)
DROP TABLE IF EXISTS public.user_custom_permissions CASCADE;

-- Criar tabela de permissões customizadas de usuários
CREATE TABLE public.user_custom_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Permissões de Dashboard
  can_view_dashboard BOOLEAN DEFAULT false,
  can_view_orders BOOLEAN DEFAULT false,
  can_view_crm BOOLEAN DEFAULT false,
  can_view_approvals BOOLEAN DEFAULT false,
  
  -- Permissões de Leads
  can_view_leads BOOLEAN DEFAULT false,
  
  -- Permissões de Sistema
  can_manage_users BOOLEAN DEFAULT false,
  can_manage_coupons BOOLEAN DEFAULT false,
  can_view_audit BOOLEAN DEFAULT false,
  
  -- Permissões de Conteúdo
  can_manage_videos BOOLEAN DEFAULT false,
  can_manage_portfolio BOOLEAN DEFAULT false,
  
  -- Permissões Financeiras
  can_manage_provider_benefits BOOLEAN DEFAULT false,
  can_view_financial_reports BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_custom_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins podem gerenciar todas as permissões customizadas
CREATE POLICY "Super admins can manage all custom permissions"
ON public.user_custom_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Policy: Admins podem gerenciar permissões (exceto de super_admins e outros admins)
CREATE POLICY "Admins can manage custom permissions"
ON public.user_custom_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'admin_marketing', 'admin_financeiro')
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = user_custom_permissions.user_id
    AND users.role IN ('super_admin', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'admin_marketing', 'admin_financeiro')
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = user_custom_permissions.user_id
    AND users.role IN ('super_admin', 'admin')
  )
);

-- Policy: Usuários podem visualizar suas próprias permissões
CREATE POLICY "Users can view own custom permissions"
ON public.user_custom_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Criar índice para performance
CREATE INDEX idx_user_custom_permissions_user_id 
ON public.user_custom_permissions(user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.trigger_update_user_custom_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_user_custom_permissions_updated_at
  BEFORE UPDATE ON public.user_custom_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_user_custom_permissions_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.user_custom_permissions IS 'Permissões granulares customizadas por usuário, sobrescrevem permissões de role';
COMMENT ON COLUMN public.user_custom_permissions.user_id IS 'Referência ao usuário (auth.users)';
COMMENT ON COLUMN public.user_custom_permissions.can_view_dashboard IS 'Permissão para visualizar dashboard principal';
COMMENT ON COLUMN public.user_custom_permissions.can_manage_users IS 'Permissão para gerenciar usuários do sistema';