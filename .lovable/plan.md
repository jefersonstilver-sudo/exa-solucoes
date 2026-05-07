## Diagnóstico

A timeline trava porque o **mesmo `<video>` de preview é reutilizado para gerar as thumbnails**. Durante esse processo (10–16 seeks consecutivos no `useEffect` de carga), qualquer ajuste do usuário na barra vermelha não consegue chamar `currentTime` de forma confiável → preview fica preto e o playhead branco não acompanha o vídeo.

Além disso:
- Mover a janela vermelha (`startTime`) **não dispara seek do vídeo** — não há efeito que faça `video.currentTime = startTime`. Por isso o preview "não acompanha" o corte.
- O playhead branco depende de `state.currentTime`, que só é atualizado dentro do RAF de `togglePlay`. Quando o vídeo está pausado e o usuário arrasta a janela ou clica em outro ponto, nenhum listener de `timeupdate`/`seeked` está conectado para refletir a posição.
- O loop de play captura `prev.startTime` no clique (closure stale): se o usuário move a janela enquanto reproduz, o loop volta para o `startTime` antigo.

## Correção (em `src/components/video-trimmer/useVideoTrimmer.ts`)

1. **Geração de thumbnails em vídeo offscreen separado** — `document.createElement('video')` próprio para os seeks, deixando o `videoRef` do preview 100% livre.
2. **Listener `timeupdate` + `seeked` no vídeo de preview** — atualiza `state.currentTime` continuamente, com ou sem play. O playhead branco passa a seguir o vídeo de verdade.
3. **Effect que reage a `state.startTime`** — quando o usuário arrasta/clica a janela vermelha, faz `video.currentTime = startTime` se estiver pausado. O frame do preview passa a ser o início do trecho selecionado, em tempo real.
4. **Refs `startTimeRef` / `endTimeRef` / `isPlayingRef`** — substituem o closure do RAF, então o loop de playback respeita a janela mesmo se o usuário a move durante a reprodução.
5. **`video.muted = true` no preview** — destrava seeks rápidos no Chrome (autoplay/seek policy).
6. **Seek inicial para `0.001`s** após `loadedmetadata` para garantir que o primeiro frame seja decodificado (corrige o "preview preto" inicial).

## Não muda

- UI do `TrimmerTimeline` / `SimpleTrimmerSlider` / modal.
- Pipeline FFmpeg do `trimVideo` (já implementado e funcionando).
- Fluxo de upload e validação.

## Arquivos

- `src/components/video-trimmer/useVideoTrimmer.ts` — apenas as 5 mudanças acima.
