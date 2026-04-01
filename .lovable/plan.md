

# Plano: Zoom Fluido + Playhead Interativo no Trimmer

## Problema Atual

A timeline do trimmer mostra o vídeo inteiro em uma faixa fixa de ~800px. Para vídeos longos (ex: 7 minutos), cada segundo ocupa ~2px, tornando impossível posicionar o corte com precisão. O playhead (linha branca) não é arrastável e só aparece dentro da janela de seleção.

## Solução

### 1. Zoom na Timeline (`TrimmerTimeline.tsx`)

Adicionar controles de zoom (🔍+ e 🔍-) acima da timeline:
- Slider ou botões que controlam um `zoomLevel` (1x a 10x)
- A timeline fica dentro de um container com `overflow-x: auto` e scroll horizontal
- Largura interna = `trackWidth * zoomLevel`, expandindo os thumbnails proporcionalmente
- Ao dar zoom, auto-scroll para centralizar a janela de seleção visível
- Pinch-to-zoom em mobile via `onWheel` com Ctrl

### 2. Playhead Arrastável e Visível Sempre

Atualmente o playhead só aparece se `currentTime >= startTime && currentTime <= endTime`. Mudar para:
- Playhead **sempre visível** em toda a timeline (não só dentro da janela)
- Playhead **arrastável** — o usuário pode clicar/arrastar a linha branca para navegar no vídeo
- Ao arrastar, chama `onSeek(time)` que faz `video.currentTime = time` para preview em tempo real
- Playhead acompanha a reprodução real do vídeo (já funciona via `currentTime`)

### 3. Ajustes no Modal (`VideoTrimmerModal.tsx`)

- Importar ícones `ZoomIn`, `ZoomOut` do lucide
- Passar `zoomLevel` e `setZoomLevel` para `TrimmerTimeline`
- A seção da timeline recebe `overflow-x-auto` para permitir scroll quando zoom > 1x

## Arquivos Alterados

| Arquivo | Mudança |
|---------|---------|
| `src/components/video-trimmer/TrimmerTimeline.tsx` | Zoom state, container scrollável, playhead arrastável sempre visível, botões zoom |
| `src/components/video-trimmer/VideoTrimmerModal.tsx` | Ajustar container da timeline para suportar scroll horizontal |

## O que NÃO muda
- `useVideoTrimmer.ts` (lógica de corte, thumbnails, processamento)
- UI do modal (header, preview de vídeo, botões de ação)
- Lógica de upload e envio para AWS
- Nenhuma outra funcionalidade do sistema

