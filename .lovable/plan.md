# Vídeo da Home Pública – Diagnóstico e Plano de Correção

## Diagnóstico

O arquivo de vídeo em si **não é o problema**: 480x848, H.264, 1.5 Mbps, 11 MB, ~59s, com `moov` no início (faststart correto) servido pelo Cloudflare/Supabase Storage. Isso deveria tocar suavíssimo até em conexões fracas.

O travamento vem do **`useResilientVideo`** (hook usado em `HeroSection.tsx`) e da configuração do `<video>`. Pontos que causam stutter/freeze visível:

1. **Loop de "recovery" agressivo derrubando o vídeo**
   - `handleWaiting` dispara em **toda** bufferização normal e agenda um `setTimeout` de 3s que chama `attemptRecovery()` → executa `video.load()` (= reinicia o vídeo do zero, perde buffer).
   - Mesmo que o vídeo volte a tocar antes, `clearStallTimer` só roda se `onPlaying` disparar a tempo. Em conexões médias isso vira loop: waiting → load() → waiting → load()…
   - O "freeze detector" roda a cada 2s comparando `Date.now() - lastTimeUpdate`. Se o usuário mudar de aba ou o navegador throttla timers, dispara `attemptRecovery()` falso-positivo e reinicia o vídeo.

2. **`preload` ausente / metadata** – sem `preload="auto"` o navegador hesita em encher o buffer, agravando o waiting → recovery.

3. **Re-render do `<video>` quando `loading` vira false** desmonta/monta o elemento, forçando novo download (no desktop tem `{!loading && <video … />}`).

4. **IntersectionObserver pausa/retoma** sem debounce: ao rolar a página o vídeo pausa e tenta dar `play()` repetidamente, gerando micro-travadas.

5. **`onTimeUpdate` setando estado React** (`setIsRecovering(false)`/`setHasError(false)`) **a cada frame** (~24x/s) – causa re-render constante do componente Hero inteiro.

6. **Mobile sempre carrega o vídeo institucional horizontal** (institucional.mp4) cuja URL está hardcoded mas não foi otimizada da mesma forma; em tablets pequenos isso pode ser pesado.

## Plano de Correção

### 1. Reescrever `useResilientVideo` com lógica passiva (não destrutiva)
- Remover o `setTimeout` de recovery em `handleWaiting` (waiting é normal durante buffering).
- Manter recovery **apenas** para `onError` real e para freeze de **>10s** (não 5s).
- Não chamar `video.load()` em recovery padrão – tentar só `video.play()`. Usar `load()` somente quando trocar de URL (override/fallback).
- **Throttle** do `handleTimeUpdate`: só atualizar `lastTimeUpdate.current` (ref, não state) e **não** chamar `setIsRecovering/setHasError` a cada frame – fazer isso apenas em `onPlaying`.
- Pausar o freeze-detector quando `document.hidden` for true (evita falso positivo em troca de aba).
- Debounce do IntersectionObserver (150ms) para evitar play/pause durante scroll.

### 2. Ajustes no `<video>` em `HeroSection.tsx` (desktop e mobile)
- Adicionar `preload="auto"` para encher buffer.
- Manter o elemento `<video>` **sempre montado** – em vez de `{!loading && <video/>}`, renderizar o `<video>` direto e só sobrepor o spinner quando `loading`. Evita remount + redownload.
- Adicionar `disablePictureInPicture` e `disableRemotePlayback` (mais leve no Safari).
- Usar atributo `src` direto em vez de `<source>` aninhado (mais rápido para iniciar no Chromium).
- Mover os event listeners pesados (onTimeUpdate) para passar uma função estável memoizada.

### 3. Otimização de recursos paralelos
- O `LogoTicker` logo abaixo do hero roda animação CSS contínua sobre o mesmo viewport e pode competir por GPU. Garantir que use `will-change: transform` apenas enquanto visível (já parece OK) e baixar a frequência quando o vídeo estiver no viewport.

### 4. (Opcional, não obrigatório) gerar versão poster
- Adicionar `poster` (primeiro frame estático) para evitar tela preta enquanto baixa.

## Detalhes técnicos

Arquivos a editar:
- `src/hooks/useResilientVideo.ts` — refatorar lógica de recovery (passos 1).
- `src/components/exa/home/HeroSection.tsx` — ajustes de atributos e remoção do unmount condicional (passo 2).

Não serão alterados:
- `useHomepageVideo.ts` (apenas busca URL do banco, sem impacto em performance).
- URLs do vídeo, layout visual, textos, CTA, controles de mute/restart/fullscreen.
- Mobile vs Desktop layout, `LogoTicker`, demais sections.

Após aplicar, esperar:
- Vídeo arranca em 1–2s, sem reinicializações.
- Sem `[RESILIENT_VIDEO] Recovery attempt` no console em rede normal.
- Scroll suave sem o vídeo "soluçar".

Aprova para eu implementar?