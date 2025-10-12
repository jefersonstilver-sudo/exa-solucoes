-- Inserir dados de exemplo na tabela configuracoes_sindico
INSERT INTO public.configuracoes_sindico (
  video_principal_url, 
  video_secundario_url,
  condominio_ticker_names
) VALUES (
  'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  ARRAY[
    'Edifício Aurora', 
    'Condomínio Bela Vista', 
    'Residencial Panorama',
    'Edifício Ipanema',
    'Condomínio São Paulo',
    'Residencial Leblon',
    'Edifício Central Park',
    'Condomínio Jardins'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  video_principal_url = EXCLUDED.video_principal_url,
  video_secundario_url = EXCLUDED.video_secundario_url,
  condominio_ticker_names = EXCLUDED.condominio_ticker_names,
  updated_at = NOW();