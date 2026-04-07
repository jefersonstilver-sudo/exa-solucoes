

# Fix: Logo IA - Usar OpenAI + UX de Progresso Moderna

## Por que estava usando Gemini?

A Edge Function `process-client-logo` estava usando modelos Gemini (via Lovable AI Gateway) para processamento de imagem. Porém, vocês já têm a `OPENAI_API_KEY` configurada e funcionando em várias outras Edge Functions do projeto. O GPT-4o da OpenAI suporta edição de imagens via a API de Images (`/v1/images/edits`) — e é exatamente o que o agente GPT de vocês já faz com sucesso.

## Solução

### 1. Edge Function - Trocar para OpenAI API direta

**Arquivo: `supabase/functions/process-client-logo/index.ts`**

- Usar `OPENAI_API_KEY` (já configurada) em vez de `LOVABLE_API_KEY`
- Chamar a API de chat completions da OpenAI (`https://api.openai.com/v1/chat/completions`) com o modelo `gpt-4o` que suporta image input + output
- Manter os mesmos prompts já atualizados (remoção de fundo, cores claras, etc.)
- Adicionar AbortController com timeout de 55s para evitar timeout da Edge Function
- Fallback: se OpenAI falhar, tentar Lovable AI Gateway como backup
- Tratar erros 429/402 com mensagens claras

### 2. UX de Progresso Imersiva - "Designer Trabalhando"

**Arquivo: `src/components/admin/proposals/ClientLogoUploadModal.tsx`**

Substituir o spinner genérico (Loader2 + texto estático) no Card 3 "Otimizada (IA)" por:

- **Barra de progresso animada** (componente `Progress` já existente) que avança de 0% → ~90% durante processamento (~15-20s estimado), pulando para 100% ao concluir
- **Mensagens rotativas** a cada 3s para feedback visual:
  - "Analisando tipo de logo..."
  - "Removendo fundo da imagem..."
  - "Ajustando cores e contraste..."
  - "Otimizando para alta qualidade..."
  - "Quase pronto, finalizando..."
- **Animação visual**: ícone Wand2 com efeito pulse + gradiente shimmer no card
- **Ao concluir**: barra pula para 100% com ícone de check verde
- **Em caso de erro**: timeout claro com mensagem e botão "Tentar Novamente"

### Detalhes Técnicos

**Edge Function - Nova lógica:**
```
Tentativa 1: OpenAI GPT-4o (via OPENAI_API_KEY direta) — timeout 50s
Tentativa 2: Lovable AI Gateway gemini-2.5-flash-image (fallback) — timeout 50s
```

**Cliente - Novos states:**
```typescript
const [aiProgress, setAiProgress] = useState(0);
const [aiStatusMessage, setAiStatusMessage] = useState('');
```

useEffect com setInterval para animar progresso e rotacionar mensagens enquanto `processingState === 'processing'`.

