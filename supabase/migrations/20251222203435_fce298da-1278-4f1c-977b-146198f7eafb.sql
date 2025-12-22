-- =====================================================
-- FIX: Adicionar roles dinâmicos ao enum app_role
-- Atualizar funções para validar contra role_types
-- =====================================================

-- 1. Adicionar novos valores ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'eletricista_';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'comercial';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sindico';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'porteiro';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tecnico';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operacional';