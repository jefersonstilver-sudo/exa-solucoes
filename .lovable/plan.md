## Objetivo
Eliminar o erro crítico do **Relatório de Playlist em Exibição** em que mais de 1 vídeo do mesmo pedido aparece tocando no mesmo prédio. Alinhar 100% à regra canônica usada pela RPC `get_current_display_video` (a mesma fonte que `/admin/buildings → Painéis Ativos` consome).

## Regra canônica (fonte da verdade)
Para cada `pedido`, em qualquer instante, apenas **UM** vídeo está em exibição:
1. **Agendado ativo agora**: existe `campaign_schedule_rules` com `is_active=true` cuja `days_of_week` contém o DOW de Brasília **e** o horário atual está em `[start_time, end_time]`. Desempate: `campaign_video_schedules.priority DESC`, depois `start_time ASC`.
2. **Base** (fallback): `pedido_videos.approval_status='approved' AND is_active=true AND selected_for_display=true`, menor `slot_position`.

## Mudanças (escopo cirúrgico, só o hook do relatório)

**Arquivo único:** `src/hooks/useGlobalPlaylistReport.ts`

1. **Calcular `currentVideoIdByPedido: Map<pedido_id, video_id>`** em memória, replicando a lógica do RPC para evitar N requisições:
   - `nowBR = new Date()` convertido para `America/Sao_Paulo` → extrair `dow` (0–6) e `hhmmss`.
   - Para cada pedido em `pedidosFiltered`, percorrer `pedidoVideos` aprovados; cruzar com `rulesByPedidoVideo` (já carregado) e selecionar o primeiro vídeo cuja regra ativa cobre `nowBR`. Desempate: maior `priority` do `campaign_video_schedules` (precisa ser incluído no SELECT atual de `cvs`), depois menor `start_time`.
   - Se nenhum agendado match → escolher o vídeo base: `approved + is_active + selected_for_display`, menor `slot_position`.
   - Pedido sem candidato → não entra em `allRows`.

2. **Substituir o filtro `if (!pv.selected_for_display) continue;` (linha 309)** por:
   `if (currentVideoIdByPedido.get(pv.pedido_id) !== pv.video_id) continue;`
   Garante exatamente 1 row por pedido por prédio.

3. **Incluir `priority` no SELECT de `campaign_video_schedules`** (linha 235) para suportar o desempate.

4. **Recalcular KPIs/agrupamentos a partir do dataset filtrado**:
   - `totalVideos`, `totalVideosH`, `totalVideosV`, `tempoMedioDias` derivados de `currentVideoIdByPedido` (não mais de `selected_for_display`).
   - `activeOrders.videos_h/v/total` passa a ser 0 ou 1 por pedido (1 quando há vídeo ativo agora, 0 quando o pedido está silenciado/sem base). `has_display` mantém o significado de "tem vídeo tocando agora".
   - `topPredios.videos_count` reflete o novo dataset.
   - `pedidos_ativos_count` por prédio **não muda** (continua contando pedidos, não vídeos).

5. **Adicionar coluna informativa "agendamento" preservada**: continuamos mostrando `schedule_summary` com TODAS as regras do vídeo escolhido (para o usuário ver o "porquê" daquele vídeo estar tocando agora).

6. **Snapshot timestamp no header do relatório**: adicionar `snapshotBrasilia` no `PlaylistReport` (string ISO em America/Sao_Paulo) — apenas exposto no objeto; UI fica como está nesta entrega (não mexer em componentes), o `generatedAt` continua sendo a hora do build.

7. **Logs de auditoria**: `console.debug('[PlaylistReport] snapshot', { nowBR, dow, totalPedidos, pedidosComVideoAtivo, pedidosSemVideoAtivo })` para confirmar em produção que o número de pedidos com vídeo ativo bate com o esperado.

## O que NÃO muda
- Nenhuma alteração visual nos componentes (`ReportByBuilding`, `ReportActiveOrders`, `ReportHeader`, etc.).
- Nenhuma alteração em outras telas (`/admin/buildings`, monitor, etc.).
- Nenhuma mudança de schema, RLS, edge function, RPC, ou tabela.
- A lógica de orientação (H/V), `dias_em_exibicao` (corrigida no patch anterior: `approved_at → data_inicio → created_at`), prédios online/offline e alertas permanecem.

## Validação pós-deploy
1. Edif. Barcelona, pedido `c5f155fc…` num **sábado**: aparece apenas **BLACKNBILL** (regra Dom/Sáb 24h). Em outro dia, aparece **Banner** (base). Nunca os dois juntos.
2. Pedido `20b6e44d…` num **sábado** ou **terça**: apenas **kammer 2**. Outros dias: **KAMMER 1**.
3. KPI `totalVideos` cai para o número real de pedidos com vídeo ativo agora (≤ `totalPedidos`).
4. Cross-check: para cada prédio, contagem H+V por pedido deve ser ≤ 1. Inserir assertiva em `console.debug` que loga qualquer violação encontrada (sanity check permanente).
5. Comparar visualmente o relatório com `/admin/buildings/<id> → Painéis Ativos` — devem listar os mesmos vídeos.
