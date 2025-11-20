-- Corrigir modelo OpenAI para todos os agentes (gpt-4 não existe mais)
UPDATE agents SET
  openai_config = jsonb_set(
    COALESCE(openai_config, '{}'::jsonb),
    '{model}',
    '"gpt-4o-mini"'
  )
WHERE key IN ('sofia', 'iris', 'exa_alert');