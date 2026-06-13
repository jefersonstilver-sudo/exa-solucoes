## Ajustes adicionais no Relatório de Playlist

### 1. Remover preço/valor das tabelas de vídeo
**Arquivo:** `src/components/admin/buildings/relatorio-playlist/ReportByBuilding.tsx`
- Remover a coluna `Valor` (`<th>` e `<td>` que renderiza `fmtMoney(r.valor_total)`) das tabelas de vídeos horizontais/verticais.
- Remover o helper `fmtMoney` se ficar sem uso.

### 2. Status do vídeo = "Em exibição" (não "approved")
**Arquivo:** `src/components/admin/buildings/relatorio-playlist/ReportByBuilding.tsx`
- A coluna **Status** deve refletir o estado real: como o relatório só lista vídeos com `selected_for_display = true`, o badge deve dizer **"Em exibição"** (verde discreto / slate, sem verde berrante — usar `bg-slate-100 text-slate-700 border-slate-200` ou EXA Red sutil).
- Remover o componente `StatusBadge` que mostrava `approved/pending/rejected` e substituir por um badge fixo "Em exibição".

### 3. Contagem H/V no header de cada prédio
**Arquivo:** `src/components/admin/buildings/relatorio-playlist/ReportByBuilding.tsx`
- No `<header>` do `BuildingBlock`, ao lado dos chips de status/telas/online, acrescentar dois chips:
  - `📺 H: {b.videosH.length}`
  - `📱 V: {b.videosV.length}`
- Manter mesmo estilo dos chips existentes (`bg-slate-100 text-slate-700`).

### 4. Nova seção "Pedidos ativos" no topo (acima do Dashboard) — colapsável e com scroll
**Novo arquivo:** `src/components/admin/buildings/relatorio-playlist/ReportActiveOrders.tsx`
- Posicionado **acima** do `ReportDashboard` em `RelatorioPlaylistPage.tsx`.
- Usa `Collapsible` (shadcn `@/components/ui/collapsible`) com trigger no estilo EXA Premium (chip arredondado, ícone chevron, contagem total).
- Conteúdo dentro de um container com `max-h-[420px] overflow-y-auto` (scroll vertical).
- Para cada pedido ativo exibe uma linha/card compacto com:
  - ID curto do pedido (`p.id.slice(0,8)…`)
  - Cliente (nome + e-mail)
  - Plano (`{plano_meses}m`) e período (`data_inicio → data_fim`)
  - Nº de prédios do pedido (`lista_predios` interseccionada com prédios elegíveis)
  - Nº de vídeos em exibição totais
  - Nº de vídeos **H** e **V** separados
  - Badge "Sem vídeo em exibição" em vermelho quando aplicável
- Sem coluna de valor/preço.
- Print-friendly: dentro de `@media print`, expandir automaticamente (forçar `data-state=open` via CSS).

### 5. Dados de "Pedidos ativos" — expor no hook
**Arquivo:** `src/hooks/useGlobalPlaylistReport.ts`
- Adicionar à interface `PlaylistReport` um campo `activeOrders: ReportActiveOrder[]` com:
  ```ts
  interface ReportActiveOrder {
    pedido_id: string;
    client_id: string;
    client_name: string;
    client_email: string;
    plano_meses: number | null;
    data_inicio: string | null;
    data_fim: string | null;
    predios_count: number;
    videos_total: number;   // únicos por pedido
    videos_h: number;
    videos_v: number;
    has_display: boolean;
  }
  ```
- Calcular a partir de `pedidosFiltered` + `pedidoVideos` (filtrados por `selected_for_display = true`). Contagem H/V única por `pedido_id+video_id`.
- **NÃO** incluir `valor_total` aqui.

### 6. Diagnóstico do agendamento
- A query atual já lê `campaigns_advanced → campaign_video_schedules → campaign_schedule_rules`. Banco tem 21 regras ativas (`is_active=true`) — então funciona para esses casos.
- Para os vídeos sem regra, o texto "Sem agendamento configurado" permanece (correto).
- Adicionar log `console.debug('[PlaylistReport] schedules', { campAdv, cvs, rules })` para o usuário confirmar no console quais pedidos têm/não têm agendamento.
- Garantir fallback: se `pv.video_id` casar com qualquer `campaign_video_schedules.video_id` do mesmo pedido (mesmo que o link via `campaigns_advanced.pedido_id` tenha múltiplas campanhas), agregar todas as regras.

### Escopo
- Sem mudanças de schema.
- Sem alterações em outras telas/funcionalidades.
- Manter EXA Premium (glassmorphism, `#C7141A`/`#7D1818`, sem verde berrante).
