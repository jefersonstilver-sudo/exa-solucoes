-- Sprint 1.1: Database Setup para Sistema EXA

-- Tabela de vínculos de painéis
CREATE TABLE IF NOT EXISTS public.paineis_vinculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(8) UNIQUE NOT NULL,
  painel_id UUID REFERENCES public.painels(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  expira_em TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vinculado_em TIMESTAMP WITH TIME ZONE,
  criado_por UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_paineis_vinculos_codigo ON public.paineis_vinculos(codigo);
CREATE INDEX IF NOT EXISTS idx_paineis_vinculos_painel_id ON public.paineis_vinculos(painel_id);
CREATE INDEX IF NOT EXISTS idx_paineis_vinculos_building_id ON public.paineis_vinculos(building_id);
CREATE INDEX IF NOT EXISTS idx_paineis_vinculos_status ON public.paineis_vinculos(status);

-- Tabela de status em tempo real dos painéis
CREATE TABLE IF NOT EXISTS public.paineis_status (
  painel_id UUID PRIMARY KEY REFERENCES public.painels(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'offline',
  ultimo_heartbeat TIMESTAMP WITH TIME ZONE,
  url_atual TEXT,
  user_agent TEXT,
  ip_address INET,
  erro_ultimo TEXT,
  device_info JSONB,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para status
CREATE INDEX IF NOT EXISTS idx_paineis_status_status ON public.paineis_status(status);
CREATE INDEX IF NOT EXISTS idx_paineis_status_ultimo_heartbeat ON public.paineis_status(ultimo_heartbeat);

-- Tabela de comandos remotos
CREATE TABLE IF NOT EXISTS public.paineis_comandos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  painel_id UUID REFERENCES public.painels(id) ON DELETE CASCADE,
  comando VARCHAR(50) NOT NULL,
  parametros JSONB,
  status VARCHAR(20) DEFAULT 'pendente',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executado_em TIMESTAMP WITH TIME ZONE,
  resultado JSONB,
  criado_por UUID REFERENCES auth.users(id)
);

-- Índices para comandos
CREATE INDEX IF NOT EXISTS idx_paineis_comandos_painel_id ON public.paineis_comandos(painel_id);
CREATE INDEX IF NOT EXISTS idx_paineis_comandos_status ON public.paineis_comandos(status);
CREATE INDEX IF NOT EXISTS idx_paineis_comandos_criado_em ON public.paineis_comandos(criado_em DESC);

-- RLS Policies para paineis_vinculos
ALTER TABLE public.paineis_vinculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar vínculos"
  ON public.paineis_vinculos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Painéis podem ler seus próprios vínculos"
  ON public.paineis_vinculos
  FOR SELECT
  USING (true);

-- RLS Policies para paineis_status
ALTER TABLE public.paineis_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver todos os status"
  ON public.paineis_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Painéis podem atualizar seu próprio status"
  ON public.paineis_status
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Painéis podem atualizar seu próprio status - update"
  ON public.paineis_status
  FOR UPDATE
  USING (true);

-- RLS Policies para paineis_comandos
ALTER TABLE public.paineis_comandos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem criar comandos"
  ON public.paineis_comandos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins podem ver comandos"
  ON public.paineis_comandos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Painéis podem ver e atualizar seus comandos"
  ON public.paineis_comandos
  FOR ALL
  USING (true);

-- Habilitar Realtime para as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.paineis_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.paineis_comandos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.paineis_vinculos;

-- Função para limpar códigos expirados
CREATE OR REPLACE FUNCTION public.limpar_codigos_expirados()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.paineis_vinculos
  SET status = 'expired'
  WHERE status = 'pending'
  AND expira_em < NOW();
END;
$$;

-- Função para marcar painéis offline
CREATE OR REPLACE FUNCTION public.marcar_paineis_offline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.paineis_status
  SET status = 'offline'
  WHERE status = 'online'
  AND ultimo_heartbeat < NOW() - INTERVAL '2 minutes';
END;
$$;