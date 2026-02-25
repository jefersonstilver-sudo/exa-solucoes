-- Corrigir nome de Jeferson Stilver para apenas JEFERSON
UPDATE exa_alerts_directors SET nome = 'JEFERSON' WHERE id = 'f8a719fd-afc1-4296-a773-d66313252e81';

-- Atualizar receipts existentes com nome correto  
UPDATE task_read_receipts SET contact_name = 'JEFERSON' WHERE contact_phone = '5545998090000';
