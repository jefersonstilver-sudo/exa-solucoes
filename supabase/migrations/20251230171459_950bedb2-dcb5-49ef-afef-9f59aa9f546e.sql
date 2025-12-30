-- Adicionar coluna para soft delete de devices
ALTER TABLE public.devices 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- Criar índice para consultas filtradas
CREATE INDEX IF NOT EXISTS idx_devices_is_deleted ON public.devices(is_deleted) WHERE is_deleted = false;