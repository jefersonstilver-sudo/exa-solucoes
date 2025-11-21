-- Enable audio transcription for Sofia
UPDATE agents
SET openai_config = jsonb_set(
  COALESCE(openai_config, '{}'::jsonb),
  '{audio_transcription_enabled}',
  'true'::jsonb
)
WHERE key = 'sofia';

UPDATE agents
SET openai_config = jsonb_set(
  openai_config,
  '{audio_language}',
  '"pt"'::jsonb
)
WHERE key = 'sofia';

UPDATE agents
SET openai_config = jsonb_set(
  openai_config,
  '{audio_prompt}',
  '"Áudio de WhatsApp sobre vendas de mídia OOH em Foz do Iguaçu. Pode conter gírias locais e sotaque paranaense."'::jsonb
)
WHERE key = 'sofia';

UPDATE agents
SET openai_config = jsonb_set(
  openai_config,
  '{audio_max_duration}',
  '120'::jsonb
)
WHERE key = 'sofia';