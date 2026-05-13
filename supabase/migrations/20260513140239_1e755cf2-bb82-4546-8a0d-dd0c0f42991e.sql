
-- ============================================================
-- PARTE A — Refatoração de segurança das 3 superfícies públicas
-- ============================================================

-- A2. configuracoes_empresa: bloquear leitura pública direta + RPC pública filtrada
DROP POLICY IF EXISTS "Leitura pública configuracoes_empresa" ON public.configuracoes_empresa;

-- Garantir RLS ativo
ALTER TABLE public.configuracoes_empresa ENABLE ROW LEVEL SECURITY;

-- Admins podem ler tudo (inclusive dados do representante)
DROP POLICY IF EXISTS "Admins leem configuracoes_empresa completo" ON public.configuracoes_empresa;
CREATE POLICY "Admins leem configuracoes_empresa completo"
ON public.configuracoes_empresa
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','super_admin'))
);

-- RPC pública: SOMENTE campos institucionais. JAMAIS representante_cpf/rg/email.
CREATE OR REPLACE FUNCTION public.get_public_company_info()
RETURNS TABLE (
  id uuid,
  razao_social text,
  nome_fantasia text,
  cnpj text,
  inscricao_estadual text,
  inscricao_municipal text,
  endereco_logradouro text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_estado text,
  endereco_cep text,
  representante_nome text,
  representante_cargo text,
  telefone_principal text,
  email_institucional text,
  whatsapp_comercial text,
  website text,
  instagram text,
  foro_comarca text,
  foro_estado text,
  multa_rescisao_percentual numeric,
  prazo_aviso_rescisao_dias integer,
  indice_reajuste text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id, razao_social, nome_fantasia, cnpj,
    inscricao_estadual, inscricao_municipal,
    endereco_logradouro, endereco_numero, endereco_complemento,
    endereco_bairro, endereco_cidade, endereco_estado, endereco_cep,
    representante_nome, representante_cargo,
    telefone_principal, email_institucional, whatsapp_comercial,
    website, instagram,
    foro_comarca, foro_estado,
    multa_rescisao_percentual, prazo_aviso_rescisao_dias, indice_reajuste
  FROM public.configuracoes_empresa
  WHERE is_active = true
  ORDER BY id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_company_info() TO anon, authenticated;

-- ============================================================
-- A1. proposals: tighten public SELECT (USING true -> requer access_token)
-- ============================================================
DROP POLICY IF EXISTS "Acesso público via token" ON public.proposals;
CREATE POLICY "Acesso público via token"
ON public.proposals
FOR SELECT
TO public
USING (access_token IS NOT NULL);

-- ============================================================
-- A3. painels: remover policies amplas USING true; manter só rotas legítimas
-- ============================================================
-- A leitura pública geral (USING true) era perigosa: expunha senha_anydesk e token_acesso.
DROP POLICY IF EXISTS "Permitir leitura pública de painéis para vinculação" ON public.painels;

-- Permanece public_access_painels_by_token (USING token_acesso IS NOT NULL) que é a rota legítima do kiosk.
-- Para o fluxo "PainelAguardandoVinculo" que consulta por id, criamos RPC dedicada.
CREATE OR REPLACE FUNCTION public.get_painel_pairing_info(_painel_id uuid)
RETURNS TABLE (
  id uuid,
  building_id uuid,
  status text,
  status_vinculo text,
  numero_painel text,
  codigo_vinculacao varchar,
  building_nome text,
  building_endereco text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.building_id,
    p.status,
    p.status_vinculo,
    p.numero_painel,
    p.codigo_vinculacao,
    b.nome  AS building_nome,
    b.endereco AS building_endereco
  FROM public.painels p
  LEFT JOIN public.buildings b ON b.id = p.building_id
  WHERE p.id = _painel_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_painel_pairing_info(uuid) TO anon, authenticated;

-- A UPDATE pública (USING true) também era ampla. Tightening: só painéis ainda não conectados
-- ou que possuem token podem ser atualizados pelo público (kiosk).
DROP POLICY IF EXISTS "Permitir vinculação pública de painéis" ON public.painels;
CREATE POLICY "Permitir vinculação pública de painéis"
ON public.painels
FOR UPDATE
TO public
USING (token_acesso IS NOT NULL OR status_vinculo = 'aguardando' OR codigo_vinculacao IS NOT NULL)
WITH CHECK (token_acesso IS NOT NULL OR status_vinculo IN ('aguardando','conectado') OR codigo_vinculacao IS NOT NULL);
