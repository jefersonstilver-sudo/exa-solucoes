-- Tabela para rastreamento completo de comportamento do usuário
CREATE TABLE IF NOT EXISTS public.user_behavior_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'page_view', 'search', 'building_click', 'cart_add', 'map_pin_click', etc
  event_data JSONB NOT NULL DEFAULT '{}',
  page_url TEXT,
  page_title TEXT,
  time_spent_seconds INTEGER,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_user_behavior_tracking_user_id ON public.user_behavior_tracking(user_id);
CREATE INDEX idx_user_behavior_tracking_session_id ON public.user_behavior_tracking(session_id);
CREATE INDEX idx_user_behavior_tracking_event_type ON public.user_behavior_tracking(event_type);
CREATE INDEX idx_user_behavior_tracking_created_at ON public.user_behavior_tracking(created_at DESC);
CREATE INDEX idx_user_behavior_tracking_event_data ON public.user_behavior_tracking USING GIN(event_data);

-- RLS Policies
ALTER TABLE public.user_behavior_tracking ENABLE ROW LEVEL SECURITY;

-- Super admins podem ver tudo
CREATE POLICY "Super admins can view all tracking data"
  ON public.user_behavior_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role') = 'super_admin'
    )
  );

-- Usuários podem inserir seus próprios eventos
CREATE POLICY "Users can insert their own tracking events"
  ON public.user_behavior_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Permitir inserção anônima para visitantes (sem user_id)
CREATE POLICY "Anonymous users can insert tracking events"
  ON public.user_behavior_tracking
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Função para buscar comportamento do usuário
CREATE OR REPLACE FUNCTION public.get_user_behavior_summary(target_user_id UUID)
RETURNS TABLE(
  total_events BIGINT,
  page_views JSONB,
  searches JSONB,
  buildings_clicked JSONB,
  cart_interactions JSONB,
  map_interactions JSONB,
  time_by_page JSONB,
  first_visit TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE,
  total_sessions BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_events,
    
    -- Page views agrupados
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('page', page_url, 'count', count, 'avg_time', avg_time))
       FROM (
         SELECT page_url, COUNT(*) as count, AVG(time_spent_seconds) as avg_time
         FROM public.user_behavior_tracking
         WHERE user_id = target_user_id AND event_type = 'page_view'
         GROUP BY page_url
       ) pv),
      '[]'::jsonb
    ) as page_views,
    
    -- Buscas realizadas
    COALESCE(
      (SELECT jsonb_agg(event_data)
       FROM public.user_behavior_tracking
       WHERE user_id = target_user_id AND event_type = 'search'
       ORDER BY created_at DESC
       LIMIT 20),
      '[]'::jsonb
    ) as searches,
    
    -- Prédios clicados
    COALESCE(
      (SELECT jsonb_agg(DISTINCT event_data->'building')
       FROM public.user_behavior_tracking
       WHERE user_id = target_user_id AND event_type IN ('building_click', 'building_view')),
      '[]'::jsonb
    ) as buildings_clicked,
    
    -- Interações com carrinho
    COALESCE(
      (SELECT jsonb_agg(event_data ORDER BY created_at DESC)
       FROM public.user_behavior_tracking
       WHERE user_id = target_user_id AND event_type LIKE 'cart_%'
       LIMIT 10),
      '[]'::jsonb
    ) as cart_interactions,
    
    -- Interações com mapa
    COALESCE(
      (SELECT jsonb_agg(event_data ORDER BY created_at DESC)
       FROM public.user_behavior_tracking
       WHERE user_id = target_user_id AND event_type LIKE 'map_%'
       LIMIT 20),
      '[]'::jsonb
    ) as map_interactions,
    
    -- Tempo por página
    COALESCE(
      (SELECT jsonb_object_agg(page_url, total_time)
       FROM (
         SELECT page_url, SUM(time_spent_seconds) as total_time
         FROM public.user_behavior_tracking
         WHERE user_id = target_user_id AND event_type = 'page_view'
         GROUP BY page_url
       ) t),
      '{}'::jsonb
    ) as time_by_page,
    
    MIN(created_at) as first_visit,
    MAX(created_at) as last_activity,
    COUNT(DISTINCT session_id)::BIGINT as total_sessions
    
  FROM public.user_behavior_tracking
  WHERE user_id = target_user_id;
END;
$$;

COMMENT ON TABLE public.user_behavior_tracking IS 'Rastreamento completo de comportamento do usuário no site para análise de CRM e estratégia de vendas';
COMMENT ON FUNCTION public.get_user_behavior_summary IS 'Retorna resumo agregado do comportamento de um usuário específico';