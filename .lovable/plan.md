

# Plano: Video Trimmer Modal (Estilo WhatsApp)

## Resumo

Quando o usuario seleciona um video mais longo que o permitido (10s horizontal, 15s vertical), ao inves de recusar, abre um modal moderno e minimalista com um trimmer visual. O usuario arrasta as alças para selecionar o trecho desejado, ve o preview em tempo real, e confirma. O video e cortado no navegador e enviado ja no tamanho correto.

## Como funciona

1. Usuario seleciona arquivo de video
2. Validação detecta duração > maxDuration
3. Em vez de mostrar erro, abre o `VideoTrimmerModal`
4. Modal mostra: preview do video + barra de timeline com 2 alças arrastáveis (inicio/fim)
5. Usuario arrasta as alças para definir o trecho (max = duração permitida)
6. Botao "Cortar e Usar" processa o corte no navegador via Canvas + MediaRecorder
7. Retorna o File cortado para o fluxo normal de upload

## Arquitetura tecnica

### Corte no navegador (sem FFmpeg)
- Usa `<video>` + `<canvas>` + `MediaRecorder` API
- O video toca do ponto A ao ponto B enquanto o canvas captura frames
- MediaRecorder grava o stream do canvas em WebM/MP4
- Resultado e convertido em `File` e retorna ao fluxo de upload

### Componentes

**`src/components/video-trimmer/VideoTrimmerModal.tsx`** (novo)
- Dialog fullscreen/responsive com preview do video
- Controles: play/pause do trecho selecionado
- Exibe duração selecionada vs maxima permitida

**`src/components/video-trimmer/TrimmerTimeline.tsx`** (novo)
- Barra de timeline com thumbnails geradas via canvas
- 2 alças arrastáveis (start/end) com drag touch-friendly
- Região selecionada destacada, resto escurecido
- Constraint: end - start <= maxDuration
- Playhead animado mostrando posição atual

**`src/components/video-trimmer/useVideoTrimmer.ts`** (novo hook)
- Gerencia estado do trimmer (startTime, endTime, isProcessing)
- Gera thumbnails da timeline via canvas.drawImage em intervalos
- Processa o corte: reproduz trecho + MediaRecorder → Blob → File
- Retorna file processado

### Alterações em arquivos existentes

**`src/services/videoStorageService.ts`**
- Modificar `validateVideoFile`: quando duração excede, retornar flag `needsTrimming: true` com metadata (duração real, maxDuration) em vez de erro

**`src/components/video-management/VideoSlotUpload.tsx`**
- No `handleFileChange`: se validação retorna `needsTrimming`, abrir `VideoTrimmerModal` em vez de rejeitar
- Callback `onTrimComplete` recebe o File cortado e continua o fluxo normal

**`src/hooks/useSimpleVideoUpload.ts`**
- Mesma logica: interceptar validação de duração e abrir trimmer

### UI do Modal (design premium EXA)

```text
┌──────────────────────────────────────┐
│  ✂️ Cortar Vídeo                  ✕  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  │      VIDEO PREVIEW           │    │
│  │      (trecho selecionado)    │    │
│  │                              │    │
│  └──────────────────────────────┘    │
│                                      │
│  00:05 / 00:10 (máx 10s)            │
│                                      │
│  [thumb][thumb][thumb][thumb][thumb]  │
│  |=====[███████████]=====|           │
│  ↑start              end↑           │
│                                      │
│  [ Cancelar ]    [ ✂️ Cortar e Usar ]│
└──────────────────────────────────────┘
```

- Glassmorphism sutil (bg-white/95, backdrop-blur)
- Paleta EXA: vermelho #C7141A nos CTAs, slate nos textos
- Timeline com thumbnails reais extraidas do video
- Alças com hit area grande para mobile (min 44px)
- Animações via framer-motion para entrada/saida do modal

## Arquivos

1. `src/components/video-trimmer/VideoTrimmerModal.tsx` (novo)
2. `src/components/video-trimmer/TrimmerTimeline.tsx` (novo)
3. `src/components/video-trimmer/useVideoTrimmer.ts` (novo)
4. `src/services/videoStorageService.ts` (modificar validação)
5. `src/components/video-management/VideoSlotUpload.tsx` (integrar trimmer)
6. `src/hooks/useSimpleVideoUpload.ts` (integrar trimmer)

