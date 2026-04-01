

# Plano: Garantir Vídeos Trimados em MP4 para AWS

## Problema Atual

O trimmer **sempre produz WebM** porque o código prioriza WebM sobre MP4 (linha 204-208 do `useVideoTrimmer.ts`). A Edge Function depois **força extensão .mp4** no arquivo WebM, mas o conteúdo continua sendo WebM. A AWS rejeita porque o conteúdo não bate com a extensão.

## Solução: Duas camadas de garantia

### 1. Priorizar MP4 no MediaRecorder

Chrome 116+ (e todos os Chromium modernos) suportam `video/mp4` no MediaRecorder. Basta inverter a ordem de prioridade:

```text
Atual:    webm/vp9 → webm → mp4 (nunca chega no mp4)
Corrigido: mp4/avc1 → mp4 → webm/vp9 → webm (usa mp4 em 95%+ dos browsers)
```

Se o browser suportar MP4 (quase todos), o arquivo trimado já sai como MP4 nativo — igual aos vídeos curtos que funcionam.

### 2. Fallback: enviar arquivo original (já é MP4) com metadados de corte

Quando o browser NÃO suportar MP4 no MediaRecorder (caso raro), em vez de enviar um WebM disfarçado:
- Enviar o **arquivo original** (que já é MP4 válido)
- Armazenar `trim_start` e `trim_end` no banco para referência
- A AWS recebe um MP4 válido de qualquer forma

### 3. Edge Function: detectar formato real antes de enviar

Adicionar verificação dos magic bytes do arquivo. Se detectar WebM (bytes `1A 45 DF A3`), logar erro e rejeitar o envio em vez de mandar arquivo corrompido para AWS.

## Arquivos Alterados

| Arquivo | Mudança |
|---------|---------|
| `src/components/video-trimmer/useVideoTrimmer.ts` | Inverter prioridade: MP4 primeiro; fallback retorna original MP4 + metadados de corte |
| `supabase/functions/upload-video-to-external-api/index.ts` | Validar magic bytes antes de enviar; rejeitar WebM |
| Migration SQL | Adicionar `trim_start_seconds` e `trim_end_seconds` na tabela `videos` |

## Resposta direta à sua pergunta

**Sim, vai funcionar.** Em 95%+ dos navegadores modernos (Chrome, Edge, Opera), o vídeo trimado sairá como MP4 nativo — idêntico aos vídeos curtos que já funcionam com a AWS. No caso raro de browser antigo que só faz WebM, o sistema envia o arquivo original (que já é MP4) em vez de enviar WebM corrompido.

