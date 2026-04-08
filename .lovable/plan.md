

# Correção da Qualidade de Conversão MOV → MP4

## Problema
A conversão atual usa `requestAnimationFrame` para desenhar frames no canvas durante playback em tempo real. Isso causa **drops de frames** quando:
- A aba do browser está em segundo plano (rAF é throttled)
- CPU está ocupada com outras tarefas
- O framerate do canvas não acompanha o vídeo

O resultado é um MP4 com frames faltando → vídeo "travado/laggy".

## Solução

### Arquivo: `src/services/videoConversionService.ts`

Reescrever a lógica de captura de frames para ser mais robusta:

1. **Usar `setInterval` em vez de `requestAnimationFrame`** — rAF é pausado em abas em background; setInterval com intervalo de ~33ms (30fps) mantém a captura consistente
2. **Aumentar bitrate de 5Mbps → 8Mbps** — vídeos de iPhone são gravados em alta qualidade; 5Mbps pode gerar artefatos de compressão
3. **Adicionar `video.playbackRate = 1.0` explícito** — garantir que o playback não acelere/desacelere
4. **Chunks menores no MediaRecorder** — mudar de `start(100)` para `start(50)` para captura mais granular
5. **Garantir que o vídeo está muted durante conversão** — evitar problemas de autoplay policy que podem pausar o vídeo silenciosamente
6. **Adicionar safety check de frames** — verificar se frames estão sendo desenhados e logar warnings se houver gaps

### Mudanças específicas:
- `videoBitsPerSecond`: 5_000_000 → 8_000_000
- `captureStream(30)` → `captureStream(30)` (manter, mas usar setInterval para drawing)
- Substituir `requestAnimationFrame(drawFrame)` por `setInterval(drawFrame, 33)`
- Adicionar `video.muted = true` antes do playback de conversão (necessário para autoplay confiável)
- Adicionar contador de frames para diagnóstico
- Timeout de segurança proporcional à duração do vídeo

### Sem alterações em:
- UI existente
- Hook `useVideoManagement.tsx`
- Hook `useSimpleVideoUpload.ts`
- Nenhum outro componente ou funcionalidade

