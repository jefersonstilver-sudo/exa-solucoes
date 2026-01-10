-- =====================================================
-- FASE 3: CRIAÇÃO DE ENUMS FINANCEIROS
-- =====================================================

-- Tipo de fornecedor
DO $$ BEGIN
    CREATE TYPE fornecedor_tipo AS ENUM ('servico', 'produto', 'ambos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Status de contrato
DO $$ BEGIN
    CREATE TYPE contrato_status AS ENUM ('ativo', 'pausado', 'encerrado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de despesa no contrato
DO $$ BEGIN
    CREATE TYPE tipo_despesa AS ENUM ('fixa', 'variavel');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de investimento
DO $$ BEGIN
    CREATE TYPE investimento_tipo AS ENUM ('capex', 'marketing', 'tecnologia', 'infraestrutura', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Status de investimento
DO $$ BEGIN
    CREATE TYPE investimento_status AS ENUM ('planejado', 'em_execucao', 'concluido', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de aporte
DO $$ BEGIN
    CREATE TYPE aporte_tipo AS ENUM ('capital', 'emprestimo', 'reinvestimento');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de movimentação de caixa
DO $$ BEGIN
    CREATE TYPE caixa_tipo AS ENUM ('entrada', 'saida');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Origem da movimentação de caixa
DO $$ BEGIN
    CREATE TYPE caixa_origem AS ENUM ('dinheiro', 'cheque', 'vale', 'ajuste', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de categoria (atualizado)
DO $$ BEGIN
    CREATE TYPE categoria_tipo AS ENUM ('fixa', 'variavel', 'ambos', 'investimento');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;