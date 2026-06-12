
CREATE TABLE public.predios_cadastro_externo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT,
  endereco TEXT NOT NULL,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  tipo_predio TEXT,
  numero_unidades INTEGER,
  numero_andares INTEGER,
  numero_blocos INTEGER,
  sindico_nome TEXT,
  sindico_contato TEXT,
  vice_sindico_nome TEXT,
  vice_sindico_contato TEXT,
  contato_portaria TEXT,
  telefone_principal TEXT,
  caracteristicas TEXT[] DEFAULT '{}',
  outras_caracteristicas TEXT,
  fotos_urls TEXT[] DEFAULT '{}',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  building_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.predios_cadastro_externo TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predios_cadastro_externo TO authenticated;
GRANT ALL ON public.predios_cadastro_externo TO service_role;

ALTER TABLE public.predios_cadastro_externo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode cadastrar predio (publico)"
  ON public.predios_cadastro_externo
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Super admin pode visualizar cadastros predio"
  ON public.predios_cadastro_externo
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin pode atualizar cadastros predio"
  ON public.predios_cadastro_externo
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin pode deletar cadastros predio"
  ON public.predios_cadastro_externo
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_predios_cadastro_externo_updated
BEFORE UPDATE ON public.predios_cadastro_externo
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
