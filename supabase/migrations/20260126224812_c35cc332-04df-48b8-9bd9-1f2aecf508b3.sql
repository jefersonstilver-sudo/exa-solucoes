-- Adicionar campos de rastreamento avançado à tabela proposal_views
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7);
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS isp TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS fingerprint TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE proposal_views ADD COLUMN IF NOT EXISTS referrer_url TEXT;

-- Índices para consultas de análise
CREATE INDEX IF NOT EXISTS idx_proposal_views_ip ON proposal_views(ip_address);
CREATE INDEX IF NOT EXISTS idx_proposal_views_country ON proposal_views(country_code);
CREATE INDEX IF NOT EXISTS idx_proposal_views_session ON proposal_views(session_id);

-- Comentários para documentação
COMMENT ON COLUMN proposal_views.ip_address IS 'IP real do visitante capturado via x-forwarded-for';
COMMENT ON COLUMN proposal_views.city IS 'Cidade obtida via geolocalização do IP';
COMMENT ON COLUMN proposal_views.region IS 'Estado/Região obtida via geolocalização';
COMMENT ON COLUMN proposal_views.country IS 'Nome do país';
COMMENT ON COLUMN proposal_views.country_code IS 'Código ISO do país (BR, PT, US, etc)';
COMMENT ON COLUMN proposal_views.latitude IS 'Latitude aproximada do IP';
COMMENT ON COLUMN proposal_views.longitude IS 'Longitude aproximada do IP';
COMMENT ON COLUMN proposal_views.timezone IS 'Fuso horário do visitante';
COMMENT ON COLUMN proposal_views.isp IS 'Provedor de internet / Organização';
COMMENT ON COLUMN proposal_views.fingerprint IS 'Hash único do dispositivo para identificação';
COMMENT ON COLUMN proposal_views.session_id IS 'ID único da sessão de navegação';
COMMENT ON COLUMN proposal_views.referrer_url IS 'URL de origem (de onde veio o visitante)';