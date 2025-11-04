-- Corrigir constraint de status na tabela provider_benefits para permitir 'cancelled'

-- Remover constraint CHECK antiga se existir
ALTER TABLE provider_benefits 
DROP CONSTRAINT IF EXISTS provider_benefits_status_check;

-- Adicionar nova constraint CHECK que inclui 'cancelled'
ALTER TABLE provider_benefits
ADD CONSTRAINT provider_benefits_status_check 
CHECK (status IN ('pending', 'choice_made', 'code_sent', 'cancelled'));