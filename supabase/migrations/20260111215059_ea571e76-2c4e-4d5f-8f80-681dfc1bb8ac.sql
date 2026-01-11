-- =====================================================
-- FASE 1.1 - MIGRAÇÃO RH: Estrutura Base + Integração Financeira
-- =====================================================

-- 1. Criar enum para status do funcionário
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'funcionario_status') THEN
    CREATE TYPE funcionario_status AS ENUM ('ativo', 'ferias', 'suspenso', 'encerrado');
  END IF;
END $$;

-- 2. Adicionar novos campos na tabela funcionarios
ALTER TABLE public.funcionarios 
  ADD COLUMN IF NOT EXISTS status funcionario_status DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS centro_custo_id UUID REFERENCES public.centros_custo(id),
  ADD COLUMN IF NOT EXISTS periodicidade_pagamento TEXT DEFAULT 'mensal',
  ADD COLUMN IF NOT EXISTS nome_completo TEXT,
  ADD COLUMN IF NOT EXISTS despesa_fixa_id UUID REFERENCES public.despesas_fixas(id);

-- Preencher nome_completo a partir da tabela users para registros existentes
UPDATE public.funcionarios f
SET nome_completo = u.nome
FROM public.users u
WHERE f.user_id = u.id AND f.nome_completo IS NULL;

-- 3. Criar tabela de documentos de funcionários
CREATE TABLE IF NOT EXISTS public.funcionarios_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL, -- 'contrato', 'rg', 'cnh', 'cpf', 'comprovante_residencia', 'dados_bancarios', 'cnpj', 'contrato_social'
  nome_arquivo TEXT NOT NULL,
  arquivo_url TEXT NOT NULL,
  ocr_texto TEXT, -- Texto extraído por OCR para busca
  ocr_processado_em TIMESTAMPTZ,
  data_validade DATE, -- NULL se documento não vence
  obrigatorio BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pendente', -- 'pendente', 'aprovado', 'rejeitado', 'expirado'
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.users(id)
);

-- Índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_funcionarios_documentos_funcionario ON public.funcionarios_documentos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_documentos_tipo ON public.funcionarios_documentos(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_funcionarios_documentos_validade ON public.funcionarios_documentos(data_validade) WHERE data_validade IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_funcionarios_documentos_ocr ON public.funcionarios_documentos USING gin(to_tsvector('portuguese', COALESCE(ocr_texto, '')));

-- 4. Criar tabela de histórico de status
CREATE TABLE IF NOT EXISTS public.funcionarios_status_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  status_anterior funcionario_status,
  status_novo funcionario_status NOT NULL,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE, -- NULL se é o status atual
  motivo TEXT,
  alterado_por UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funcionarios_status_historico_funcionario ON public.funcionarios_status_historico(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_status_historico_data ON public.funcionarios_status_historico(data_inicio, data_fim);

-- 5. RLS para funcionarios_documentos
ALTER TABLE public.funcionarios_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar documentos de funcionários"
ON public.funcionarios_documentos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Funcionário pode ver seus próprios documentos"
ON public.funcionarios_documentos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.funcionarios f
    WHERE f.id = funcionarios_documentos.funcionario_id
    AND f.user_id = auth.uid()
  )
);

-- 6. RLS para funcionarios_status_historico
ALTER TABLE public.funcionarios_status_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar histórico de status"
ON public.funcionarios_status_historico
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Funcionário pode ver seu próprio histórico"
ON public.funcionarios_status_historico
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.funcionarios f
    WHERE f.id = funcionarios_status_historico.funcionario_id
    AND f.user_id = auth.uid()
  )
);

-- 7. Função para criar despesa fixa automaticamente ao inserir funcionário
CREATE OR REPLACE FUNCTION public.fn_funcionario_create_despesa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valor NUMERIC;
  v_descricao TEXT;
  v_categoria_id UUID;
  v_despesa_id UUID;
  v_nome TEXT;
BEGIN
  -- Determinar valor baseado no tipo de contrato
  IF NEW.tipo_contrato IN ('clt', 'estagiario') THEN
    v_valor := NEW.salario_mensal;
  ELSE
    v_valor := NEW.valor_contrato;
  END IF;
  
  -- Se não tem valor, não cria despesa
  IF v_valor IS NULL OR v_valor <= 0 THEN
    RETURN NEW;
  END IF;
  
  -- Buscar nome do funcionário
  SELECT COALESCE(NEW.nome_completo, u.nome, u.email) INTO v_nome
  FROM public.users u WHERE u.id = NEW.user_id;
  
  -- Definir descrição baseada no tipo
  CASE NEW.tipo_contrato
    WHEN 'clt' THEN v_descricao := 'Salário CLT - ' || v_nome;
    WHEN 'estagiario' THEN v_descricao := 'Bolsa Estágio - ' || v_nome;
    WHEN 'pj' THEN v_descricao := 'Contrato PJ - ' || v_nome;
    WHEN 'freelancer' THEN v_descricao := 'Freelancer - ' || v_nome;
    WHEN 'socio' THEN v_descricao := 'Pró-labore - ' || v_nome;
    ELSE v_descricao := 'Remuneração - ' || v_nome;
  END CASE;
  
  -- Buscar categoria "Salários" (subcategoria de Custos Fixos)
  SELECT id INTO v_categoria_id
  FROM public.categorias_despesas
  WHERE nome = 'Salários' AND fluxo = 'saida'
  LIMIT 1;
  
  -- Fallback para Custos Fixos se não encontrar
  IF v_categoria_id IS NULL THEN
    v_categoria_id := '00000000-0000-0000-0000-000000000001';
  END IF;
  
  -- Criar despesa fixa
  INSERT INTO public.despesas_fixas (
    descricao,
    valor,
    periodicidade,
    categoria,
    categoria_id,
    dia_vencimento,
    ativo,
    responsavel_id,
    centro_custo_id,
    created_by
  ) VALUES (
    v_descricao,
    v_valor,
    COALESCE(NEW.periodicidade_pagamento, 'mensal'),
    'folha_pagamento',
    v_categoria_id,
    5, -- Dia 5 como padrão para pagamentos
    NEW.ativo,
    NEW.id, -- ID do funcionário como responsável
    NEW.centro_custo_id,
    NEW.created_by
  )
  RETURNING id INTO v_despesa_id;
  
  -- Atualizar funcionário com referência à despesa
  NEW.despesa_fixa_id := v_despesa_id;
  
  RETURN NEW;
END;
$$;

-- 8. Função para atualizar despesa fixa quando funcionário é alterado
CREATE OR REPLACE FUNCTION public.fn_funcionario_update_despesa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valor_novo NUMERIC;
  v_valor_antigo NUMERIC;
BEGIN
  -- Se não tem despesa vinculada, ignorar
  IF NEW.despesa_fixa_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calcular valores
  IF NEW.tipo_contrato IN ('clt', 'estagiario') THEN
    v_valor_novo := NEW.salario_mensal;
    v_valor_antigo := OLD.salario_mensal;
  ELSE
    v_valor_novo := NEW.valor_contrato;
    v_valor_antigo := OLD.valor_contrato;
  END IF;
  
  -- Atualizar despesa se valor mudou ou status mudou
  IF v_valor_novo IS DISTINCT FROM v_valor_antigo 
     OR NEW.ativo IS DISTINCT FROM OLD.ativo
     OR NEW.centro_custo_id IS DISTINCT FROM OLD.centro_custo_id THEN
    
    UPDATE public.despesas_fixas
    SET 
      valor = COALESCE(v_valor_novo, valor),
      ativo = NEW.ativo,
      centro_custo_id = NEW.centro_custo_id,
      updated_at = now(),
      motivo_alteracao = CASE 
        WHEN v_valor_novo IS DISTINCT FROM v_valor_antigo THEN 'Alteração salarial via RH'
        WHEN NEW.ativo IS DISTINCT FROM OLD.ativo THEN 'Alteração de status via RH'
        ELSE 'Atualização via RH'
      END
    WHERE id = NEW.despesa_fixa_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 9. Função para registrar histórico de mudança de status
CREATE OR REPLACE FUNCTION public.fn_funcionario_status_historico()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só registrar se status mudou
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Fechar registro anterior
    UPDATE public.funcionarios_status_historico
    SET data_fim = CURRENT_DATE
    WHERE funcionario_id = NEW.id AND data_fim IS NULL;
    
    -- Criar novo registro
    INSERT INTO public.funcionarios_status_historico (
      funcionario_id,
      status_anterior,
      status_novo,
      data_inicio,
      alterado_por
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      CURRENT_DATE,
      NEW.updated_by
    );
    
    -- Se status mudou para 'encerrado', desativar funcionário e despesa
    IF NEW.status = 'encerrado' THEN
      NEW.ativo := false;
      NEW.data_demissao := COALESCE(NEW.data_demissao, CURRENT_DATE);
      
      -- Desativar despesa vinculada
      IF NEW.despesa_fixa_id IS NOT NULL THEN
        UPDATE public.despesas_fixas
        SET ativo = false, 
            motivo_alteracao = 'Contrato encerrado em ' || CURRENT_DATE::TEXT
        WHERE id = NEW.despesa_fixa_id;
      END IF;
    END IF;
    
    -- Se estava suspenso e voltou a ativo, reativar despesa
    IF OLD.status = 'suspenso' AND NEW.status = 'ativo' THEN
      IF NEW.despesa_fixa_id IS NOT NULL THEN
        UPDATE public.despesas_fixas
        SET ativo = true,
            motivo_alteracao = 'Reativado via RH em ' || CURRENT_DATE::TEXT
        WHERE id = NEW.despesa_fixa_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 10. Criar triggers
DROP TRIGGER IF EXISTS trg_funcionario_create_despesa ON public.funcionarios;
CREATE TRIGGER trg_funcionario_create_despesa
  BEFORE INSERT ON public.funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_funcionario_create_despesa();

DROP TRIGGER IF EXISTS trg_funcionario_update_despesa ON public.funcionarios;
CREATE TRIGGER trg_funcionario_update_despesa
  BEFORE UPDATE ON public.funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_funcionario_update_despesa();

DROP TRIGGER IF EXISTS trg_funcionario_status_historico ON public.funcionarios;
CREATE TRIGGER trg_funcionario_status_historico
  BEFORE UPDATE ON public.funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_funcionario_status_historico();

-- 11. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.fn_funcionarios_documentos_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_funcionarios_documentos_updated_at ON public.funcionarios_documentos;
CREATE TRIGGER trg_funcionarios_documentos_updated_at
  BEFORE UPDATE ON public.funcionarios_documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_funcionarios_documentos_updated_at();

-- 12. Comentários para documentação
COMMENT ON TABLE public.funcionarios_documentos IS 'Documentos obrigatórios e opcionais de funcionários com suporte a OCR';
COMMENT ON TABLE public.funcionarios_status_historico IS 'Histórico auditável de mudanças de status de funcionários';
COMMENT ON COLUMN public.funcionarios.status IS 'Status atual: ativo, ferias, suspenso, encerrado';
COMMENT ON COLUMN public.funcionarios.despesa_fixa_id IS 'Vínculo automático com despesa fixa gerada';
COMMENT ON COLUMN public.funcionarios.centro_custo_id IS 'Centro de custo para alocação de despesas';