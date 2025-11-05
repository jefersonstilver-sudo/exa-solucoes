-- ============================================
-- FASE 1: CRM - FUNDAÇÃO (DATABASE)
-- ============================================

-- Tabela para armazenar análise comportamental dos clientes
CREATE TABLE IF NOT EXISTS public.client_behavior_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Dados de navegação
  total_sessions INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0, -- em segundos
  pages_visited JSONB DEFAULT '{}'::jsonb, -- { "/home": 120, "/predios": 300 }
  last_visit TIMESTAMPTZ,
  device_type TEXT, -- mobile, desktop, tablet
  
  -- Interesse em prédios
  buildings_viewed JSONB DEFAULT '[]'::jsonb, -- [{ building_id, time_spent, views_count }]
  buildings_in_cart JSONB DEFAULT '[]'::jsonb,
  most_viewed_building_id UUID REFERENCES public.buildings(id),
  avg_time_per_building INTEGER DEFAULT 0,
  
  -- Comportamento de vídeos
  videos_watched JSONB DEFAULT '[]'::jsonb, -- [{ video_id, watch_duration, completed }]
  total_video_time INTEGER DEFAULT 0,
  video_completion_rate NUMERIC DEFAULT 0,
  
  -- Comportamento de compra
  cart_abandonments INTEGER DEFAULT 0,
  checkout_starts INTEGER DEFAULT 0,
  purchase_intent_score NUMERIC DEFAULT 0, -- 0-100
  
  -- Análise por IA
  ai_behavior_summary TEXT,
  ai_interest_level TEXT, -- low, medium, high, very_high
  ai_recommended_actions JSONB DEFAULT '[]'::jsonb,
  last_ai_analysis TIMESTAMPTZ,
  
  UNIQUE(user_id)
);

-- Índices para performance
CREATE INDEX idx_client_behavior_user_id ON public.client_behavior_analytics(user_id);
CREATE INDEX idx_client_behavior_last_visit ON public.client_behavior_analytics(last_visit DESC);
CREATE INDEX idx_client_behavior_intent_score ON public.client_behavior_analytics(purchase_intent_score DESC);

-- Tabela para notas CRM
CREATE TABLE IF NOT EXISTS public.client_crm_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note_type TEXT NOT NULL, -- call, email, meeting, observation, follow_up
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false
);

CREATE INDEX idx_crm_notes_client_id ON public.client_crm_notes(client_id);
CREATE INDEX idx_crm_notes_created_at ON public.client_crm_notes(created_at DESC);

-- RPC: Buscar dados unificados do cliente para CRM
CREATE OR REPLACE FUNCTION public.get_unified_client_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
  v_user_data JSONB;
  v_orders_data JSONB;
  v_attempts_data JSONB;
  v_behavior_data JSONB;
  v_notes_data JSONB;
BEGIN
  -- Apenas admins podem acessar
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can access CRM data';
  END IF;

  -- Dados do usuário
  SELECT jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'role', u.role,
    'cpf', u.cpf,
    'telefone', u.telefone,
    'avatar_url', u.avatar_url,
    'created_at', u.data_criacao,
    'name', au.raw_user_meta_data->>'name',
    'phone', au.raw_user_meta_data->>'phone'
  ) INTO v_user_data
  FROM public.users u
  LEFT JOIN auth.users au ON au.id = u.id
  WHERE u.id = p_user_id;

  -- Dados de pedidos
  SELECT jsonb_build_object(
    'total_orders', COUNT(*),
    'total_spent', COALESCE(SUM(valor_total), 0),
    'orders', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'status', p.status,
        'valor_total', p.valor_total,
        'created_at', p.created_at,
        'data_inicio', p.data_inicio,
        'data_fim', p.data_fim,
        'lista_predios', p.lista_predios,
        'plano_meses', p.plano_meses
      ) ORDER BY p.created_at DESC
    ), '[]'::jsonb)
  ) INTO v_orders_data
  FROM public.pedidos p
  WHERE p.client_id = p_user_id
  AND p.status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado', 'video_enviado');

  -- Dados de tentativas
  SELECT jsonb_build_object(
    'total_attempts', COUNT(*),
    'total_abandoned_value', COALESCE(SUM(valor_total), 0),
    'attempts', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'valor_total', t.valor_total,
        'created_at', t.created_at,
        'predios_selecionados', t.predios_selecionados
      ) ORDER BY t.created_at DESC
    ), '[]'::jsonb)
  ) INTO v_attempts_data
  FROM public.tentativas_compra t
  WHERE t.id_user = p_user_id;

  -- Dados comportamentais
  SELECT to_jsonb(cba.*) INTO v_behavior_data
  FROM public.client_behavior_analytics cba
  WHERE cba.user_id = p_user_id;

  -- Notas CRM
  SELECT jsonb_build_object(
    'total_notes', COUNT(*),
    'notes', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', n.id,
        'note_type', n.note_type,
        'content', n.content,
        'is_important', n.is_important,
        'created_at', n.created_at,
        'created_by_name', au.raw_user_meta_data->>'name'
      ) ORDER BY n.created_at DESC
    ), '[]'::jsonb)
  ) INTO v_notes_data
  FROM public.client_crm_notes n
  LEFT JOIN auth.users au ON au.id = n.created_by
  WHERE n.client_id = p_user_id;

  -- Montar resultado final
  v_result := jsonb_build_object(
    'user', v_user_data,
    'orders', v_orders_data,
    'attempts', v_attempts_data,
    'behavior', COALESCE(v_behavior_data, '{}'::jsonb),
    'notes', v_notes_data
  );

  RETURN v_result;
END;
$$;

-- RLS Policies
ALTER TABLE public.client_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_crm_notes ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar analytics
CREATE POLICY "Admins can manage client behavior analytics"
ON public.client_behavior_analytics
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Admins podem gerenciar notas CRM
CREATE POLICY "Admins can manage CRM notes"
ON public.client_crm_notes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_client_behavior_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_behavior_updated_at
BEFORE UPDATE ON public.client_behavior_analytics
FOR EACH ROW
EXECUTE FUNCTION update_client_behavior_updated_at();