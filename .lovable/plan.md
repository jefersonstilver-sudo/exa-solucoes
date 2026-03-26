

# Plano: Ajustes de Layout do Trimmer + Feedback Visual do Slot

## Problemas na imagem

1. **Timeline encostando no video**: Nao ha espaco entre a area do video (bg-slate-950) e a timeline (bg-white). A timeline esta colada.
2. **Botoes desalinhados e encostados na borda**: O footer com "Cancelar" e "Cortando..." esta sem padding adequado e os botoes estao proximos demais da borda inferior do modal.
3. **Progresso em loop / ficticio**: A barra de progresso "Processando video... 80%" continua rodando apos o corte. O `MediaRecorder` pode nao estar parando corretamente em todos os cenarios (ex: video com codec nao suportado no canvas).
4. **Slot nao muda de cor apos upload**: Apos concluir o trim + upload, o slot permanece com a mesma aparencia de "vazio", confundindo o usuario. Precisa de destaque visual claro.

## Mudancas

### 1. `VideoTrimmerModal.tsx` — Layout spacing

- Adicionar `pt-5` na section da timeline (`px-4 sm:px-6 pt-5 pb-3`) para separar da area do video
- Adicionar `mb-1` apos a barra de progresso
- Footer: aumentar padding para `px-6 sm:px-8 py-6` e adicionar `gap-5`
- Adicionar `safe-area-inset-bottom` para iPhones com home indicator

### 2. `useVideoTrimmer.ts` — Fallback para falha do MediaRecorder

- Se `MediaRecorder` falhar ou o codec nao for suportado, usar fallback: retornar o arquivo original com `slice()` no Blob (corte logico, nao fisico) — melhor que travar eternamente
- Adicionar try/catch ao redor do `new MediaRecorder()` com fallback
- Garantir que `setState({ isProcessing: false })` sempre execute no finally

### 3. `VideoSlotCard.tsx` — Destaque visual apos upload

- Quando `slot.approval_status === 'pending'` e `slot.video_data` existe, usar borda `border-2 border-amber-400 bg-amber-50/60` com badge "Enviado" em amarelo/ambar
- Isso diferencia visualmente o slot de "vazio" vs "enviado aguardando aprovacao"

### 4. `UploadStatus.tsx` — Feedback pos-upload

- No estado `success`, trocar o icone verde generico por um mais destacado com animacao de check
- Nenhuma mudanca estrutural — apenas garantir que o estado `success` seja atingido corretamente

## Arquivos editados

1. `src/components/video-trimmer/VideoTrimmerModal.tsx` — Spacing entre video e timeline, padding do footer
2. `src/components/video-trimmer/useVideoTrimmer.ts` — Fallback do MediaRecorder, cleanup robusto
3. `src/components/video-management/VideoSlotCard.tsx` — Cor diferenciada para slot com video pendente

