

# 3 Visualizadores de Logo + IA Mais Poderosa

## Problema Atual

O modal tem 2 cards, mas o "Original" ja aplica filtro CSS `brightness-0 invert` -- nao mostra a imagem real. Alem disso, o prompt da IA na Edge Function e basico e pode nao remover fundos complexos corretamente.

## Nova Estrutura: 3 Cards

```text
+------------------+------------------+------------------+
|   1. ORIGINAL    |  2. BRANCO (CSS) |  3. OTIMIZADA IA |
|                  |                  |                  |
|  Imagem real,    |  Mesma imagem    |  IA remove fundo |
|  cores originais |  com filtro CSS  |  converte branco |
|  SEM filtro      |  brightness-0    |  limpa bordas    |
|                  |  invert          |                  |
|  [o] Usar esta   |  [o] Usar esta   |  [o] Usar esta   |
+------------------+------------------+------------------+
```

- **Card 1 - Original**: Imagem exatamente como enviada, sem nenhum filtro. Fundo xadrez (transparencia) para contraste
- **Card 2 - Branco (CSS)**: Mesma imagem com filtro CSS `brightness-0 invert`. Disponivel imediatamente, sem processamento
- **Card 3 - Otimizada (IA)**: Processada pela Edge Function. Placeholder ate clicar "Otimizar com IA"

## Detalhes Tecnicos

### Arquivo 1: `src/components/admin/proposals/ClientLogoUploadModal.tsx`

**Mudancas de estado:**
- `selectedVariant` muda de `'original' | 'processed'` para `'original' | 'css-optimized' | 'ai-processed'`
- Default: `'css-optimized'` (o mais usado)
- Novo estado `cssImageError` para o card CSS

**Layout:**
- Modal ampliado para `sm:max-w-4xl`
- Grid muda de `grid-cols-2` para `grid-cols-3`
- RadioGroup unificada com 3 opcoes (em vez de 2 RadioGroups separados)

**Card 1 - Original:**
- Fundo com padrao xadrez (CSS checkered pattern) para mostrar transparencia
- Exibe `previewUrl` SEM `brightness-0 invert`
- Visivel imediatamente apos upload

**Card 2 - Branco (CSS):**
- Fundo gradiente vermelho oficial (`from-[#4a0f0f] via-[#6B1515] to-[#7D1818]`)
- Exibe `previewUrl` COM `brightness-0 invert`
- Visivel imediatamente apos upload, sem processamento

**Card 3 - Otimizada (IA):**
- Fundo gradiente vermelho oficial
- Placeholder "Clique em Otimizar com IA" quando vazio
- Loading durante processamento
- Exibe `processedUrl` sem filtro CSS (a IA ja converte para branco)

**Botoes de acao ajustados:**
- "Cancelar" sempre visivel
- "Otimizar com IA" visivel quando idle ou erro (dispara processamento)
- "Aplicar Logo" visivel quando ha selecao valida
- Remover botao "Usar Original" separado (agora e so selecionar o card 1 ou 2 e clicar Aplicar)

**handleConfirm ajustado:**
- `original`: salva `originalUrl` (upload sem IA, marca como sem filtro)
- `css-optimized`: salva `originalUrl` (o filtro CSS sera aplicado na exibicao)
- `ai-processed`: salva `processedUrl` (ja processada pela IA)

### Arquivo 2: `supabase/functions/process-client-logo/index.ts`

**Prompt da IA reconstruido e mais poderoso:**

O prompt atual e basico. Sera reescrito com instrucoes mais detalhadas:

1. Deteccao inteligente de fundo (solido, gradiente, texturizado, fotografico)
2. Remocao precisa de fundo preservando detalhes finos (bordas, texto pequeno, sombras sutis)
3. Conversao para esquema branco/cinza claro:
   - Partes principais da logo em branco puro (#FFFFFF)
   - Detalhes secundarios em cinza claro (#E0E0E0 a #F0F0F0)
   - Preservar hierarquia visual e profundidade
4. Limpeza de artefatos e bordas irregulares
5. Centralizacao e padding adequado
6. Instrucao explicita para manter proporcoes e nao distorcer

**Modelo atualizado:**
- Usar `google/gemini-2.5-flash-image` (atual) mas com prompt muito mais detalhado
- Adicionar retry automatico: se a primeira tentativa falhar ou retornar imagem invalida, tentar novamente com prompt simplificado

**Retry logic:**
- Primeira tentativa: prompt completo e detalhado
- Se falhar: segunda tentativa com prompt simplificado focando apenas em "remove background, make white"
- Se ambas falharem: retornar original com mensagem informativa

