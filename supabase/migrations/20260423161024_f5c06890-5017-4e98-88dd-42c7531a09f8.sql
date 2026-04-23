-- =========================================
-- MIGRATION 2: Expandir sindicos_interessados
-- =========================================
ALTER TABLE public.sindicos_interessados
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS endereco_logradouro text,
  ADD COLUMN IF NOT EXISTS endereco_numero text,
  ADD COLUMN IF NOT EXISTS endereco_bairro text,
  ADD COLUMN IF NOT EXISTS endereco_cidade text,
  ADD COLUMN IF NOT EXISTS endereco_uf text,
  ADD COLUMN IF NOT EXISTS endereco_complemento text,
  ADD COLUMN IF NOT EXISTS endereco_latitude numeric(10,8),
  ADD COLUMN IF NOT EXISTS endereco_longitude numeric(11,8),
  ADD COLUMN IF NOT EXISTS endereco_google_place_id text,
  ADD COLUMN IF NOT EXISTS quantidade_andares integer,
  ADD COLUMN IF NOT EXISTS quantidade_blocos integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS quantidade_unidades_total integer,
  ADD COLUMN IF NOT EXISTS quantidade_elevadores_sociais integer,
  ADD COLUMN IF NOT EXISTS internet_operadoras text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS empresa_elevador text,
  ADD COLUMN IF NOT EXISTS sindico_nome text,
  ADD COLUMN IF NOT EXISTS sindico_cpf text,
  ADD COLUMN IF NOT EXISTS sindico_whatsapp text,
  ADD COLUMN IF NOT EXISTS sindico_email text,
  ADD COLUMN IF NOT EXISTS sindico_mandato_ate date,
  ADD COLUMN IF NOT EXISTS aceite_timestamp timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS aceite_ip text,
  ADD COLUMN IF NOT EXISTS aceite_user_agent text,
  ADD COLUMN IF NOT EXISTS aceite_pdf_url text,
  ADD COLUMN IF NOT EXISTS fotos_elevador_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS observacoes_internas text,
  ADD COLUMN IF NOT EXISTS visita_agendada_em timestamptz,
  ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES auth.users(id);

-- Trigger de validação
CREATE OR REPLACE FUNCTION public.validar_sindico_interessado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.empresa_elevador IS NOT NULL
     AND NEW.empresa_elevador NOT IN ('Atlas','TKE','Otis','Oriente') THEN
    RAISE EXCEPTION 'empresa_elevador inválida: %', NEW.empresa_elevador;
  END IF;
  IF NEW.status NOT IN ('novo','em_contato','visita_agendada','aprovado','instalado','recusado','arquivado','contatado','interessado','nao_interessado') THEN
    RAISE EXCEPTION 'status inválido: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_sindico ON public.sindicos_interessados;
CREATE TRIGGER trg_validar_sindico
  BEFORE INSERT OR UPDATE ON public.sindicos_interessados
  FOR EACH ROW EXECUTE FUNCTION public.validar_sindico_interessado();

-- Índices
CREATE INDEX IF NOT EXISTS idx_sindicos_status ON public.sindicos_interessados(status);
CREATE INDEX IF NOT EXISTS idx_sindicos_created ON public.sindicos_interessados(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sindicos_cidade ON public.sindicos_interessados(endereco_cidade);

-- =========================================
-- MIGRATION 3: RLS sindicos_interessados
-- =========================================
DROP POLICY IF EXISTS "Allow public form submissions to sindicos interessados" ON public.sindicos_interessados;
DROP POLICY IF EXISTS "Deny all direct access to sindicos interessados" ON public.sindicos_interessados;

ALTER TABLE public.sindicos_interessados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publico_pode_submeter_interesse"
  ON public.sindicos_interessados FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "admins_podem_ver_leads"
  ON public.sindicos_interessados FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'gestor_comercial'::app_role)
    OR public.has_role(auth.uid(), 'diretora_operacoes'::app_role)
  );

CREATE POLICY "admins_podem_atualizar_leads"
  ON public.sindicos_interessados FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'gestor_comercial'::app_role)
    OR public.has_role(auth.uid(), 'diretora_operacoes'::app_role)
  );

-- =========================================
-- MIGRATION 4: configuracoes_notificacoes_sindicos
-- =========================================
CREATE TABLE IF NOT EXISTS public.configuracoes_notificacoes_sindicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp text NOT NULL,
  receber_notificacoes boolean NOT NULL DEFAULT true,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes_notificacoes_sindicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_gerenciam_notificacoes" ON public.configuracoes_notificacoes_sindicos;
CREATE POLICY "admins_gerenciam_notificacoes"
  ON public.configuracoes_notificacoes_sindicos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP TRIGGER IF EXISTS trg_notif_sindicos_updated ON public.configuracoes_notificacoes_sindicos;
CREATE TRIGGER trg_notif_sindicos_updated
  BEFORE UPDATE ON public.configuracoes_notificacoes_sindicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- MIGRATION 5: Storage buckets + policies
-- =========================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('termos-sindicos','termos-sindicos', false),
  ('fotos-sindicos','fotos-sindicos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "termos_sindicos_anon_insert" ON storage.objects;
CREATE POLICY "termos_sindicos_anon_insert"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'termos-sindicos');

DROP POLICY IF EXISTS "termos_sindicos_admin_select" ON storage.objects;
CREATE POLICY "termos_sindicos_admin_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'termos-sindicos' AND (
      public.has_role(auth.uid(),'admin'::app_role)
      OR public.has_role(auth.uid(),'super_admin'::app_role)
      OR public.has_role(auth.uid(),'gestor_comercial'::app_role)
      OR public.has_role(auth.uid(),'diretora_operacoes'::app_role)
    )
  );

DROP POLICY IF EXISTS "fotos_sindicos_anon_insert" ON storage.objects;
CREATE POLICY "fotos_sindicos_anon_insert"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'fotos-sindicos');

DROP POLICY IF EXISTS "fotos_sindicos_admin_select" ON storage.objects;
CREATE POLICY "fotos_sindicos_admin_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'fotos-sindicos' AND (
      public.has_role(auth.uid(),'admin'::app_role)
      OR public.has_role(auth.uid(),'super_admin'::app_role)
      OR public.has_role(auth.uid(),'gestor_comercial'::app_role)
      OR public.has_role(auth.uid(),'diretora_operacoes'::app_role)
    )
  );