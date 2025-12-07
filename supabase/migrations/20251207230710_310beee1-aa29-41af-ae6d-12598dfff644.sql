-- =====================================================
-- SINCRONIZAÇÃO NOTION ↔ EXA
-- =====================================================

-- 1. Adicionar colunas de sincronização Notion na tabela buildings
ALTER TABLE public.buildings 
ADD COLUMN IF NOT EXISTS notion_page_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS notion_last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notion_properties JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS notion_status TEXT,
ADD COLUMN IF NOT EXISTS notion_oti TEXT,
ADD COLUMN IF NOT EXISTS notion_contrato_url TEXT,
ADD COLUMN IF NOT EXISTS notion_whatsapp_url TEXT,
ADD COLUMN IF NOT EXISTS notion_fotos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notion_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS local_updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS notion_internal_id INTEGER,
ADD COLUMN IF NOT EXISTS notion_tipo TEXT,
ADD COLUMN IF NOT EXISTS notion_portaria TEXT,
ADD COLUMN IF NOT EXISTS notion_out_date DATE;

-- 2. Criar índice para busca rápida por notion_page_id
CREATE INDEX IF NOT EXISTS idx_buildings_notion_page_id ON public.buildings(notion_page_id);
CREATE INDEX IF NOT EXISTS idx_buildings_notion_status ON public.buildings(notion_status);

-- 3. Trigger para atualizar local_updated_at quando building for editado localmente
CREATE OR REPLACE FUNCTION public.update_building_local_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Só atualiza local_updated_at se a mudança NÃO veio do sync Notion
  -- (detectado pela ausência de mudança em notion_last_synced_at)
  IF OLD.notion_last_synced_at IS NOT DISTINCT FROM NEW.notion_last_synced_at THEN
    NEW.local_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_building_local_updated_at ON public.buildings;
CREATE TRIGGER trigger_update_building_local_updated_at
  BEFORE UPDATE ON public.buildings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_building_local_updated_at();

-- 4. Tabela de logs de sincronização Notion
CREATE TABLE IF NOT EXISTS public.notion_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running', -- running, success, error
  buildings_created INTEGER DEFAULT 0,
  buildings_updated INTEGER DEFAULT 0,
  buildings_synced_to_notion INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  duration_ms INTEGER,
  details JSONB DEFAULT '{}'::jsonb
);

-- Índice para buscar últimos logs
CREATE INDEX IF NOT EXISTS idx_notion_sync_logs_started_at ON public.notion_sync_logs(sync_started_at DESC);

-- RLS para notion_sync_logs (apenas admins podem ver)
ALTER TABLE public.notion_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notion sync logs"
  ON public.notion_sync_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Função auxiliar para obter último sync bem-sucedido
CREATE OR REPLACE FUNCTION public.get_last_successful_notion_sync()
RETURNS TIMESTAMPTZ
LANGUAGE SQL
STABLE
AS $$
  SELECT sync_completed_at 
  FROM public.notion_sync_logs 
  WHERE status = 'success' 
  ORDER BY sync_completed_at DESC 
  LIMIT 1;
$$;