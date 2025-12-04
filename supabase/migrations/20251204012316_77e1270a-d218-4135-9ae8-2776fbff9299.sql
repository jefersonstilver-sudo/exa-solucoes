-- Fix get_pedidos_com_status_correto to use client_name from pedidos
CREATE OR REPLACE FUNCTION get_pedidos_com_status_correto(
  p_page INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 50,
  p_status TEXT DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  created_at TIMESTAMPTZ,
  status TEXT,
  valor_total NUMERIC,
  lista_paineis JSONB,
  plano_meses INTEGER,
  data_inicio DATE,
  data_fim DATE,
  client_id UUID,
  client_email TEXT,
  client_name TEXT,
  client_phone TEXT,
  client_cpf TEXT,
  video_status TEXT,
  correct_status TEXT,
  predios_selecionados JSONB,
  selected_buildings JSONB,
  cupom_id UUID,
  coupon_code TEXT,
  coupon_category TEXT,
  tipo_pagamento TEXT,
  is_fidelidade BOOLEAN,
  metodo_pagamento TEXT,
  total_parcelas INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    'order'::TEXT as type,
    p.created_at,
    p.status,
    p.valor_total,
    p.lista_paineis,
    p.plano_meses,
    p.data_inicio,
    p.data_fim,
    p.client_id,
    COALESCE(u.email, p.client_email) as client_email,
    COALESCE(u.nome, p.client_name, p.nome_pedido) as client_name,
    COALESCE(u.telefone, p.client_phone) as client_phone,
    COALESCE(u.cpf, p.client_cpf) as client_cpf,
    (
      SELECT 
        CASE 
          WHEN EXISTS(SELECT 1 FROM videos v WHERE v.pedido_id = p.id AND v.is_active = true) THEN 'video_ativo'
          WHEN EXISTS(SELECT 1 FROM videos v WHERE v.pedido_id = p.id AND v.status = 'aprovado') THEN 'video_aprovado'
          WHEN EXISTS(SELECT 1 FROM videos v WHERE v.pedido_id = p.id AND v.status = 'pendente') THEN 'video_pendente'
          WHEN EXISTS(SELECT 1 FROM videos v WHERE v.pedido_id = p.id AND v.status = 'rejeitado') THEN 'video_rejeitado'
          ELSE 'sem_video'
        END
    ) as video_status,
    CASE 
      WHEN p.status IN ('pago', 'ativo', 'pago_pendente_video') AND EXISTS(SELECT 1 FROM videos v WHERE v.pedido_id = p.id AND v.is_active = true) THEN 'em_exibicao'
      WHEN p.status IN ('pago', 'ativo', 'pago_pendente_video') AND EXISTS(SELECT 1 FROM videos v WHERE v.pedido_id = p.id AND v.status = 'pendente') THEN 'aguardando_aprovacao'
      WHEN p.status IN ('pago', 'ativo', 'pago_pendente_video') AND NOT EXISTS(SELECT 1 FROM videos v WHERE v.pedido_id = p.id) THEN 'aguardando_video'
      WHEN p.status = 'pendente' THEN 'aguardando_pagamento'
      ELSE p.status
    END as correct_status,
    p.predios_selecionados,
    p.selected_buildings,
    p.cupom_id,
    c.code as coupon_code,
    c.category as coupon_category,
    p.tipo_pagamento,
    COALESCE(p.is_fidelidade, false) as is_fidelidade,
    p.metodo_pagamento,
    COALESCE(p.total_parcelas, 1) as total_parcelas
  FROM pedidos p
  LEFT JOIN users u ON u.id = p.client_id
  LEFT JOIN coupons c ON c.id = p.cupom_id
  WHERE 
    (p_status IS NULL OR p.status = p_status)
    AND (p_client_id IS NULL OR p.client_id = p_client_id)
    AND (p_start_date IS NULL OR p.created_at >= p_start_date)
    AND (p_end_date IS NULL OR p.created_at <= p_end_date + INTERVAL '1 day')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET (p_page - 1) * p_limit;
END;
$$;

-- Fix the existing order data
UPDATE pedidos 
SET is_fidelidade = true, total_parcelas = 2 
WHERE id = '05931acb-8924-4fdc-8a9f-696b2e42e647';

-- Create installments for existing order
INSERT INTO parcelas (pedido_id, numero_parcela, valor_original, valor_final, data_vencimento, status, metodo_pagamento, data_pagamento, mercadopago_payment_id)
VALUES 
  ('05931acb-8924-4fdc-8a9f-696b2e42e647', 1, 1, 1, '2025-12-08', 'pago', 'pix', NOW(), '135749356759'),
  ('05931acb-8924-4fdc-8a9f-696b2e42e647', 2, 1999, 1999, '2026-06-02', 'pendente', 'pix', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Update proposal to not be viewing
UPDATE proposals 
SET is_viewing = false, last_heartbeat_at = NULL 
WHERE id = '03c0c31b-7df2-4305-9a99-df99e13664d3';