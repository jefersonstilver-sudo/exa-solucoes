-- Add telefones_adicionais column to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS telefones_adicionais TEXT[] DEFAULT '{}';