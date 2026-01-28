-- Adicionar segmentos de Operadores de Consórcio na categoria financeiro
INSERT INTO business_segments (value, label, category, is_active, sort_order) VALUES
  ('consorcio_imoveis', 'Consórcio de Imóveis', 'financeiro', true, 154),
  ('consorcio_veiculos', 'Consórcio de Veículos', 'financeiro', true, 155),
  ('consorcio_motos', 'Consórcio de Motos', 'financeiro', true, 156),
  ('consorcio_maquinas', 'Consórcio de Máquinas e Equipamentos', 'financeiro', true, 157),
  ('consorcio_servicos', 'Consórcio de Serviços', 'financeiro', true, 158),
  ('administradora_consorcio', 'Administradora de Consórcio', 'financeiro', true, 159),
  ('vendedor_consorcio', 'Vendedor de Consórcio', 'financeiro', true, 160),
  ('representante_consorcio', 'Representante de Consórcio', 'financeiro', true, 161)
ON CONFLICT (value) DO NOTHING;