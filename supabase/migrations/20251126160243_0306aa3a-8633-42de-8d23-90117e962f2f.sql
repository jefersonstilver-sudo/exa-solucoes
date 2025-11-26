-- Adicionar campo para contagem de detecções offline consecutivas
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS consecutive_offline_count INTEGER NOT NULL DEFAULT 0;

-- Adicionar comentário explicativo
COMMENT ON COLUMN devices.consecutive_offline_count IS 'Contador de detecções offline consecutivas para debounce anti-flutuação';