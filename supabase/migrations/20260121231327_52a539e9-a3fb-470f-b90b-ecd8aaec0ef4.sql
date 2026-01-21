-- ========================================
-- FASE 1: Atualizar permissões CRM no banco
-- ========================================

-- 1.1 Revogar CRM de admin (coordenação) - eles não devem acessar
UPDATE role_permissions 
SET is_enabled = false 
WHERE role_key = 'admin' AND permission_key IN ('crm_site', 'crm_chat');

-- 1.2 Revogar CRM de admin_financeiro (já está false, garantindo)
UPDATE role_permissions 
SET is_enabled = false 
WHERE role_key = 'admin_financeiro' AND permission_key IN ('crm_site', 'crm_chat');

-- 1.3 Manter comercial com acesso (conversas próprias - filtrado no frontend/RLS)
-- Já está true, mantendo

-- 1.4 Manter super_admin (CEO) com acesso total
-- Já está true, mantendo

-- ========================================
-- FASE 2: Adicionar coluna de responsável em conversations
-- ========================================

-- Adicionar coluna assigned_user_id para vincular conversa a um usuário comercial
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES auth.users(id);

-- Criar index para performance
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_user_id 
ON conversations(assigned_user_id);

-- ========================================
-- FASE 3: Popular assigned_user_id baseado no contact_id
-- ========================================

-- Atualizar conversas existentes com o responsavel_id do contato vinculado
UPDATE conversations c
SET assigned_user_id = ct.responsavel_id
FROM contacts ct
WHERE c.contact_id = ct.id
  AND ct.responsavel_id IS NOT NULL
  AND c.assigned_user_id IS NULL;

-- ========================================
-- FASE 4: Criar RLS para tabela conversations
-- ========================================

-- Habilitar RLS se não estiver
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "crm_ceo_full_access" ON conversations;
DROP POLICY IF EXISTS "crm_comercial_own_conversations" ON conversations;
DROP POLICY IF EXISTS "crm_authenticated_select" ON conversations;

-- Policy 1: CEO (super_admin) vê tudo
CREATE POLICY "crm_ceo_full_access" ON conversations
FOR ALL TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
);

-- Policy 2: Comercial vê apenas conversas atribuídas a ele
CREATE POLICY "crm_comercial_own_conversations" ON conversations
FOR ALL TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'comercial'
  AND assigned_user_id = auth.uid()
);

-- ========================================
-- FASE 5: RLS para tabela messages (mensagens das conversas)
-- ========================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_ceo_full_access" ON messages;
DROP POLICY IF EXISTS "messages_comercial_own_conversations" ON messages;

-- CEO vê todas as mensagens
CREATE POLICY "messages_ceo_full_access" ON messages
FOR ALL TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
);

-- Comercial vê mensagens apenas de suas conversas
CREATE POLICY "messages_comercial_own_conversations" ON messages
FOR ALL TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'comercial'
  AND conversation_id IN (
    SELECT id FROM conversations WHERE assigned_user_id = auth.uid()
  )
);