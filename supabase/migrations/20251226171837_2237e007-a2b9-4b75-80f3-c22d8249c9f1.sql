-- Deletar o device duplicado "Provence 2" (reinstalação no mesmo equipamento)
-- O device correto (ce47447f-...) permanece vinculado ao prédio
DELETE FROM devices 
WHERE id = '77647ed2-0667-4ad3-b239-c613473eb9a8';