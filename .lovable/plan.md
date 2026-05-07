## Problema

Hoje o "Cortar e Usar" no `VideoTrimmerModal` (desktop) usa `MediaRecorder + Canvas`. Comportamento real:

- Chrome: na maioria dos casos `MediaRecorder` não suporta `video/mp4`, então cai no ramo "isWebmOutput" e simplesmente devolve o **arquivo original inteiro** com metadados `_trimStart/_trimEnd`. O upload sobe o vídeo inteiro (>10s) e fica dependendo do pipeline AWS respeitar `trim_start_seconds/trim_end_seconds`. Para o usuário, parece que "o corte não funcionou".
- Safari/iOS: já vai direto pro mesmo fallback "metadata-only" → vídeo original sobe inteiro.
- Quando o `MediaRecorder` realmente roda, ele re-encoda via canvas a 30fps, perde áudio com frequência (o `createMediaElementSource` só pode ser criado **uma vez** por `<video>` e quebra em recargas), e produz WebM disfarçado.

Resultado: vídeos > 10s nunca são realmente cortados no navegador.

## Solução

Trocar o motor de corte por **FFmpeg.wasm** (`@ffmpeg/ffmpeg` + `@ffmpeg/util`), que faz corte real em MP4 preservando áudio e codec — comportamento equivalente a CapCut/iMovie no navegador.

Estratégia de corte:
1. Tentar **stream copy** primeiro (`-ss <start> -to <end> -c copy`). É instantâneo, mantém qualidade original e funciona pra maioria dos MP4 H.264/AAC.
2. Se o stream copy falhar (keyframe ruim → primeiros frames pretos / arquivo inválido), reencodar (`-c:v libx264 -preset veryfast -crf 23 -c:a aac -b:a 128k -movflags +faststart`).
3. Progresso real reportado via `ffmpeg.on('progress', ...)` ligado ao `processingProgress` que já existe no estado.
4. Fallback final (apenas se FFmpeg não carregar — ex: rede bloqueando CDN): manter o atual "metadata-only" para não travar o usuário.

Carregamento do FFmpeg:
- Lazy import dentro de `trimVideo()` (não no bundle inicial).
- Single-instance cacheado em módulo (`let ffmpegInstance` reutilizado entre cortes).
- Core carregado via `toBlobURL` do CDN unpkg para evitar problemas de CORS.

## Correções adicionais no UX do trimmer

- **`seekPreview`**: hoje permite arrastar a playhead para fora da janela `[startTime, endTime]`. Clamp para a janela selecionada.
- **`togglePlay`**: o `requestAnimationFrame` lê `prev.startTime` capturado no momento do clique → se o usuário mover a janela enquanto reproduz, o loop volta para o startTime antigo. Trocar por leitura via `stateRef` atualizado.
- **`generateThumbnails`**: garantir `video.muted = true` antes dos seeks (Chrome bloqueia seeks rápidos com áudio).
- **Botão "Cortar e Usar"**: desabilitar enquanto `isProcessing` (já feito) + mostrar texto "Carregando motor de corte..." na primeira execução enquanto o FFmpeg baixa o core (~25MB primeira vez, depois cache).

## Ajustes de upload

Em `src/services/videoUploadService.ts`, quando o arquivo recebido **não** tiver `_trimStart/_trimEnd` (porque o FFmpeg já cortou de verdade), seguir o fluxo normal — o vídeo já vem com a duração correta. Manter o ramo metadata-only apenas como fallback para os casos onde o FFmpeg falhou.

## Arquivos a editar

- `src/components/video-trimmer/useVideoTrimmer.ts` — trocar implementação de `trimVideo` por FFmpeg.wasm; corrigir `seekPreview` e `togglePlay`; muting nos thumbnails.
- `src/components/video-trimmer/VideoTrimmerModal.tsx` — texto de loading "Preparando motor de corte" no primeiro uso.
- `package.json` — adicionar `@ffmpeg/ffmpeg@^0.12.10` e `@ffmpeg/util@^0.12.1`.
- (Sem alterações em `videoUploadService.ts` — o caminho metadata-only continua válido como fallback.)

## Não muda

- UI/UX da timeline (`TrimmerTimeline.tsx`), do slider mobile, do modal, da página `OrderConfirmation`, do fluxo de validação `validateVideoFile`, nem do pipeline AWS. Apenas o motor de corte interno.
