-- =====================================================
-- FASE 3 - CRIAÇÃO DOS ENUMs FALTANTES (com verificação)
-- =====================================================

DO $$ 
BEGIN
  -- aporte_tipo
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aporte_tipo') THEN
    CREATE TYPE public.aporte_tipo AS ENUM ('dinheiro', 'bem', 'servico');
  END IF;
  
  -- caixa_tipo
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'caixa_tipo') THEN
    CREATE TYPE public.caixa_tipo AS ENUM ('entrada', 'saida', 'aporte', 'ajuste');
  END IF;
  
  -- caixa_origem
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'caixa_origem') THEN
    CREATE TYPE public.caixa_origem AS ENUM ('caixa_fisico', 'asaas', 'manual');
  END IF;
  
  -- investimento_tipo
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'investimento_tipo') THEN
    CREATE TYPE public.investimento_tipo AS ENUM ('capex', 'opex', 'manutencao', 'expansao');
  END IF;
  
  -- investimento_status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'investimento_status') THEN
    CREATE TYPE public.investimento_status AS ENUM ('planejado', 'em_execucao', 'concluido', 'cancelado');
  END IF;
  
  -- categoria_tipo
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_tipo') THEN
    CREATE TYPE public.categoria_tipo AS ENUM ('receita', 'despesa', 'investimento');
  END IF;
END $$;