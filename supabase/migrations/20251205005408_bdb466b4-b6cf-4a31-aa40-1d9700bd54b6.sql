-- Criar tabela para histórico de autocomplete por usuário
CREATE TABLE public.user_autocomplete_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL,
  field_value TEXT NOT NULL,
  display_label TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  frequency INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, field_type, field_value)
);

-- Índices para buscas rápidas
CREATE INDEX idx_autocomplete_user_type ON public.user_autocomplete_history(user_id, field_type);
CREATE INDEX idx_autocomplete_search ON public.user_autocomplete_history(field_value text_pattern_ops);
CREATE INDEX idx_autocomplete_frequency ON public.user_autocomplete_history(frequency DESC, last_used_at DESC);

-- Habilitar RLS
ALTER TABLE public.user_autocomplete_history ENABLE ROW LEVEL SECURITY;

-- Política: usuários só acessam seus próprios dados
CREATE POLICY "Users can manage own autocomplete history"
  ON public.user_autocomplete_history
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Função RPC para upsert inteligente (incrementa frequência se já existe)
CREATE OR REPLACE FUNCTION public.upsert_autocomplete_history(
  p_field_type TEXT,
  p_field_value TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_display_label TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_autocomplete_history (user_id, field_type, field_value, metadata, display_label, frequency, last_used_at)
  VALUES (auth.uid(), p_field_type, p_field_value, COALESCE(p_metadata, '{}'::jsonb), p_display_label, 1, NOW())
  ON CONFLICT (user_id, field_type, field_value)
  DO UPDATE SET
    frequency = public.user_autocomplete_history.frequency + 1,
    last_used_at = NOW(),
    metadata = COALESCE(p_metadata, public.user_autocomplete_history.metadata),
    display_label = COALESCE(p_display_label, public.user_autocomplete_history.display_label);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;