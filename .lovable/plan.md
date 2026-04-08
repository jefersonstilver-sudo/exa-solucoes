

# Conversão Automática de MOV (iPhone) para MP4

## Problema
Vídeos de iPhone são gravados em formato `.mov` (QuickTime/HEVC). A edge function atual apenas renomeia o arquivo para `.mp4` sem converter de verdade — o conteúdo continua sendo MOV/HEVC, o que pode causar incompatibilidade na API externa AWS.

## Abordagem: Conversão no Lado do Cliente (Browser)

Não é possível rodar FFmpeg em Edge Functions (Deno). A solução mais prática é converter no browser antes do upload para o Supabase Storage, usando a **MediaRecorder API** — a mesma técnica já usada no trimmer.

### Fluxo Proposto

```text
iPhone .mov upload
       │
       ▼
 Detecta formato .mov?
       │
  Sim ─┤── Não ──▶ segue normal
       │
       ▼
 Converte via MediaRecorder
 (playback + re-encode para MP4)
       │
       ▼
 Upload do .mp4 convertido
```

## Mudanças Técnicas

### 1. Criar serviço de conversão (`src/services/videoConversionService.ts`)
- Função `convertMovToMp4(file: File, onProgress?: (p: number) => void): Promise<File>`
- Usa `<video>` + `<canvas>` + `MediaRecorder` (mesma técnica do trimmer)
- Prioriza `video/mp4;codecs=avc1` no MediaRecorder
- Se browser não suporta MP4 nativo no MediaRecorder (ex: Firefox antigo), exibe aviso pedindo para usar Chrome/Safari
- Preserva áudio capturando via `captureStream()`
- Retorna arquivo `.mp4` real com codec H.264

### 2. Integrar conversão no hook `useSimpleVideoUpload.ts`
- Na função `processFile()`, após validação, verificar se `file.type === 'video/quicktime'` ou extensão `.mov`
- Se sim, chamar `convertMovToMp4()` com callback de progresso
- Exibir status "Convertendo vídeo para formato compatível..." durante conversão
- Substituir o arquivo original pelo convertido antes de prosseguir

### 3. Adicionar estado de conversão na UI (`UploadStatus.tsx`)
- Novo status `'converting'` no fluxo de upload
- Mostrar barra de progresso com texto "Convertendo vídeo de iPhone para formato compatível..."

### 4. Atualizar Edge Function (melhoria secundária)
- Na `upload-video-to-external-api`, adicionar detecção de formato QuickTime/MOV pelos magic bytes (bytes 4-7: `66 74 79 70 71 74` = "ftypqt")
- Logar warning se receber MOV em vez de MP4 (não bloquear, pois o client já deveria ter convertido)

## Limitações e Considerações
- A conversão no browser funciona bem para vídeos curtos (10-15s) que é o caso de uso
- Vídeos HEVC do iPhone serão re-encodados para H.264, que é universalmente compatível
- Tempo de conversão: ~5-10 segundos para um vídeo de 10s no celular
- Chrome 116+ suporta MP4 nativo no MediaRecorder; Safari também suporta

