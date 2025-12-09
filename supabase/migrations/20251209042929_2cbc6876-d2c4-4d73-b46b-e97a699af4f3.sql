-- Adicionar coluna device_id à tabela buildings para vincular ao dispositivo do painel
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES devices(id);

-- Criar índice para melhor performance nas consultas JOIN
CREATE INDEX IF NOT EXISTS idx_buildings_device_id ON buildings(device_id);

-- Atualizar buildings existentes vinculando aos devices por correspondência de nome
UPDATE buildings b
SET device_id = d.id
FROM devices d
WHERE b.device_id IS NULL
  AND d.status IS NOT NULL
  AND (
    LOWER(d.condominio_name) LIKE '%' || LOWER(b.nome) || '%'
    OR LOWER(b.nome) LIKE '%' || LOWER(d.condominio_name) || '%'
  );

-- Comentário explicativo
COMMENT ON COLUMN buildings.device_id IS 'ID do dispositivo AnyDesk vinculado a este prédio para monitoramento de status online/offline do painel';