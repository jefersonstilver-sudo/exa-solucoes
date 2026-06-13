
## 1. Corrigir prédios mostrados como offline indevidamente
`src/hooks/useGlobalPlaylistReport.ts` (linha ~204)

A query de `devices` usa `.eq('is_active', true)`, mas o monitor canônico (`src/modules/monitoramento-ia/utils/devices.ts`) usa `.or('is_deleted.is.null,is_deleted.eq.false')`. Devices reais online mas sem `is_active=true` ficam invisíveis e o prédio aparece como Offline/Sem painel.

- Trocar o filtro de `devices` para `.or('is_deleted.is.null,is_deleted.eq.false')`, igualando exatamente o monitor público.
- Manter a regra atual `bd.some(d => status==='online')` (já idêntica ao `useBuildingsPanelsStatus`).

## 2. Miniaturas dos vídeos na página (não no PDF)
`src/components/admin/buildings/relatorio-playlist/ReportByBuilding.tsx`

- Adicionar coluna `Miniatura` (primeira da `VideoTable`) com `<video src={video_url} preload="metadata" muted playsInline>` 80×45 (horizontal) ou 45×80 (vertical), `className="video-thumb"`.
- Hover dá play silencioso; mouseleave pausa — mesmo padrão do `VideoPreviewCard` existente. Sem novo componente: inline simples para evitar regressão.
- A classe `.video-thumb` já é escondida no `report-print.css`, então os thumbs somem no PDF automaticamente.

## 3. PDF exporta APENAS a relação Prédio × Pedido × Vídeo
`src/pages/admin/RelatorioPlaylistPage.tsx`, `src/components/admin/buildings/relatorio-playlist/report-print.css`, `ReportByBuilding.tsx`

- Adicionar `no-print` em `ReportActiveOrders`, `ReportDashboard`, `ReportAlerts` e no banner vermelho do `ReportHeader`. No PDF resta: um título compacto pt-BR + a seção "Visão por Prédio".
- Inserir no topo da página um bloco `print-only` minimalista: "Relatório de Playlist em Exibição — gerado em {data} por {usuário}".
- No CSS de print:
  - Esconder colunas pouco úteis no papel via classes `print-hide-col` em `<th>/<td>`: `Slot`, `Dur.`, `QR`, `Status`, `▶`.
  - Deixar visível no PDF: `Vídeo` (nome em negrito), `Cliente`, `Pedido` (8 chars + plano), `Período`, `Dias no ar`, `Agendamento`.
  - Cabeçalho de cada prédio compacto: nome + bairro + status online/offline + contagem H/V.
  - `page-break-before: always` em cada prédio com vídeos para legibilidade.
  - `.video-thumb` continua oculto no PDF (já está).

## 4. Fora de escopo
Sem alterações em outros KPIs, no card "Clientes", RPC, RLS, schema, edge functions ou qualquer outro fluxo/UI. O filtro `totalPredios` (excluindo `interno`) permanece igual.
