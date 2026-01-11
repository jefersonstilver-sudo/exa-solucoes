-- =====================================================
-- DOSSIÊ FINANCEIRO - Tabelas de Suporte
-- =====================================================

-- 1. Tabela de Comprovantes (múltiplos por lançamento)
CREATE TABLE public.lancamento_comprovantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id TEXT NOT NULL,
  lancamento_tipo TEXT NOT NULL CHECK (lancamento_tipo IN ('asaas', 'asaas_saida', 'despesa')),
  tipo_comprovante TEXT NOT NULL CHECK (tipo_comprovante IN ('nota_fiscal', 'recibo', 'comprovante_pix', 'boleto', 'contrato', 'outro')),
  arquivo_url TEXT NOT NULL,
  arquivo_nome TEXT,
  arquivo_tamanho_kb INTEGER,
  observacao TEXT,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Observações (histórico de notas)
CREATE TABLE public.lancamento_observacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id TEXT NOT NULL,
  lancamento_tipo TEXT NOT NULL CHECK (lancamento_tipo IN ('asaas', 'asaas_saida', 'despesa')),
  conteudo TEXT NOT NULL,
  autor_id UUID REFERENCES public.users(id),
  autor_nome TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Áudios (gravações + transcrição)
CREATE TABLE public.lancamento_audios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id TEXT NOT NULL,
  lancamento_tipo TEXT NOT NULL CHECK (lancamento_tipo IN ('asaas', 'asaas_saida', 'despesa')),
  audio_url TEXT NOT NULL,
  duracao_segundos INTEGER,
  transcricao TEXT,
  transcricao_editada TEXT,
  gravado_por UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Histórico/Auditoria (IMUTÁVEL)
CREATE TABLE public.lancamento_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id TEXT NOT NULL,
  lancamento_tipo TEXT NOT NULL CHECK (lancamento_tipo IN ('asaas', 'asaas_saida', 'despesa')),
  acao TEXT NOT NULL,
  campo_alterado TEXT,
  valor_anterior JSONB,
  valor_novo JSONB,
  usuario_id UUID REFERENCES public.users(id),
  usuario_nome TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_lancamento_comprovantes_lancamento ON public.lancamento_comprovantes(lancamento_id, lancamento_tipo);
CREATE INDEX idx_lancamento_observacoes_lancamento ON public.lancamento_observacoes(lancamento_id, lancamento_tipo);
CREATE INDEX idx_lancamento_audios_lancamento ON public.lancamento_audios(lancamento_id, lancamento_tipo);
CREATE INDEX idx_lancamento_historico_lancamento ON public.lancamento_historico(lancamento_id, lancamento_tipo);
CREATE INDEX idx_lancamento_historico_created ON public.lancamento_historico(created_at DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Comprovantes
ALTER TABLE public.lancamento_comprovantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver comprovantes" ON public.lancamento_comprovantes
  FOR SELECT USING (public.has_any_admin_role());

CREATE POLICY "Admins podem inserir comprovantes" ON public.lancamento_comprovantes
  FOR INSERT WITH CHECK (public.has_any_admin_role());

CREATE POLICY "Admins podem deletar comprovantes" ON public.lancamento_comprovantes
  FOR DELETE USING (public.has_any_admin_role());

-- Observações
ALTER TABLE public.lancamento_observacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver observacoes" ON public.lancamento_observacoes
  FOR SELECT USING (public.has_any_admin_role());

CREATE POLICY "Admins podem inserir observacoes" ON public.lancamento_observacoes
  FOR INSERT WITH CHECK (public.has_any_admin_role());

-- Áudios
ALTER TABLE public.lancamento_audios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver audios" ON public.lancamento_audios
  FOR SELECT USING (public.has_any_admin_role());

CREATE POLICY "Admins podem inserir audios" ON public.lancamento_audios
  FOR INSERT WITH CHECK (public.has_any_admin_role());

CREATE POLICY "Admins podem deletar audios" ON public.lancamento_audios
  FOR DELETE USING (public.has_any_admin_role());

-- Histórico (SOMENTE LEITURA para usuários, INSERT via trigger/função)
ALTER TABLE public.lancamento_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver historico" ON public.lancamento_historico
  FOR SELECT USING (public.has_any_admin_role());

CREATE POLICY "Admins podem inserir historico" ON public.lancamento_historico
  FOR INSERT WITH CHECK (public.has_any_admin_role());

-- =====================================================
-- STORAGE BUCKET para comprovantes
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lancamento-comprovantes',
  'lancamento-comprovantes',
  false,
  104857600, -- 100MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins podem fazer upload de comprovantes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lancamento-comprovantes' 
  AND public.has_any_admin_role()
);

CREATE POLICY "Admins podem ver comprovantes storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lancamento-comprovantes' 
  AND public.has_any_admin_role()
);

CREATE POLICY "Admins podem deletar comprovantes storage"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lancamento-comprovantes' 
  AND public.has_any_admin_role()
);

-- =====================================================
-- STORAGE BUCKET para áudios
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lancamento-audios',
  'lancamento-audios',
  false,
  52428800, -- 50MB
  ARRAY['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies para áudios
CREATE POLICY "Admins podem fazer upload de audios"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lancamento-audios' 
  AND public.has_any_admin_role()
);

CREATE POLICY "Admins podem ver audios storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lancamento-audios' 
  AND public.has_any_admin_role()
);

CREATE POLICY "Admins podem deletar audios storage"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lancamento-audios' 
  AND public.has_any_admin_role()
);