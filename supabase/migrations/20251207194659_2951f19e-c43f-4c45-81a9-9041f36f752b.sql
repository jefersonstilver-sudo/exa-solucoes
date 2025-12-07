-- Fix phone number format (add country code)
UPDATE panel_offline_alert_recipients 
SET telefone = '+5545998090000' 
WHERE telefone = '+45998090000';