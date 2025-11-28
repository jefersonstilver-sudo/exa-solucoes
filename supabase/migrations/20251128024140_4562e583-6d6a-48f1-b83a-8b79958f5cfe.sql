-- Corrigir número do WhatsApp do agente EXA Alert
UPDATE agents 
SET 
  whatsapp_number = '+5545999429820',
  updated_at = NOW()
WHERE key = 'exa_alert';