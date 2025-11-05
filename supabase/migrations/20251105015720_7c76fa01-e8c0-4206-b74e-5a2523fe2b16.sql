-- Adicionar campo nome na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS nome TEXT;