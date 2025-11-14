-- Adicionar campos para identificação de dispositivo na tabela painels
ALTER TABLE painels 
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS device_info JSONB;

-- Criar índice para buscar por fingerprint
CREATE INDEX IF NOT EXISTS idx_painels_device_fingerprint ON painels(device_fingerprint);

-- Comentários para documentação
COMMENT ON COLUMN painels.device_fingerprint IS 'Hash SHA-256 único do dispositivo para identificação';
COMMENT ON COLUMN painels.device_info IS 'Informações detalhadas do dispositivo (userAgent, platform, screen, etc)';