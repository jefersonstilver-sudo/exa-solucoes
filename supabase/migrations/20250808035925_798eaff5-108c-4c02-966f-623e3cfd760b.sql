-- Adicionar campo is_all_day à tabela campaign_schedule_rules
ALTER TABLE campaign_schedule_rules ADD COLUMN is_all_day BOOLEAN NOT NULL DEFAULT FALSE;