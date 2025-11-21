
-- Configurar transcrição de áudio para Sofia usando jsonb_build_object
UPDATE agents
SET openai_config = jsonb_build_object(
  'max_tokens', COALESCE((openai_config->>'max_tokens')::int, 1500),
  'model', COALESCE(openai_config->>'model', 'gpt-4-turbo-preview'),
  'temperature', COALESCE((openai_config->>'temperature')::numeric, 0.7),
  'tone', COALESCE(openai_config->>'tone', 'friendly'),
  'audio_transcription_enabled', true,
  'audio_language', 'pt',
  'audio_prompt', 'Áudio de WhatsApp sobre vendas de mídia OOH em Foz do Iguaçu. Pode conter gírias locais e sotaque paranaense.',
  'audio_max_duration', 120
)
WHERE key = 'sofia';
