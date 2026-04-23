

# Plano: Estrutura Completa Síndicos Interessados

## Diagnóstico do estado atual

- ✅ Tabela `sindicos_interessados` **JÁ EXISTE** com schema antigo/simplificado (16 colunas, 2 registros legados)
- ✅ Enum `app_role` existe com 13 valores; **falta** `gestor_comercial` e `diretora_operacoes`
- ✅ Função `has_role(uuid, app_role)` existe — vou reutilizar
- ❌ Tabela `configuracoes_notificacoes_sindicos` não existe
- ❌ Buckets `termos-sindicos` e `fotos-sindicos` não existem
- ⚠️ RLS atual da tabela tem policy "Deny all" que bloqueia tudo — precisa ser substituída

## Estratégia

Como a tabela existente tem **2 registros legados** com schema diferente, vou **preservar os dados** via `ALTER TABLE ADD COLUMN` (não DROP). As colunas antigas (`nome_completo`, `endereco`, `numero_andares`, `numero_unidades`, `email`, `celular`, `primeiro_nome`, `sobrenome`, `responsavel_contato`, `data_contato`, `observacoes`) ficam como **legado nullable** — não vou removê-las para não perder histórico nem quebrar `SindicosTable.tsx` e `SindicoDetailsDialog.tsx` que ainda as leem.

## Migration 1 — Enum de roles

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor_comercial';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'diretora_operacoes';
```
*(commit separado — Postgres exige enum changes fora de transação com outras DDL)*

## Migration 2 — Expandir `sindicos_interessados`

```sql
-- Dados do prédio (novos)
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
  -- Síndico
  ADD COLUMN IF NOT EXISTS sindico_nome text,
  ADD COLUMN IF NOT EXISTS sindico_cpf text,
  ADD COLUMN IF NOT EXISTS sindico_whatsapp text,
  ADD COLUMN IF NOT EXISTS sindico_email text,
  ADD COLUMN IF NOT EXISTS sindico_mandato_ate date,
  -- Aceite jurídico
  ADD COLUMN IF NOT EXISTS aceite_timestamp timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS aceite_ip text,
  ADD COLUMN IF NOT EXISTS aceite_user_agent text,
  ADD COLUMN IF NOT EXISTS aceite_pdf_url text,
  -- Anexos
  ADD COLUMN IF NOT EXISTS fotos_elevador_urls text[] DEFAULT '{}',
  -- Operação
  ADD COLUMN IF NOT EXISTS observacoes_internas text,
  ADD COLUMN IF NOT EXISTS visita_agendada_em timestamptz,
  ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES auth.users(id);

-- Validação via TRIGGER (não CHECK — projeto exige triggers para validação)
CREATE OR REPLACE FUNCTION public.validar_sindico_interessado()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.empresa_elevador IS NOT NULL 
     AND NEW.empresa_elevador NOT IN ('Atlas','TKE','Otis','Oriente') THEN
    RAISE EXCEPTION 'empresa_elevador inválida: %', NEW.empresa_elevador;
  END IF;
  IF NEW.status NOT IN ('novo','em_contato','visita_agendada','aprovado','instalado','recusado','arquivado','contatado','interessado','nao_interessado') THEN
    RAISE EXCEPTION 'status inválido: %', NEW.status;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validar_sindico ON public.sindicos_interessados;
CREATE TRIGGER trg_validar_sindico
  BEFORE INSERT OR UPDATE ON public.sindicos_interessados
  FOR EACH ROW EXECUTE FUNCTION public.validar_sindico_interessado();

-- Índices
CREATE INDEX IF NOT EXISTS idx_sindicos_status ON public.sindicos_interessados(status);
CREATE INDEX IF NOT EXISTS idx_sindicos_created ON public.sindicos_interessados(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sindicos_cidade ON public.sindicos_interessados(endereco_cidade);
```

> **Nota:** mantenho status legados (`contatado`,`interessado`,`nao_interessado`) na validação porque os 2 registros antigos podem usar.

## Migration 3 — Reescrever RLS de `sindicos_interessados`

```sql
-- Remove policies antigas conflitantes
DROP POLICY IF EXISTS "Allow public form submissions to sindicos interessados" ON public.sindicos_interessados;
DROP POLICY IF EXISTS "Deny all direct access to sindicos interessados" ON public.sindicos_interessados;

ALTER TABLE public.sindicos_interessados ENABLE ROW LEVEL SECURITY;

-- Público pode submeter (formulário /interessesindico)
CREATE POLICY "publico_pode_submeter_interesse"
  ON public.sindicos_interessados FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins veem leads
CREATE POLICY "admins_podem_ver_leads"
  ON public.sindicos_interessados FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'gestor_comercial'::app_role)
    OR public.has_role(auth.uid(), 'diretora_operacoes'::app_role)
  );

-- Admins atualizam leads
CREATE POLICY "admins_podem_atualizar_leads"
  ON public.sindicos_interessados FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'gestor_comercial'::app_role)
    OR public.has_role(auth.uid(), 'diretora_operacoes'::app_role)
  );
```

## Migration 4 — `configuracoes_notificacoes_sindicos`

```sql
CREATE TABLE public.configuracoes_notificacoes_sindicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp text NOT NULL,
  receber_notificacoes boolean NOT NULL DEFAULT true,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes_notificacoes_sindicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_gerenciam_notificacoes"
  ON public.configuracoes_notificacoes_sindicos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER trg_notif_sindicos_updated
  BEFORE UPDATE ON public.configuracoes_notificacoes_sindicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## Migration 5 — Storage buckets privados + policies

```sql
INSERT INTO storage.buckets (id, name, public) VALUES
  ('termos-sindicos','termos-sindicos', false),
  ('fotos-sindicos','fotos-sindicos', false)
ON CONFLICT (id) DO NOTHING;

-- termos-sindicos: anon INSERT, admins SELECT
CREATE POLICY "termos_sindicos_anon_insert"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'termos-sindicos');

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

-- fotos-sindicos: mesmas regras
CREATE POLICY "fotos_sindicos_anon_insert"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'fotos-sindicos');

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
```

## Resumo

| Item | Ação |
|---|---|
| Enum `app_role` | +2 valores (`gestor_comercial`, `diretora_operacoes`) |
| Tabela `sindicos_interessados` | +27 colunas novas, validação por trigger, 3 índices, RLS reescrito |
| Tabela `configuracoes_notificacoes_sindicos` | Criada do zero com RLS admin-only |
| Bucket `termos-sindicos` | Criado privado + policies (anon insert / admin select) |
| Bucket `fotos-sindicos` | Criado privado + policies (anon insert / admin select) |
| Dados legados (2 registros) | **Preservados** — colunas antigas mantidas como nullable |
| Componentes existentes (`SindicosTable.tsx` etc) | **Não tocados** — leem colunas antigas que continuam existindo |

## Garantias

- **Não removo** nenhuma coluna existente — preservo retrocompatibilidade com `SindicoInteressado` interface e components admin atuais
- **Não toco** em UI, fluxo de propostas, contratos, pagamento, monitoramento de painéis
- Validação via **trigger** (não CHECK constraint) conforme padrão do projeto
- RLS usa `has_role()` security definer já existente — sem risco de recursão
- `service_role_key` nunca usado no frontend
- Buckets privados — acesso via signed URLs depois

## Próximos passos (fora deste plano)

Após aprovação e execução, em uma próxima task: criar página pública `/interessesindico`, edge function para gerar PDF de aceite e edge function para disparar WhatsApp via Z-API aos usuários em `configuracoes_notificacoes_sindicos`.

