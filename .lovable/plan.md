

# Plano: Revisao Completa do Video Trimmer

## Problemas identificados

1. **Z-index**: O modal usa `zIndex: 99999` inline mas esta renderizado DENTRO de um componente pai com contexto de stacking (motion.div, Card). Precisa ser renderizado via React Portal para escapar da hierarquia DOM.
2. **Janela nao fixa**: Atualmente as alcas sao independentes. O usuario quer uma janela fixa de exatamente 10s (ou maxDuration) que so desliza pela timeline.
3. **Modal pequeno**: Precisa ser fullscreen em mobile e maior em desktop.
4. **Feedback ao arrastar**: Precisa de animacoes mais fluidas e indicadores visuais melhores.

## Mudancas

### 1. VideoTrimmerModal.tsx — Redesign completo

- Renderizar via `ReactDOM.createPortal(modal, document.body)` para garantir que fique acima de TUDO
- **Fullscreen em mobile**: `fixed inset-0` com `100dvh`
- **Desktop**: modal centralizado com `max-w-4xl` (bem maior que o atual 720px)
- Preview do video ocupa a maior area possivel (aspect-ratio 16/9, width total)
- Remover scroll desnecessario — layout flex vertical com video grande + timeline compacta + botoes
- Animacoes framer-motion refinadas (spring com damping otimizado)
- Fundo `bg-black/90 backdrop-blur-xl` para imersao total

### 2. TrimmerTimeline.tsx — Janela fixa

- **Logica nova**: Apenas UMA regiao arrastavel de tamanho fixo (= maxDuration)
- Remover alcas individuais start/end
- A regiao inteira e arrastavel (grab/drag) pela timeline
- Ao arrastar, a regiao desliza mantendo sempre o tamanho fixo
- Thumbnails maiores (h-20) com mais qualidade visual
- Feedback visual: regiao ativa com borda vermelha grossa, areas fora escurecidas
- Animacao suave no playhead com transition CSS
- Indicador claro "10s" no centro da regiao selecionada

### 3. useVideoTrimmer.ts — Simplificar estado

- `startTime` calculado automaticamente: `endTime = startTime + maxDuration`
- Apenas `setStartTime` como setter (endTime e derivado)
- Clamp: `startTime` entre 0 e `duration - maxDuration`

### 4. Integracao (VideoSlotUpload + OrderConfirmation)

- Mover renderizacao do `VideoTrimmerModal` para usar `createPortal(el, document.body)` dentro do proprio modal (nao precisa mudar os pais)

## Arquivos editados

1. `src/components/video-trimmer/VideoTrimmerModal.tsx` — Rewrite com portal, fullscreen, layout maior
2. `src/components/video-trimmer/TrimmerTimeline.tsx` — Rewrite com janela fixa arrastavel
3. `src/components/video-trimmer/useVideoTrimmer.ts` — Simplificar para janela fixa

