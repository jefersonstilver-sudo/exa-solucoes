-- Adicionar campo link_comercial na tabela buildings
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS link_comercial TEXT;