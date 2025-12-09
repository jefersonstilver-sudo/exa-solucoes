-- Add building_id column to devices table for 1:N relationship
ALTER TABLE devices ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES buildings(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_devices_building_id ON devices(building_id);

-- Link devices to buildings based on name matching
UPDATE devices SET building_id = (
  SELECT b.id FROM buildings b 
  WHERE 
    LOWER(b.nome) LIKE '%esmeralda%' AND LOWER(devices.condominio_name) LIKE '%esmeralda%'
    OR LOWER(b.nome) LIKE '%provence%' AND LOWER(devices.condominio_name) LIKE '%provence%'
    OR LOWER(b.nome) LIKE '%foz residence%' AND LOWER(devices.condominio_name) LIKE '%foz residence%'
    OR LOWER(b.nome) LIKE '%las brisas%' AND LOWER(devices.condominio_name) LIKE '%las brisas%'
    OR LOWER(b.nome) LIKE '%luiz xv%' AND LOWER(devices.condominio_name) LIKE '%luis xv%'
    OR LOWER(b.nome) LIKE '%pietro%' AND LOWER(devices.condominio_name) LIKE '%pietro%'
  LIMIT 1
) WHERE building_id IS NULL;

-- More specific updates for exact matches
UPDATE devices d SET building_id = b.id
FROM buildings b
WHERE LOWER(d.condominio_name) LIKE '%esmeralda%' AND LOWER(b.nome) LIKE '%esmeralda%';

UPDATE devices d SET building_id = b.id
FROM buildings b
WHERE LOWER(d.condominio_name) LIKE '%provence%' AND LOWER(b.nome) LIKE '%provence%';

UPDATE devices d SET building_id = b.id
FROM buildings b
WHERE LOWER(d.condominio_name) LIKE '%foz residence%' AND LOWER(b.nome) LIKE '%foz residence%';

UPDATE devices d SET building_id = b.id
FROM buildings b
WHERE LOWER(d.condominio_name) LIKE '%las brisas%' AND LOWER(b.nome) LIKE '%las brisas%';

UPDATE devices d SET building_id = b.id
FROM buildings b
WHERE LOWER(d.condominio_name) LIKE '%luis xv%' AND LOWER(b.nome) LIKE '%luiz xv%';

UPDATE devices d SET building_id = b.id
FROM buildings b
WHERE LOWER(d.condominio_name) LIKE '%pietro%' AND LOWER(b.nome) LIKE '%pietro%';