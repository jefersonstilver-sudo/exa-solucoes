## Auditoria — o que aconteceu

### Problema 1 — Trimmer mobile travado / sem usabilidade
Hoje no mobile usamos `SimpleTrimmerSlider` (um `<input type="range">` simples). Resultado:
- Não há régua nem marcadores fixos do tamanho da janela (10s horizontal / 15s vertical premium).
- Não há preview do "cortado" — o usuário não consegue assistir só o trecho.
- O play roda o vídeo inteiro, não respeita o `startTime`/`endTime`.
- Sem feedback visual da janela selecionada sobre a timeline.
- O `setStartTime` força uma única dimensão (início) sem indicar visualmente o intervalo final.

A janela de corte JÁ é fixa por produto (`maxDuration` = 10s ou 15s) — mas a UI não comunica isso e não permite arrastar a janela inteira de forma fluida.

### Problema 2 — Vídeo aprovado vai para a API externa como `ativo: false`
**Pedido:** `c5f155fc-9abc-4175-bd00-bcd75048744a` (BlackNBill, jefi92@gmail.com)  
**Vídeo novo:** `quinta texicana` (slot 2, aprovado hoje 18:25)  
**Vídeo antigo:** `BLACKNBILL` (slot 1, aprovado 24/03 — `is_active=false`, `selected_for_display=false`)

Em `supabase/functions/upload-video-to-external-api/index.ts` (linhas 164–208):

```ts
const isFirstApproved = (approvedCount ?? 0) === 0;
// ...
ativo: isFirstApproved
```

Como já existia o BLACKNBILL aprovado (mesmo desativado), `approvedCount = 1` → `isFirstApproved = false` → o vídeo novo foi para a AWS como **`ativo: false`**.

A regra correta deveria ser: **enviar como `ativo: true` se este vídeo for o `selected_for_display`/`is_active` no banco, ou se não houver nenhum outro `selected_for_display=true` no pedido (e não houver agendamento vigente conflitante).** O critério atual ("primeiro aprovado") está errado porque ignora trocas de vídeo principal.

Quando depois o usuário marcou "quinta texicana" como principal pelo painel, `setBaseVideo` chama `sync-video-status-to-aws` que faz `PATCH /ativo/batch`. Os logs mostram chamadas funcionando para outros pedidos hoje (Kammer Soho), mas **não há entrada para o título `Blackbill_-_Quinta_Texicana...`** — ou seja, o sync-toggle não foi disparado para esse vídeo, ou foi disparado antes de ele existir na AWS. Resultado: na AWS continua `ativo: false`.

---

## Plano

### 1) Refazer o trimmer mobile como componente profissional
Substituir `SimpleTrimmerSlider` por `MobileTrimmerTimeline` com:
- **Trilho horizontal** mostrando duração total do vídeo (linha cinza).
- **Janela fixa destacada em vermelho EXA** (#C7141A) com largura proporcional a `windowSize` (10s ou 15s — fixa, sem permitir redimensionar).
- **Drag fluido da janela inteira** via touch (pointer events com `requestAnimationFrame`), com snap às bordas (0 e `duration - windowSize`).
- **Marcadores numéricos fixos** nas extremidades (`0:00` e `total`) e no início/fim da janela (`startTime` / `endTime`) atualizados em tempo real.
- **Botão Play que respeita o trecho:** ao apertar play, vídeo vai para `startTime`, toca até `endTime`, depois loopa — exatamente o que o desktop já faz em `useVideoTrimmer.togglePlay`. Hoje no mobile isso já existe, mas o usuário não percebe porque não há indicação visual de "estou tocando só o trecho".
- **Indicador de playhead** (linha vertical animada) dentro da janela mostrando o progresso da reprodução do trecho.
- **Touch targets ≥ 44px** e haptic feedback (`navigator.vibrate?.(10)`) ao iniciar drag.
- **Preview do thumbnail central** (1 frame leve no startTime) para o usuário identificar onde está cortando, sem gerar 8+ thumbs (que travam o Safari).

Resultado: no mobile o usuário arrasta a janela vermelha de 10s/15s pela timeline, vê os tempos atualizando, aperta play e assiste apenas ao trecho que vai usar — igual a apps profissionais (CapCut, iOS Photos).

### 2) Corrigir flag `ativo` no upload para API externa
Em `supabase/functions/upload-video-to-external-api/index.ts`:
- Trocar a regra "isFirstApproved" por uma consulta direta ao estado real do slot:
  ```ts
  const { data: thisSlot } = await supabase
    .from('pedido_videos')
    .select('selected_for_display, is_active')
    .eq('id', pedido_video_id).single();

  // Verificar se há agendamento vigente que prevalece
  const hasActiveSchedule = await checkScheduleConflict(pedido_video_id);

  const ativo = (thisSlot?.selected_for_display && thisSlot?.is_active)
                || (!hasActiveSchedule && !await hasOtherDisplayedVideo(pedido_id, pedido_video_id));
  ```
- Garantir que, quando o vídeo é enviado como `ativo: true`, qualquer outro vídeo `selected_for_display=true` do mesmo pedido seja **desativado na AWS** na sequência (chamando `sync-video-status-to-aws` ao final do upload bem-sucedido), evitando dois vídeos tocando.

### 3) Re-sync imediato do pedido BlackNBill
Após deploy, disparar uma única chamada manual de `sync-video-status-to-aws` para `pedido_id=c5f155fc...` com `activeVideoId=efc4221a-9020-4dd1-acb0-3c2159581650` (quinta texicana) para corrigir o estado atual na AWS — desativando `BLACK_BILL_REDUZIDO.mp4` e ativando `Blackbill_-_Quinta_Texicana_Vertical_v4__1_.mp4`.

### Localização dos vídeos no Supabase (referência)
Bucket público `videos/`:
- `de96cfa9-9dbe-4ead-be94-3647e345d2de/1777487076358_Blackbill_-_Quinta_Texicana_Vertical_v4__1_.mp4` (novo principal)
- `de96cfa9-9dbe-4ead-be94-3647e345d2de/1774386415598_BLACK_BILL_REDUZIDO.mp4` (antigo, deve ficar inativo)

---

## Arquivos a alterar

- `src/components/video-trimmer/SimpleTrimmerSlider.tsx` → reescrever como `MobileTrimmerTimeline` (drag da janela + playhead + marcadores fixos).
- `src/components/video-trimmer/VideoTrimmerModal.tsx` → passar `currentTime` e `seekPreview` ao componente mobile.
- `src/components/video-trimmer/useVideoTrimmer.ts` → expor `currentTime` durante reprodução também no mobile (já existe via `tick()`, validar).
- `supabase/functions/upload-video-to-external-api/index.ts` → trocar lógica `isFirstApproved` por leitura real de `selected_for_display`/`is_active`/agendamento; disparar desativação do anterior se aplicável.
- Migração SQL (one-shot, opcional): chamada explícita ao `sync-video-status-to-aws` para o pedido BlackNBill via script Edge.

Nenhuma outra UI/feature será alterada.