-- Corrigir função get_pedidos_com_clientes: lista_paineis deve ser TEXT[] não JSONB
DROP FUNCTION IF EXISTS get_pedidos_com_clientes();

CREATE OR REPLACE FUNCTION get_pedidos_com_clientes()
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  client_id UUID,
  client_name TEXT,
  client_email TEXT,
  status TEXT,
  valor_total NUMERIC,
  plano_meses INTEGER,
  data_inicio DATE,
  data_fim DATE,
  lista_paineis TEXT[],
  lista_predios TEXT[],
  transaction_id TEXT,
  nome_pedido TEXT,
  is_fidelidade BOOLEAN,
  metodo_pagamento TEXT,
  total_parcelas INTEGER,
  tipo_pagamento TEXT,
  parcela_atual INTEGER,
  status_adimplencia TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.created_at,
    p.updated_at,
    p.client_id,
    COALESCE(
      p.client_name,
      (au.raw_user_meta_data->>'nome')::text,
      (au.raw_user_meta_data->>'name')::text,
      au.email::text,
      'Nome não disponível'
    )::text as client_name,
    au.email::text as client_email,
    p.status,
    p.valor_total,
    p.plano_meses,
    p.data_inicio,
    p.data_fim,
    p.lista_paineis,
    p.lista_predios,
    p.transaction_id,
    p.nome_pedido,
    COALESCE(p.is_fidelidade, false) as is_fidelidade,
    p.metodo_pagamento,
    p.total_parcelas,
    p.tipo_pagamento,
    p.parcela_atual,
    p.status_adimplencia
  FROM pedidos p
  LEFT JOIN auth.users au ON p.client_id = au.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;