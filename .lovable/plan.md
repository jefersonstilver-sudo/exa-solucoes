

# Plano: Corrigir Layout, Progresso Ficticio e Bug do MediaRecorder

## Problemas Identificados

1. **Player mal alinhado e modulo pequeno**: O video preview usa `flex-1` com `aspectRatio: 16/9` que conflita — o video nao ocupa o espaco necessario. Precisa de altura minima fixa no desktop e melhor distribuicao do espaco.
2. **Botoes mal posicionados**: O footer com botoes precisa de mais padding e melhor alinhamento em mobile.
3. **MediaRecorder em loop infinito**: O `video.onseeked` (linha 224) pode disparar multiplas vezes, chamando `recorder.start()` quando ja esta gravando (erro confirmado no runtime: `InvalidStateError: Failed to execute 'start' on 'MediaRecorder': The MediaRecorder's state is 'recording'`). Isso trava o processamento.
4. **Progresso ficticio**: O progresso e calculado por `(video.currentTime - startT) / trimDuration * 100`, capped em 95%. Se o recorder nunca chega ao `stop()`, fica em loop eterno entre 0-95%. Nao ha timeout de seguranca.

## Mudancas

### 1. `useVideoTrimmer.ts` — Corrigir bug critico do MediaRecorder

- Usar `addEventListener('seeked', handler, { once: true })` em vez de `video.onseeked` para garantir que `recorder.start()` so e chamado UMA vez
- Adicionar guard: verificar `recorder.state !== 'recording'` antes de chamar `start()`
- Adicionar timeout de seguranca (30s) para evitar loop eterno — se expirar, forca `recorder.stop()` e entrega o que foi gravado
- Quando `video.currentTime >= endT`, pausar video E parar recorder de forma segura (verificar `recorder.state`)
- Escutar evento `video.ended` como fallback — se o video terminar antes do endT, parar recorder

### 2. `VideoTrimmerModal.tsx` — Layout maior e melhor alinhado

- Video preview: substituir `flex-1 min-h-0` por altura minima `min-h-[300px] sm:min-h-[420px]` para garantir que o video seja grande
- Aumentar o modal: `sm:max-w-5xl` (era 4xl)
- Botoes: adicionar `px-6 py-5` no footer, gap maior, e tamanho minimo `min-w-[140px]` nos botoes
- Centralizar melhor o play/pause button com `py-3` em vez de `pb-2`

### 3. `TrimmerTimeline.tsx` — Ajustes menores de layout

- Aumentar altura da timeline de 80px para 88px no desktop
- Melhorar touch targets dos handles laterais (w-6 em vez de w-5)

## Arquivos editados

1. `src/components/video-trimmer/useVideoTrimmer.ts` — Fix MediaRecorder, add safety timeout, fix onseeked
2. `src/components/video-trimmer/VideoTrimmerModal.tsx` — Layout maior, video maior, botoes melhores
3. `src/components/video-trimmer/TrimmerTimeline.tsx` — Timeline mais alta, handles maiores

