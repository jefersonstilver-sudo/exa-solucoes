

# Redesign do PDF de aceite + botão "Regenerar PDF"

## Investigação (resultados)

| Item | Achado |
|---|---|
| Logo no projeto | `public/exa-logo.png` e `src/assets/exa-logo.png` (175KB, PNG com transparência — versão colorida vermelha EXA). Versão branca em `src/assets/logo-branca-exa.png` (25KB). |
| Logo em produção (Storage) | `https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=…` — assinada com expiração em 2070, retorna HTTP 200 (174716 bytes, idêntica ao arquivo local). Já é usada em `HeroSection`, `MobileHeader`, `ProviderBenefitChoice`, etc. |
| PDF atual | `drawText('exa', …)` — não é imagem, é só a palavra desenhada com fonte Helvetica. Daí o "ar de rascunho". |

## Estratégia de logo escolhida: **B (fetch da URL assinada da Storage)**

Justificativa:
- **Robustez**: a URL já é usada em produção pelo frontend há meses, é assinada com validade até 2070 (não expira), retorna 200 estável.
- **Edge Functions Deno NÃO conseguem ler `public/`** (não têm acesso ao filesystem do projeto Vite — só ao bundle `supabase/functions/<name>/`).
- **Embed base64 (C) inflaria o arquivo** `index.ts` em ~230KB de string, prejudicando deploy e leitura de código.
- **Cache em memória do módulo**: faço `fetch` uma vez por cold start e mantenho o `Uint8Array` numa variável de módulo — chamadas subsequentes reaproveitam.
- **Fallback defensivo**: se o fetch falhar (timeout/5xx), o PDF é gerado sem a imagem (apenas o wordmark "EXA" em Times-Bold como hoje), nunca quebra a geração.

A logo oficial colorida será embedada como **PNG colorido na capa** (140pt de largura) e como **versão pequena (45pt) no cabeçalho** das demais páginas. Como a logo tem fundo transparente, ela renderiza limpa sobre branco. Não preciso de versão preta — a logo colorida sobre branco é institucional e válida.

## Confirmações solicitadas

| Pergunta | Resposta |
|---|---|
| Times-Roman como fonte principal? | ✅ Sim. `StandardFonts.TimesRoman` + `TimesRomanBold` + `TimesRomanItalic` para corpo/títulos/declarações. `Helvetica` reservado APENAS para protocolo, hash, IP, user-agent (aparência técnica/monoespaçada). |
| Estrutura de 4 blocos (Capa / P2 Identificação / P3+ Termos / Página final Assinatura)? | ✅ Sim, exatamente como descrito. |
| Botão "Regenerar PDF" na aba Gestão Interna do SindicoDialog? | ✅ Sim, visível para admins (validado por sessão autenticada — a edge function checa `auth.getUser()` e `has_role(user, 'super_admin'|'admin'|'gestor_comercial'|'diretora_operacoes')` antes de permitir `force_regenerate`). |

## Alterações

### 1. `supabase/functions/gerar-pdf-aceite-sindico/index.ts` — reescrita do layout

- **Cabeçalho técnico**: importa `TimesRoman`, `TimesRomanBold`, `TimesRomanItalic`, mantém `Helvetica`/`HelveticaBold` para dados técnicos.
- **Cache de logo em módulo**: `let LOGO_BYTES: Uint8Array | null = null;` + função `loadLogo()` com fetch + try/catch.
- **Helpers novos**:
  - `drawHeader(page, pageNum, totalPages, protocolo, logoImg)` — chamado em todas as páginas ≥2.
  - `drawFooter(page, pageNum, totalPages)` — idem.
  - `drawDoubleBorderBox(page, x, y, w, h)` — caixa de borda dupla preta (capa, declaração).
  - `drawJustifiedText(page, text, x, y, maxWidth, font, size, lineHeight)` — texto totalmente justificado para o corpo dos termos.
  - `drawNotarialSeal(page, cx, cy)` — selo circular com 2 anéis, texto em arco aproximado (segmentos horizontais simétricos topo/base) e check ✓ central em bordô.
  - `drawDataTable(page, rows, x, y, w, labelWidth)` — tabela 2 colunas com zebra branco/`#F8F8F8`, borda 0.5pt preta.
- **Páginas**:
  1. **Capa**: logo colorida 140pt centralizada → linha fina → "INDEXA MÍDIA LTDA" + CNPJ + endereço → linhas bordô finas → título "TERMO DE REGISTRO DE INTERESSE" Times-Bold 20pt → subtítulo → italic descritivo → box duplo do protocolo (320×90, Helvetica-Bold 22pt) → declaração legal italic → faixa bordô 2pt no pé. **Sem fundo vermelho grande.**
  2. **Identificação das partes**: cabeçalho + "1. IDENTIFICAÇÃO DAS PARTES" → "1.1 DADOS DO PRÉDIO" (tabela) → "1.2 DADOS DO SÍNDICO" (tabela). Mandato formatado por extenso ("31 de dezembro de 2027").
  3. **a N. Termos**: "2. TERMOS E CONDIÇÕES" + parser de markdown (`###`, `**`, `- `, parágrafos) com **justificação completa** + orphan prevention (título de cláusula só quebra se sobrarem ≥2 linhas abaixo).
  4. **Página final — Assinatura**: "3. ASSINATURA ELETRÔNICA…" centralizado → caixa dupla "DECLARAÇÃO DE CONCORDÂNCIA" → linha + nome em CAIXA ALTA + CPF + mandato + condomínio → **selo notarial circular** (raio 60pt + raio interno 48pt + texto em arco em segmentos + ✓ bordô 42pt + "VALIDADE JURÍDICA / ATESTADA") → caixa "REGISTRO DE EVIDÊNCIAS TÉCNICAS" (Helvetica 8.5pt: data, IP, UA truncado 80 chars, hash SHA-256 quebrado, protocolo) → caixa borda bordô "USO AUTORIZADO" com lista de destinatários.
- **Numeração de páginas**: passo final percorre todas as páginas e pinta "Página X de Y" no rodapé (capa também: "Página 1 de N").
- **Hash SHA-256**: já é calculado hoje sobre o conteúdo canônico — mantido intocado, apenas re-renderizado quando `force_regenerate=true`.
- **Parâmetro `force_regenerate`**:
  - Schema do body: `{ sindico_interessado_id: string, force_regenerate?: boolean }`.
  - Quando `true`, ignora o early-return de cached `aceite_pdf_url`, recalcula hash com novo timestamp de geração, sobrescreve no bucket (`upsert: true` já existe) e atualiza `aceite_pdf_url`/`aceite_hash` na tabela.
  - **Autorização**: extrai JWT do header `Authorization`, faz `supabase.auth.getUser(token)`, e checa `has_role(user_id, 'super_admin')` OR `has_role('admin')` OR `has_role('gestor_comercial')` OR `has_role('diretora_operacoes')` via RPC. Se não autorizado, retorna 403. Service role key também passa (para chamadas server-to-server).

### 2. `src/components/admin/sindicos-interessados/tabs/TabGestaoInterna.tsx` — botão "Regenerar PDF"

- Adicionar botão **secundário** "Regenerar PDF" (ícone `RefreshCw` lucide), abaixo dos campos existentes, num bloco "Manutenção do documento".
- Visibilidade: usar o mesmo gating de role já presente na página (qualquer um dos 4 papéis admin).
- Ação: `supabase.functions.invoke('gerar-pdf-aceite-sindico', { body: { sindico_interessado_id, force_regenerate: true } })`.
- Estados: `isRegenerating` com spinner no botão; toast de sucesso/erro; em caso de sucesso, dispara `onUpdated()` (callback já existente do dialog) para que a aba Resumo recarregue a signed URL do PDF.

## Garantias

- ✅ **Não toco em**: banco, RLS, triggers, colunas, landing, formulário, página de sucesso, sidebar, lista admin, abas Resumo/Prédio/Síndico/Aceite Jurídico do dialog, variáveis CSS globais.
- ✅ **Texto integral dos termos** (`TERMOS_MARKDOWN`) preservado caractere a caractere — só muda a renderização visual.
- ✅ **Hash SHA-256 e idempotência** continuam funcionando para chamadas sem `force_regenerate`.
- ✅ **Fallback de logo**: PDF sempre gera, mesmo se o fetch da imagem falhar.
- ✅ **Edge function** auto-deploya. Após o deploy, regenerar 1 PDF de teste via o novo botão e validar visualmente (converter para imagens com `pdftoppm` no QA).

## Arquivos tocados

| Arquivo | Tipo |
|---|---|
| `supabase/functions/gerar-pdf-aceite-sindico/index.ts` | Reescrita do layout + parâmetro `force_regenerate` + auth gate |
| `src/components/admin/sindicos-interessados/tabs/TabGestaoInterna.tsx` | +botão "Regenerar PDF" |

Total: **2 arquivos**. Nenhuma migração SQL. Nenhuma dependência nova.

