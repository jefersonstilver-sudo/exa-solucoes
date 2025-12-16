
-- Tabela de produtos EXA (Horizontal e Vertical Premium)
CREATE TABLE public.produtos_exa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  codigo VARCHAR(30) UNIQUE NOT NULL, -- 'horizontal', 'vertical_premium'
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  
  -- Configurações técnicas de exibição
  duracao_video_segundos INTEGER NOT NULL DEFAULT 10,
  max_clientes_por_painel INTEGER NOT NULL DEFAULT 15,
  max_videos_por_pedido INTEGER DEFAULT 4,
  
  -- Configurações de venda
  vendido_no_site BOOLEAN DEFAULT true,
  contratacao_parcial BOOLEAN DEFAULT true,
  vendedor_responsavel VARCHAR(100),
  telefone_vendedor VARCHAR(20),
  
  -- Especificações técnicas
  formato VARCHAR(20) NOT NULL DEFAULT 'horizontal', -- 'horizontal' ou 'vertical'
  resolucao VARCHAR(20) DEFAULT '1920x1080',
  
  -- Sistema
  ativo BOOLEAN DEFAULT true,
  ordem_exibicao INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de configurações globais de exibição
CREATE TABLE public.configuracoes_exibicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horas_operacao_dia INTEGER NOT NULL DEFAULT 21,
  dias_mes INTEGER NOT NULL DEFAULT 30,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.produtos_exa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_exibicao ENABLE ROW LEVEL SECURITY;

-- Policies para produtos_exa
CREATE POLICY "Admins podem gerenciar produtos" ON public.produtos_exa
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Leitura pública de produtos ativos" ON public.produtos_exa
  FOR SELECT USING (ativo = true);

-- Policies para configuracoes_exibicao
CREATE POLICY "Admins podem gerenciar configurações" ON public.configuracoes_exibicao
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Leitura pública de configurações" ON public.configuracoes_exibicao
  FOR SELECT USING (true);

-- Inserir dados iniciais - Produto Horizontal
INSERT INTO public.produtos_exa (codigo, nome, descricao, duracao_video_segundos, max_clientes_por_painel, max_videos_por_pedido, vendido_no_site, contratacao_parcial, formato, resolucao, ordem_exibicao)
VALUES (
  'horizontal',
  'Horizontal Tradicional',
  'Vídeo horizontal exibido em sequência com outros anunciantes. O cliente pode alternar até 4 vídeos por pedido.',
  10,
  15,
  4,
  true,
  true,
  'horizontal',
  '1920x1080',
  1
);

-- Inserir dados iniciais - Produto Vertical Premium
INSERT INTO public.produtos_exa (codigo, nome, descricao, duracao_video_segundos, max_clientes_por_painel, max_videos_por_pedido, vendido_no_site, contratacao_parcial, vendedor_responsavel, telefone_vendedor, formato, resolucao, ordem_exibicao)
VALUES (
  'vertical_premium',
  'Vertical Premium',
  'Vídeo vertical em tela cheia, exibido a cada 50 segundos. Inclui automaticamente todos os prédios da rede.',
  15,
  3,
  1,
  false,
  false,
  'Eduardo',
  '+55 45 99141-5856',
  'vertical',
  '1080x1920',
  2
);

-- Inserir configuração global inicial
INSERT INTO public.configuracoes_exibicao (horas_operacao_dia, dias_mes)
VALUES (21, 30);

-- Função RPC para sincronizar exibições em todos os buildings
CREATE OR REPLACE FUNCTION public.sincronizar_exibicoes_buildings()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
  v_produtos RECORD;
  v_tempo_ciclo INTEGER := 0;
  v_segundos_dia INTEGER;
  v_ciclos_dia INTEGER;
  v_exibicoes_mes INTEGER;
  v_buildings_atualizados INTEGER := 0;
BEGIN
  -- Buscar configuração global
  SELECT horas_operacao_dia, dias_mes INTO v_config
  FROM configuracoes_exibicao
  LIMIT 1;
  
  IF v_config IS NULL THEN
    v_config.horas_operacao_dia := 21;
    v_config.dias_mes := 30;
  END IF;
  
  -- Calcular tempo total do ciclo (soma de todos os produtos)
  FOR v_produtos IN 
    SELECT duracao_video_segundos, max_clientes_por_painel 
    FROM produtos_exa 
    WHERE ativo = true
  LOOP
    v_tempo_ciclo := v_tempo_ciclo + (v_produtos.duracao_video_segundos * v_produtos.max_clientes_por_painel);
  END LOOP;
  
  -- Se não houver produtos, usar valor padrão
  IF v_tempo_ciclo = 0 THEN
    v_tempo_ciclo := 195; -- (10*15) + (15*3) = 195
  END IF;
  
  -- Calcular segundos por dia
  v_segundos_dia := v_config.horas_operacao_dia * 3600;
  
  -- Calcular ciclos por dia
  v_ciclos_dia := FLOOR(v_segundos_dia::DECIMAL / v_tempo_ciclo);
  
  -- Calcular exibições por mês (por tela)
  v_exibicoes_mes := v_ciclos_dia * v_config.dias_mes;
  
  -- Atualizar todos os buildings
  UPDATE buildings
  SET visualizacoes_mes = COALESCE(quantidade_telas, 1) * v_exibicoes_mes,
      local_updated_at = NOW()
  WHERE status = 'ativo';
  
  GET DIAGNOSTICS v_buildings_atualizados = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'tempo_ciclo', v_tempo_ciclo,
    'ciclos_dia', v_ciclos_dia,
    'exibicoes_mes_por_tela', v_exibicoes_mes,
    'buildings_atualizados', v_buildings_atualizados
  );
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_produtos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_produtos_updated_at
  BEFORE UPDATE ON produtos_exa
  FOR EACH ROW
  EXECUTE FUNCTION update_produtos_updated_at();
