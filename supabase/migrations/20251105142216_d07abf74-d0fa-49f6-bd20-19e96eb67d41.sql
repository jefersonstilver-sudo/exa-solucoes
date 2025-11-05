-- ============================================
-- PARTE 1: ADICIONAR ROLE admin_financeiro AO ENUM
-- ============================================

-- Adicionar nova role ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_financeiro';

-- Comentário explicativo
COMMENT ON TYPE public.app_role IS 
'Roles do sistema: client, admin, admin_marketing, admin_financeiro, super_admin, painel';