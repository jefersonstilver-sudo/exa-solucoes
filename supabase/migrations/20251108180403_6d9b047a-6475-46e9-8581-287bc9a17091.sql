-- ========================================
-- TABELA DE PERMISSÕES CUSTOMIZADAS POR USUÁRIO
-- ========================================
-- Apenas super_admin pode editar permissões customizadas
-- Permissões customizadas sobrescrevem as permissões padrão do role

CREATE TABLE IF NOT EXISTS public.user_custom_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT, -- Notas sobre por que as permissões foram alteradas
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Index para busca rápida por usuário
CREATE INDEX idx_user_custom_permissions_user_id ON public.user_custom_permissions(user_id);

-- Habilitar RLS
ALTER TABLE public.user_custom_permissions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS RLS
-- ========================================

-- Super admins podem visualizar todas as permissões customizadas
CREATE POLICY "Super admins can view all custom permissions"
ON public.user_custom_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Super admins podem inserir permissões customizadas
CREATE POLICY "Super admins can insert custom permissions"
ON public.user_custom_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Super admins podem atualizar permissões customizadas
CREATE POLICY "Super admins can update custom permissions"
ON public.user_custom_permissions
FOR UPDATE
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

-- Super admins podem deletar permissões customizadas
CREATE POLICY "Super admins can delete custom permissions"
ON public.user_custom_permissions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- ========================================
-- FUNÇÃO PARA ATUALIZAR updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_user_custom_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar automaticamente updated_at e updated_by
CREATE TRIGGER trigger_update_user_custom_permissions_updated_at
  BEFORE UPDATE ON public.user_custom_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_custom_permissions_updated_at();

-- ========================================
-- LOG DE MUDANÇAS DE PERMISSÕES
-- ========================================

CREATE TABLE IF NOT EXISTS public.permission_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  old_permissions JSONB,
  new_permissions JSONB NOT NULL,
  change_reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para auditoria
CREATE INDEX idx_permission_change_logs_user_id ON public.permission_change_logs(user_id);
CREATE INDEX idx_permission_change_logs_changed_by ON public.permission_change_logs(changed_by);
CREATE INDEX idx_permission_change_logs_created_at ON public.permission_change_logs(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.permission_change_logs ENABLE ROW LEVEL SECURITY;

-- Super admins podem ver todos os logs
CREATE POLICY "Super admins can view permission change logs"
ON public.permission_change_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Sistema pode inserir logs (será feito via trigger ou função)
CREATE POLICY "System can insert permission change logs"
ON public.permission_change_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ========================================
-- COMENTÁRIOS
-- ========================================

COMMENT ON TABLE public.user_custom_permissions IS 'Permissões customizadas por usuário que sobrescrevem as permissões padrão do role';
COMMENT ON TABLE public.permission_change_logs IS 'Log de auditoria de todas as mudanças de permissões customizadas';