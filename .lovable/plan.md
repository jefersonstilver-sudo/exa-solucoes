

# Fix: Atualizar Prompt de Otimização de Logo com IA

## Problema
O prompt atual na Edge Function `process-client-logo` não segue as instruções corretas do agente GPT. Falta a regra de que logos sempre devem estar em cores claras para contraste, e a distinção entre logos com elementos visuais (cinza) vs logos só-texto (branco puro) não está clara o suficiente.

## Solução

### Arquivo: `supabase/functions/process-client-logo/index.ts`

**Substituir `DETAILED_PROMPT` (linhas 9-46)** pelo prompt atualizado do usuário:

```
Você é um especialista em tratamento profissional de logos para uso digital e branding.

1. REMOVER O FUNDO COMPLETAMENTE
- Fundo 100% transparente (sem resíduos, sem sombras, sem pixels)
- NÃO pode sobrar borda branca, azul ou qualquer cor
- PNG com transparência real (alpha)

2. CONVERTER PARA MONOCROMÁTICA - SEMPRE EM CORES CLARAS PARA CONTRASTE
- CASO 1 — LOGO COM ELEMENTOS VISUAIS (ícones, desenhos, símbolos, mascotes):
  Converter para tons de CINZA CLARO (grayscale profissional), preservar contraste e profundidade
- CASO 2 — LOGO APENAS TEXTO:
  Converter para BRANCO puro (#FFFFFF), sem cinza, sem degradê

3. QUALIDADE
- Melhorar nitidez, corrigir serrilhados (anti-aliasing)
- Manter proporção original, NÃO distorcer tipografia

4. CASOS ESPECIAIS
- Fundo complexo (gradiente, imagem, textura) → remover completamente
- Sombra, glow, reflexo → remover
- Múltiplas cores → adaptar para branco ou cinza conforme regra 2

Entregar logo limpa, profissional, monocromática em cores claras, sem fundo, pronta para uso imediato.
NÃO explicar o processo. NÃO perguntar nada. Apenas entregar o arquivo pronto.
```

**Substituir `SIMPLE_PROMPT` (linha 48):**

```
Remove the background completely (transparent PNG). Convert logo to light monochrome: if it has icons/symbols/mascots use light grayscale tones, if text-only use pure white #FFFFFF. The logo must always be in LIGHT colors for contrast on dark backgrounds. Remove all shadows, glows, reflections. Keep proportions and details intact. Just deliver the result, no explanation.
```

**Upgrade do modelo (linha 198):** Trocar `google/gemini-2.5-flash-image` para `google/gemini-3-pro-image-preview` na tentativa 1 (melhor qualidade para processamento de imagem). Manter `google/gemini-2.5-flash-image` como fallback na tentativa 2.

Isso requer adicionar um parâmetro `model` na função `callAI` e passar modelos diferentes para cada tentativa.

