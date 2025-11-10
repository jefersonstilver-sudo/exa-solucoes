-- ============================================================================
-- FASE 1: NORMALIZAÇÃO COMPLETA DA BASE DE DADOS (FINAL)
-- ============================================================================

-- 1.1: Criar tabela de audit log para emails
CREATE TABLE IF NOT EXISTS email_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  recipient_id uuid,
  recipient_name text,
  status text NOT NULL DEFAULT 'pending',
  resend_email_id text,
  error_message text,
  retry_count int DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  pedido_id uuid,
  video_id uuid
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_email_audit_created_at ON email_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_audit_status ON email_audit_log(status);
CREATE INDEX IF NOT EXISTS idx_email_audit_recipient ON email_audit_log(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_audit_pedido ON email_audit_log(pedido_id);

-- RLS para email_audit_log
ALTER TABLE email_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all email logs" ON email_audit_log;
CREATE POLICY "Admins can view all email logs"
ON email_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin', 'admin_marketing')
  )
);

DROP POLICY IF EXISTS "System can insert email logs" ON email_audit_log;
CREATE POLICY "System can insert email logs"
ON email_audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- 1.2: Normalizar pedidos existentes
DO $$
DECLARE
  pedido_record RECORD;
  building_ids_array uuid[];
  panel_ids_array uuid[];
  item_id uuid;
  temp_building_id uuid;
BEGIN
  FOR pedido_record IN 
    SELECT id, lista_paineis, lista_predios, status
    FROM pedidos
    WHERE status IN ('ativo', 'pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado')
  LOOP
    building_ids_array := ARRAY[]::uuid[];
    panel_ids_array := ARRAY[]::uuid[];
    
    -- Processar lista_paineis atual
    IF pedido_record.lista_paineis IS NOT NULL AND array_length(pedido_record.lista_paineis, 1) > 0 THEN
      FOREACH item_id IN ARRAY pedido_record.lista_paineis::uuid[]
      LOOP
        IF EXISTS (SELECT 1 FROM buildings WHERE id = item_id) THEN
          building_ids_array := array_append(building_ids_array, item_id);
        ELSIF EXISTS (SELECT 1 FROM painels WHERE id = item_id) THEN
          panel_ids_array := array_append(panel_ids_array, item_id);
          SELECT p.building_id INTO temp_building_id FROM painels p WHERE p.id = item_id;
          IF temp_building_id IS NOT NULL THEN
            building_ids_array := array_append(building_ids_array, temp_building_id);
          END IF;
        END IF;
      END LOOP;
    END IF;
    
    -- Processar lista_predios existente
    IF pedido_record.lista_predios IS NOT NULL AND array_length(pedido_record.lista_predios, 1) > 0 THEN
      FOREACH item_id IN ARRAY pedido_record.lista_predios::uuid[]
      LOOP
        IF EXISTS (SELECT 1 FROM buildings WHERE id = item_id) THEN
          building_ids_array := array_append(building_ids_array, item_id);
        END IF;
      END LOOP;
    END IF;
    
    building_ids_array := ARRAY(SELECT DISTINCT unnest(building_ids_array));
    
    IF building_ids_array IS NOT NULL AND array_length(building_ids_array, 1) > 0 THEN
      UPDATE pedidos SET lista_predios = building_ids_array WHERE id = pedido_record.id;
    END IF;
  END LOOP;
END $$;

-- 1.3: Criar função para campanhas ativas por prédio
CREATE OR REPLACE FUNCTION get_building_active_campaigns(p_building_id uuid)
RETURNS TABLE (
  pedido_id uuid,
  client_id uuid,
  client_email text,
  client_name text,
  status text,
  data_inicio date,
  data_fim date,
  plano_meses int,
  valor_total numeric,
  video_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.client_id, u.email, COALESCE(u.nome, u.email),
    p.status, p.data_inicio, p.data_fim, p.plano_meses, p.valor_total,
    COUNT(DISTINCT pv.video_id) as video_count
  FROM pedidos p
  INNER JOIN users u ON u.id = p.client_id
  LEFT JOIN pedido_videos pv ON pv.pedido_id = p.id 
    AND pv.approval_status = 'approved' AND pv.is_active = true
  WHERE p.status IN ('ativo', 'pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado')
    AND p.lista_predios @> ARRAY[p_building_id]
  GROUP BY p.id, p.client_id, u.email, u.nome, p.status, p.data_inicio, p.data_fim, p.plano_meses, p.valor_total
  ORDER BY p.created_at DESC;
END;
$$;

-- 1.4: Recriar função de contagem de vídeos
DROP FUNCTION IF EXISTS get_buildings_current_video_count(uuid[]);

CREATE FUNCTION get_buildings_current_video_count(p_building_ids uuid[])
RETURNS TABLE (
  building_id uuid,
  current_videos_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest_id as building_id,
    COALESCE(COUNT(DISTINCT pv.video_id), 0)::bigint as current_videos_count
  FROM unnest(p_building_ids) as unnest_id
  LEFT JOIN pedidos p ON p.lista_predios @> ARRAY[unnest_id]
    AND p.status IN ('ativo', 'pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado')
  LEFT JOIN pedido_videos pv ON pv.pedido_id = p.id
    AND pv.approval_status = 'approved'
    AND pv.is_active = true
    AND pv.selected_for_display = true
  GROUP BY unnest_id;
END;
$$;