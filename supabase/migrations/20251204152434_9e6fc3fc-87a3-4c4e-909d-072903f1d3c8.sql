-- Add tipo_produto to proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS tipo_produto TEXT DEFAULT 'horizontal';

-- Add tipo_produto and sem_slots_video to pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tipo_produto TEXT DEFAULT 'horizontal';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS sem_slots_video BOOLEAN DEFAULT FALSE;

-- Add tipo_produto to contratos_legais
ALTER TABLE contratos_legais ADD COLUMN IF NOT EXISTS tipo_produto TEXT DEFAULT 'horizontal';

-- Add comment for documentation
COMMENT ON COLUMN proposals.tipo_produto IS 'Tipo de produto: horizontal (padrão 15s 1920x1080) ou vertical_premium (10s 1080x1920 tela cheia a cada 50s)';
COMMENT ON COLUMN pedidos.tipo_produto IS 'Tipo de produto: horizontal ou vertical_premium';
COMMENT ON COLUMN pedidos.sem_slots_video IS 'Indica se o pedido não possui slots de vídeo (ex: vertical_premium)';
COMMENT ON COLUMN contratos_legais.tipo_produto IS 'Tipo de produto: horizontal ou vertical_premium';