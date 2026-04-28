CREATE TABLE IF NOT EXISTS public.roteiros_gerados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  segment text NOT NULL,
  format text NOT NULL CHECK (format IN ('vertical', 'horizontal')),
  video_count integer NOT NULL CHECK (video_count BETWEEN 1 AND 10),
  tone text,
  has_qr_code boolean DEFAULT false,
  blueprint_types text[],
  roteiro_content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roteiros_gerados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roteiros"
  ON public.roteiros_gerados FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roteiros"
  ON public.roteiros_gerados FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own roteiros"
  ON public.roteiros_gerados FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS roteiros_gerados_user_id_created_at_idx
  ON public.roteiros_gerados (user_id, created_at DESC);