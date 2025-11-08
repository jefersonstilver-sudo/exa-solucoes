-- Migration: Limpeza completa do sistema - Fase 1
-- Remove tabelas desnecessárias: user_custom_permissions e leads_produtora

-- 1. Remover tabela de permissões customizadas
DROP TABLE IF EXISTS user_custom_permissions CASCADE;

-- 2. Remover tabela de leads da produtora
DROP TABLE IF EXISTS leads_produtora CASCADE;

-- 3. Comentário de auditoria
COMMENT ON DATABASE postgres IS 'Migration Fase 1: Removidas tabelas user_custom_permissions e leads_produtora - Sistema de limpeza completa executado';