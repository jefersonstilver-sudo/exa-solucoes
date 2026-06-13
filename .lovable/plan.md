## Problema
Vários pedidos aparecem como **"0 dias em exibição"** no Relatório de Playlist, o que é impossível para campanhas antigas.

## Causa raiz
Em `src/hooks/useGlobalPlaylistReport.ts` o cálculo usa `pv.updated_at` como data-base:

```ts
const selecionadoEm = pv.updated_at || pv.created_at || null;
dias_em_exibicao: diffDays(selecionadoEm)
```

`updated_at` da tabela `pedido_videos` é reescrito por qualquer alteração (toggle de `selected_for_display`, reorganização de `slot_position`, mudança de `qr_config`, aprovação, sync AWS). Isso zera o contador mesmo para vídeos no ar há meses.

A tabela já expõe a coluna correta: **`approved_at`** — usada pelo utilitário oficial do projeto (`src/utils/videoDisplayDays.ts › calcDisplayDays`).

## Correção (escopo mínimo, só o hook)

**Arquivo:** `src/hooks/useGlobalPlaylistReport.ts`

1. **Incluir `approved_at` e `is_base_video` no SELECT de `pedido_videos`** (campos já existentes na tabela):
   ```
   id, pedido_id, video_id, slot_position, is_active, approval_status,
   selected_for_display, qr_config, created_at, updated_at,
   approved_at, is_base_video,
   videos:videos ( id, nome, url, duracao, orientacao )
   ```

2. **Trocar a fonte da data-base** (no laço que monta `ReportVideoRow`, ~linha 312):
   - Nova prioridade: `approved_at` → `pedido.data_inicio` → `created_at`.
   - Remover por completo o uso de `updated_at` para esse cálculo.
   - Atualizar também o campo `selecionado_em` para refletir essa mesma data (é o que a UI mostra como "selecionado em").

3. **Mesma correção no cálculo do KPI `tempoMedioDias`** (~linha 461), que também usa `pv.updated_at || pv.created_at`. Passa a usar `approved_at` → `created_at` (ignora pedidos sem `approved_at`, como já faz com `> 0`).

4. **Adicionar `console.debug` de diagnóstico** listando, para cada `pedido_video` exibido: `pedido_id`, `video_id`, `approved_at`, `data_inicio`, dias calculados — para validar visualmente após o deploy que nenhum caso volta para "0 dias" indevidamente.

## O que NÃO muda
- Nenhuma alteração visual / UI / colunas / componentes.
- Nenhuma mudança em `ReportByBuilding.tsx`, `ReportActiveOrders.tsx`, `RelatorioPlaylistPage.tsx`.
- Sem mudanças de schema, RLS, edge functions ou outras telas.
- Lógica de orientação H/V, contagem única de vídeos, agendamentos, alertas e prédios online permanecem idênticas.

## Validação
- Recarregar `/super_admin/relatorio-playlist` e conferir que pedidos antigos (ex.: `data_inicio` há meses) mostram dias coerentes (>0) em vez de 0.
- Conferir no `console.debug` que `approved_at` está populado para os casos suspeitos; quando não estiver, o fallback para `data_inicio` cobre.
