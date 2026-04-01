

# Plano: Corrigir Logs de Reprodução + Badge de Tipo de Produto

## Problemas Identificados

1. **Player não envia `pedido_id` nos logs** — `onVideoStart(currentVideo.video_id)` é chamado sem `pedido_id`, mesmo que `activeVideos` tenha esse campo. Resultado: logs na tabela ficam sem `pedido_id`, e o relatório não consegue associar reproduções a pedidos.

2. **Horas individuais por vídeo ainda usam fórmula estimada** — O relatório usa dados reais apenas para os totais do pedido (`totalHoras`, `totalExibicoes`), mas cada `VideoInfo.horasExibidas` continua vindo de `calculateDisplayHours()` (fórmula fictícia com "245 exibições/dia").

3. **Falta badge de tipo de produto** — Os cards do relatório não mostram se o pedido é Horizontal ou Vertical Premium. O campo `tipo_produto` existe na tabela `pedidos`.

## Correções

### 1. Player: passar `pedido_id` no log (`MinimalDisplayPanel.tsx`)

- Na linha `onPlay`, o `currentVideo` já tem `video_id` via `formattedActiveVideos`, mas `pedido_id` não é propagado.
- Adicionar `pedido_id` ao tipo `MinimalVideo` local e propagar de `activeVideos`.
- Alterar chamada: `onVideoStart(currentVideo.video_id, currentVideo.pedido_id)`.

### 2. Relatório: usar logs reais por vídeo (`useVideoReportData.ts`)

- Ao calcular `horasExibidas` de cada vídeo, buscar do array `playbackLogs` filtrado por `video_id` em vez de chamar `calculateDisplayHours()`.
- Se não houver logs para o vídeo, manter 0 (dado real = zero reproduções registradas) ou estimativa com flag.
- O gráfico de evolução (`videoTimeline`) também deve usar dados reais agrupados por dia quando disponíveis.

### 3. Adicionar `tipo_produto` ao relatório

**`useVideoReportData.ts`**:
- Adicionar `tipoProduto: string` ao tipo `CampaignReport`.
- Buscar `tipo_produto` do pedido (já vem do `select('*')`).

**`CampaignReportCard.tsx`**:
- Exibir badge visível ao lado do nome: `🖼️ Horizontal` (azul) ou `📺 Vertical` (roxo), usando o mesmo padrão visual já usado em `PropostasPage.tsx`.

## Arquivos Alterados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/public/MinimalDisplayPanel.tsx` | Propagar `pedido_id` para `onVideoStart` |
| `src/hooks/useVideoReportData.ts` | Horas por vídeo via logs reais + `tipoProduto` no tipo |
| `src/components/advertiser/CampaignReportCard.tsx` | Badge de tipo de produto (Horizontal/Vertical) |

## O que NÃO muda
- Tabela `video_playback_logs` (já existe)
- Edge Function `log-video-playback` (já aceita `pedido_id`)
- Hook `usePlaybackLogger` (já aceita `pedido_id` como parâmetro)
- Layout geral, sistema de aprovação, outras páginas

