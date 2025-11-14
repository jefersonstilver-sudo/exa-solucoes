-- Criar cupom cortesia exclusivo para Super Admin
INSERT INTO cupons (
  codigo, 
  desconto_percentual, 
  tipo_desconto, 
  categoria, 
  ativo, 
  max_usos, 
  min_meses, 
  descricao,
  created_at
) VALUES (
  'CORTESIA_ADMIN', 
  100, 
  'percentual', 
  'cortesia',
  true, 
  999999, 
  1, 
  'Cupom cortesia exclusivo para Super Admin - Pedido gratuito sem pagamento',
  now()
)
ON CONFLICT (codigo) DO NOTHING;