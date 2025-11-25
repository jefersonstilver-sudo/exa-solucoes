-- Limpar conversas inválidas do banco de dados
-- Remove conversas com telefone '0' ou nome 'WhatsApp Business'
DELETE FROM conversations 
WHERE contact_phone = '0' 
   OR contact_name = 'WhatsApp Business';