-- =====================================================
-- FASE 2: NOVA ARQUITETURA DE VENDAS
-- Separando pedido em: vendas, campanhas_exa, assinaturas
-- =====================================================

-- 1️⃣ TABELA: VENDAS (Entidade principal de vendas)
CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vínculos
  client_id UUID NOT NULL,
  proposta_id UUID,
  pedido_id UUID, -- Link legado para não quebrar funcionalidades
  
  -- Dados comerciais
  valor_total NUMERIC NOT NULL DEFAULT 0,
  plano_meses INTEGER NOT NULL DEFAULT 1,
  cupom_id UUID,
  
  -- Status do funil de vendas
  status_venda TEXT NOT NULL DEFAULT 'em_negociacao'
    CHECK (status_venda IN ('em_negociacao', 'ganha', 'perdida')),
  
  -- Responsável pela venda
  responsavel_id UUID,
  
  -- Datas
  data_fechamento TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para vendas
CREATE INDEX IF NOT EXISTS idx_vendas_client_id ON vendas(client_id);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON vendas(status_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_responsavel ON vendas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_vendas_pedido_id ON vendas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_vendas_proposta_id ON vendas(proposta_id);

-- RLS para vendas
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendas visíveis para usuários autenticados"
ON vendas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Vendas editáveis por admins"
ON vendas FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 2️⃣ TABELA: CAMPANHAS_EXA (Operação de mídia)
CREATE TABLE IF NOT EXISTS campanhas_exa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vínculo com venda
  venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE,
  pedido_id UUID, -- Link legado
  
  -- Período
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  
  -- Prédios e painéis
  lista_predios TEXT[] DEFAULT '{}',
  lista_paineis TEXT[] DEFAULT '{}',
  
  -- Status operacional
  status_operacional TEXT NOT NULL DEFAULT 'aguardando_contrato'
    CHECK (status_operacional IN (
      'aguardando_contrato', 
      'aguardando_video', 
      'em_revisao',
      'ativa', 
      'pausada', 
      'encerrada'
    )),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para campanhas_exa
CREATE INDEX IF NOT EXISTS idx_campanhas_exa_venda_id ON campanhas_exa(venda_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_exa_status ON campanhas_exa(status_operacional);
CREATE INDEX IF NOT EXISTS idx_campanhas_exa_periodo ON campanhas_exa(periodo_inicio, periodo_fim);

-- RLS para campanhas_exa
ALTER TABLE campanhas_exa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campanhas visíveis para usuários autenticados"
ON campanhas_exa FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Campanhas editáveis por admins"
ON campanhas_exa FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3️⃣ TABELA: ASSINATURAS (Placeholder para billing - SEM FINANCEIRO)
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vínculo
  venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE,
  pedido_id UUID, -- Link legado
  
  -- Tipo
  tipo TEXT NOT NULL DEFAULT 'avista'
    CHECK (tipo IN ('avista', 'fidelidade')),
  
  -- Status (SEM PARCELAS/FINANCEIRO)
  status TEXT NOT NULL DEFAULT 'ativa'
    CHECK (status IN ('ativa', 'suspensa', 'cancelada')),
  
  -- Dados do plano (placeholder - financeiro virá na FASE 3)
  dia_vencimento INTEGER CHECK (dia_vencimento IS NULL OR dia_vencimento IN (5, 10, 15)),
  metodo_pagamento TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para assinaturas
CREATE INDEX IF NOT EXISTS idx_assinaturas_venda_id ON assinaturas(venda_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);

-- RLS para assinaturas
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assinaturas visíveis para usuários autenticados"
ON assinaturas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Assinaturas editáveis por admins"
ON assinaturas FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4️⃣ FUNÇÃO: Check campanha só pode existir para venda ganha
CREATE OR REPLACE FUNCTION check_campanha_venda_ganha()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.venda_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM vendas 
      WHERE id = NEW.venda_id 
      AND status_venda = 'ganha'
    ) THEN
      RAISE EXCEPTION 'Campanha só pode ser criada para vendas com status "ganha"';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar campanha
DROP TRIGGER IF EXISTS trigger_check_campanha_venda ON campanhas_exa;
CREATE TRIGGER trigger_check_campanha_venda
  BEFORE INSERT OR UPDATE ON campanhas_exa
  FOR EACH ROW
  EXECUTE FUNCTION check_campanha_venda_ganha();

-- 5️⃣ MIGRAÇÃO DE DADOS: Pedidos existentes → Vendas
INSERT INTO vendas (client_id, pedido_id, valor_total, plano_meses, cupom_id, status_venda, data_fechamento, created_at)
SELECT 
  p.client_id,
  p.id,
  COALESCE(p.valor_total, 0),
  COALESCE(p.plano_meses, 1),
  p.cupom_id,
  CASE 
    WHEN p.status IN ('pago', 'ativo', 'video_aprovado', 'pago_pendente_video') THEN 'ganha'
    WHEN p.status IN ('cancelado', 'expirado') THEN 'perdida'
    ELSE 'em_negociacao'
  END,
  CASE WHEN p.status IN ('pago', 'ativo', 'video_aprovado') THEN p.created_at ELSE NULL END,
  p.created_at
FROM pedidos p
WHERE NOT EXISTS (SELECT 1 FROM vendas v WHERE v.pedido_id = p.id);

-- 6️⃣ MIGRAÇÃO: Campanhas a partir de pedidos com data_inicio
INSERT INTO campanhas_exa (venda_id, pedido_id, periodo_inicio, periodo_fim, lista_predios, lista_paineis, status_operacional, created_at)
SELECT 
  v.id,
  p.id,
  p.data_inicio,
  p.data_fim,
  COALESCE(p.lista_predios, '{}'),
  COALESCE(p.lista_paineis, '{}'),
  CASE 
    WHEN p.status = 'ativo' THEN 'ativa'
    WHEN p.status = 'pago_pendente_video' THEN 'aguardando_video'
    WHEN p.status = 'video_enviado' THEN 'em_revisao'
    WHEN p.status IN ('cancelado', 'expirado') THEN 'encerrada'
    ELSE 'aguardando_contrato'
  END,
  p.created_at
FROM pedidos p
JOIN vendas v ON v.pedido_id = p.id
WHERE p.data_inicio IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM campanhas_exa c WHERE c.pedido_id = p.id);

-- 7️⃣ MIGRAÇÃO: Assinaturas (placeholder)
INSERT INTO assinaturas (venda_id, pedido_id, tipo, status, dia_vencimento, metodo_pagamento, created_at)
SELECT 
  v.id,
  p.id,
  CASE WHEN p.is_fidelidade = true THEN 'fidelidade' ELSE 'avista' END,
  CASE 
    WHEN p.status IN ('ativo', 'pago', 'video_aprovado') THEN 'ativa'
    WHEN p.status = 'suspenso' THEN 'suspensa'
    WHEN p.status IN ('cancelado', 'expirado') THEN 'cancelada'
    ELSE 'ativa'
  END,
  p.dia_vencimento,
  p.metodo_pagamento,
  p.created_at
FROM pedidos p
JOIN vendas v ON v.pedido_id = p.id
WHERE NOT EXISTS (SELECT 1 FROM assinaturas a WHERE a.pedido_id = p.id);

-- 8️⃣ Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vendas_updated_at ON vendas;
CREATE TRIGGER trigger_vendas_updated_at
  BEFORE UPDATE ON vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_campanhas_exa_updated_at ON campanhas_exa;
CREATE TRIGGER trigger_campanhas_exa_updated_at
  BEFORE UPDATE ON campanhas_exa
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();