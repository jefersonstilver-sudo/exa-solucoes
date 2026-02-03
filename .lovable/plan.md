
## Objetivo (corrigir totalmente, sem mexer no resto do fluxo)
1) **Modal de upload de logo**: ficar maior, “EXA Premium / glass / corporativo”, **sem botões verdes**, com **fundo vermelho (igual o header da proposta)** nas prévias e com **opção de escolher “Original” ou “Otimizada por IA”**.  
2) **Logo processada não aparecendo**: diagnosticar e eliminar as causas comuns (renderização invisível, falha de URL, cache, upload/retorno incompleto).  
3) **Preview real de como ficará na proposta**: dentro do modal, renderizar um mini “header” (igual PropostaPublicaPage) usando a logo escolhida.

---

## Diagnóstico do que está acontecendo hoje (com base no código + request de rede)
- A chamada `POST /functions/v1/process-client-logo` está retornando **200** com:
  - `success: true`
  - `logoUrl` válido
  - `processed: true`
- No `ClientLogoUploadModal.tsx`, o preview “Processada” usa:
  - background escuro “slate”
  - um badge verde “done”
  - e confirma com botão verde (`bg-emerald-600`)
- Há 2 problemas principais reportados:
  1) **“Não apareceu a logo processada”**: mesmo com `logoUrl` retornado, a imagem pode estar:
     - invisível por filtro/contraste (logo muito clara + filtro invert/brightness),
     - quebrando no `<img>` por erro de load (CORS/403/policy), ou
     - cache/tempo de render (menos provável, mas possível).
  2) **“O fundo ali deve ser vermelho igual o da proposta”**: hoje o fundo do preview processado é slate escuro, não o vermelho do header (`from-[#4a0f0f] via-[#6B1515] to-[#7D1818]`).

---

## Mudanças planejadas (alto nível)

### A) Reestruturar o modal para 3 painéis (maior e com preview fiel)
Vamos refazer o layout do `ClientLogoUploadModal.tsx` para um modal maior (desktop), com:
1) **Original (upload)**  
2) **Otimizada (IA)** (com botão “Processar” e estado de loading)  
3) **Preview na Proposta** (mini header vermelho igual ao da proposta pública)

E com seleção explícita:
- Um seletor tipo “radio”/toggle:
  - “Usar Original”
  - “Usar Otimizada (IA)”

O botão final será algo como:
- “Aplicar logo selecionada” (estilo EXA, **vermelho**, sem verde)

### B) Garantir “usar original” (persistência real, não só preview local)
Hoje só temos:
- original: apenas `dataURL` local
- processada: `logoUrl` (storage)

Para permitir “usar original”, precisamos ter uma URL persistida também. Existem duas formas; vamos adotar a mais sólida e consistente:

**B1) Ajustar a Edge Function `process-client-logo` para retornar 2 URLs:**
- `originalUrl`: sempre faz upload do original em `proposal-client-logos/original/...`
- `processedUrl`: quando IA retornar imagem, faz upload em `proposal-client-logos/processed/...`
- `processed`: boolean
- `success`

Assim o modal poderá:
- mostrar as duas versões com URL real
- permitir escolher qual salvar em `client_logo_url`

Isso também ajuda a resolver o caso “processada não apareceu”: poderemos logar/inspecionar qual URL está falhando e exibir fallback.

### C) Corrigir por que “logo processada não aparece” (hardening no modal)
No `ClientLogoUploadModal.tsx`:
1) Adicionar handler `onError` no `<img>` do preview processado e original:
   - exibir mensagem “Não foi possível carregar a imagem” + CTA “Reprocessar”/“Reenviar”
2) Aplicar **cache-busting leve** no preview (apenas no modal):
   - `?v=${Date.now()}` ao setar URL em state (não na URL salva na proposta)
3) Revisar filtro para “logo sempre branca”:
   - manter `filter brightness-0 invert` para garantir branco,
   - mas evitar duplicar filtros que possam “sumir” a imagem em casos específicos.  
   Estratégia:
   - No preview: permitir alternar “mostrar como branco (padrão)” vs “mostrar original” (apenas no modal, para debug visual).
   - Na proposta pública: continua sempre branca como você pediu.

### D) Fundo vermelho (igual proposta) nos cards de preview
Substituir o fundo do card “Processada” (e também do preview final) para o mesmo padrão do header da proposta:
- `bg-gradient-to-r from-[#4a0f0f] via-[#6B1515] to-[#7D1818]`
- borda translúcida `border-white/20`
- glass `backdrop-blur-sm`
- para ficar “EXA Premium” e consistente.

### E) Sem botões verdes e UI corporativa/glass
No `ClientLogoUploadModal.tsx`:
- Remover:
  - badge verde (`bg-emerald-500`)
  - botão verde “Usar esta Logo”
- Trocar por:
  - botões com estilo EXA (vermelho / slate / glass)
  - “Aplicar” em vermelho (ex.: gradiente ou `bg-[#9C1E1E] hover:bg-[#7D1818]`)
  - “Cancelar” outline glass (sem verde)
- Aumentar largura do modal:
  - `DialogContent` para `sm:max-w-3xl` (ou 4xl dependendo do layout final)
  - manter responsivo (no mobile continua empilhado)

---

## Ajustes específicos por arquivo

### 1) `src/components/admin/proposals/ClientLogoUploadModal.tsx`
**Alterações principais:**
- Props novas (para preview real):
  - `previewCompanyName?: string`
  - `previewClientName?: string`
  - `previewClientDocLabel?: string` (CNPJ/CUIT/RUC)
  - `previewClientDocValue?: string`
  - (opcional) `proposalNumber?: string` para ficar idêntico ao header
- Estados:
  - `originalUrl` (string | null) — vindo da Edge Function
  - `processedUrl` (string | null) — vindo da Edge Function
  - `selectedVariant: 'original' | 'processed'`
- Fluxo:
  1) Usuário seleciona PNG
  2) Modal mostra “Original” (preview local) + botão “Enviar/Preparar Original”
     - ou já dispara um “upload original” automático via Edge Function (recomendado para simplificar)
  3) Usuário clica “Processar com IA” (opcional)
  4) Modal mostra “Otimizada”
  5) Usuário escolhe qual usar (Original/Otimizada)
  6) “Aplicar logo selecionada” salva a URL escolhida via `onLogoProcessed(chosenUrl)`

**UI (layout):**
- Grid 2 colunas (desktop): Original | Otimizada
- Abaixo, “Preview na Proposta” (full width)
- “Preview na Proposta” deve simular:
  - fundo vermelho gradiente
  - card com `bg-white/10 backdrop-blur-sm`
  - logo no canto direito dentro de container parecido com PropostaPublicaPage
  - logo com filtro para branco

### 2) `supabase/functions/process-client-logo/index.ts`
**Alterações:**
- Passar a retornar:
  - `originalUrl`
  - `processedUrl` (se existir; se não, null)
  - `processed: boolean`
- Sempre fazer upload do original.
- Se IA devolver imagem, fazer upload da processada também.
- Manter logs robustos para debug.

**Entrada esperada:**
- `imageBase64`
- `fileName`
- (opcional) `onlyUploadOriginal: boolean` para permitir uma chamada “rápida” sem IA, caso você queira performance.

### 3) `src/pages/admin/proposals/NovaPropostaPage.tsx`
**Alterações pequenas e relacionadas (sem mexer no restante da tela):**
- Passar props de preview para o modal usando os campos já existentes:
  - companyName, clientName, document label/value.
- Ajustar callback do modal:
  - receber `logoUrl` final (original ou processada) e setar `clientLogoUrl`.
- (Opcional, mas recomendado para UX): quando `existingProposal` carregar em modo edição, inicializar `clientLogoUrl` com `existingProposal.client_logo_url` para aparecer no formulário imediatamente.

---

## Critérios de aceite (o que você vai validar)
1) No modal:
   - aparece **Original** e **Otimizada**
   - consigo escolher “usar original” ou “usar otimizada”
   - **sem botões verdes**
   - fundos de preview em **vermelho igual proposta**
   - preview “como ficará na proposta” aparece e muda quando eu alterno a opção.
2) A “logo processada” passa a aparecer sempre:
   - se a IA falhar, modal mostra mensagem clara e permite seguir com “Original”.
3) Ao “Aplicar”, a proposta salva `client_logo_url` com a versão escolhida e na proposta pública a logo aparece do jeito esperado (branca).

---

## Checklist de implementação (ordem)
1) Ajustar Edge Function `process-client-logo` para retornar `originalUrl` e `processedUrl`.
2) Refatorar `ClientLogoUploadModal`:
   - layout maior (glass)
   - seleção original vs processada
   - preview real no header vermelho
   - remover verde
   - hardening de erro de imagem + cache-busting no preview
3) Ajustar `NovaPropostaPage`:
   - passar dados para preview
   - inicializar `clientLogoUrl` no modo edição (se estiver faltando)
4) Teste end-to-end:
   - upload original
   - processar com IA
   - alternar e aplicar
   - salvar proposta
   - abrir proposta pública e ver logo branca no local correto

---

## Observações de design (fidelidade EXA)
- Reusar o mesmo gradiente do header em `PropostaPublicaPage`:
  - `from-[#4a0f0f] via-[#6B1515] to-[#7D1818]`
- Elementos glass:
  - `bg-white/10 backdrop-blur-sm border border-white/20`
- Acentos e botões:
  - vermelho EXA (`#9C1E1E` / `#C7141A`) e variantes, nunca verde