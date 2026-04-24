

## Plano: vídeos da landing + tipo de prédio + Airbnb (fluxo completo)

### 1. Vídeo 1 (seção "O Problema") — trocar URL apenas

**Arquivo:** `src/components/interesse-sindico/ProblemaSection.tsx`
- Trocar a constante `VIDEO_1` para a mesma URL já usada na página `/sou-sindico` (vídeo principal mais leve, já hospedado no Storage). Vou identificar a URL exata no `useVideoConfig` / componentes da página `/sou-sindico` e reaproveitar.
- Manter o `LazyVideoPlayer` como está (preload metadata, click-to-play) — só a fonte muda.

### 2. Vídeo 2 (seção "Na Prática") — autoplay puro, sem controles, sem pausa

**Arquivo:** `src/components/interesse-sindico/DemonstracaoSection.tsx`
- Substituir o `<LazyVideoPlayer>` por um `<video>` nativo simples, configurado como:
  - `autoPlay`, `loop`, `muted`, `playsInline`
  - **sem** `controls`
  - `pointer-events-none` no elemento (bloqueia qualquer clique/toque que pause)
  - `preload="auto"` para iniciar suave
- Comportamento final: roda sozinho infinitamente, sem botão de play, sem pausa, sem som — igual a um GIF.

### 3. Formulário — Tipo de prédio + Airbnb (condicional)

**Onde:** `src/components/interesse-sindico-form/StepPredio.tsx` + `schema.ts` + `formStore.ts`

**Novos campos no Step 1 ("Dados do prédio"), inseridos logo após "Estrutura":**

a) **Tipo de prédio** (radio obrigatório, 2 opções):
   - Residencial
   - Comercial

b) **Permite Airbnb?** (radio obrigatório, **só aparece se Residencial**):
   - Sim, permite Airbnb
   - Não, não permite Airbnb
   - Quando o usuário troca para Comercial, o campo é resetado e ocultado.

**Schema (`schema.ts`):**
- Adicionar `TIPO_PREDIO = ['residencial', 'comercial']` e `PERMITE_AIRBNB = ['sim', 'nao']` com labels.
- `tipoPredio: z.enum(TIPO_PREDIO)` obrigatório.
- `permiteAirbnb: z.enum(PERMITE_AIRBNB).optional()` com `superRefine` exigindo o campo quando `tipoPredio === 'residencial'`.

**Store (`formStore.ts`):** estender `PredioState` e o `initialPredio` com os novos campos.

### 4. Banco — novas colunas + RPC

**Migration:**
- Adicionar em `sindicos_interessados`:
  - `tipo_predio text` (valores: `residencial` | `comercial`)
  - `permite_airbnb text` (valores: `sim` | `nao` | `null` para comerciais)
- Atualizar a função `submit_sindico_interesse(payload jsonb)` para receber e gravar os 2 novos campos.

**Frontend:** `src/utils/submitFormulario.ts` passa a enviar `tipo_predio` e `permite_airbnb` no payload do RPC.

### 5. PDF oficial — nova seção/linha no documento

**Arquivo:** `supabase/functions/gerar-pdf-aceite-sindico/index.ts`
- Na seção "Dados do prédio" (página 1), adicionar 2 linhas após "Casa de máquinas":
  - **Tipo de prédio:** Residencial / Comercial
  - **Permite locação por Airbnb:** Sim / Não  *(linha só aparece se residencial)*
- Buscar os 2 novos campos no SELECT da tabela.
- Manter idempotência (PDFs já gerados não regeneram, novos protocolos terão a info).

### 6. Painel administrativo — exibir nas abas existentes

**Arquivo:** `src/components/admin/sindicos-interessados/SindicoDialog.tsx` (e tabs internas)
- Aba **Resumo** e aba **Prédio**: incluir 2 novas linhas:
  - "Tipo: Residencial / Comercial" (com ícone)
  - "Airbnb: Sim / Não" (badge verde/vermelho, oculta se comercial)
- Atualizar o tipo `SindicoInteressado` em `src/components/admin/sindicos-interessados/types.ts` com os 2 novos campos opcionais.
- Se houver listagem com filtros, adicionar opção de filtrar por tipo (avalio na implementação; só adiciono se já houver padrão de filtros na página).

### 7. E-mail de confirmação — texto enxuto

**Arquivo:** `supabase/functions/_shared/email-templates-html/sindico-confirmacao.ts`
- Adicionar 1 linha no resumo do prédio: "Tipo: Residencial • Airbnb: Não" (ou Comercial, conforme o caso). Mudança mínima, não altera layout.

### Arquivos afetados (resumo)

**Editar:**
- `src/components/interesse-sindico/ProblemaSection.tsx` (URL vídeo 1)
- `src/components/interesse-sindico/DemonstracaoSection.tsx` (vídeo 2 autoplay puro)
- `src/components/interesse-sindico-form/schema.ts` (novos enums + validação condicional)
- `src/components/interesse-sindico-form/formStore.ts` (estado inicial)
- `src/components/interesse-sindico-form/StepPredio.tsx` (UI dos 2 novos campos)
- `src/utils/submitFormulario.ts` (payload RPC)
- `supabase/functions/gerar-pdf-aceite-sindico/index.ts` (linhas no PDF)
- `supabase/functions/_shared/email-templates-html/sindico-confirmacao.ts` (linha no e-mail)
- `src/components/admin/sindicos-interessados/types.ts` (tipos)
- `src/components/admin/sindicos-interessados/SindicoDialog.tsx` + tabs filhas (exibição)

**Migration:**
- Adicionar `tipo_predio` e `permite_airbnb` em `sindicos_interessados`
- Recriar `submit_sindico_interesse` com os 2 novos parâmetros

**Deploy de Edge Functions:** `gerar-pdf-aceite-sindico`, `send-sindico-confirmation`

### O que NÃO será alterado

- Layout geral da landing, do formulário, do PDF, do e-mail e do painel admin.
- Demais campos do formulário, autenticação, fluxo de upload de fotos.
- PDFs já gerados de protocolos antigos (idempotência preserva).

Aprova para eu executar?

