

# Auditoria Completa: Sincronizar Portal de Relatórios com Filtro de Período

## Problemas Identificados

### 1. Filtro de período NÃO afeta as estimativas de horas
O `dateRange.start` é ignorado no cálculo de estimativa (linha 370 do `useVideoReportData.ts`). O `effectiveStart` usa `approvedAt` ou `data_inicio`, mas nunca respeita `dateRange.start`. Mudar de "Últimos 30 dias" para "Últimos 10 dias" não muda nada nos números — o filtro é decorativo para estimativas.

### 2. Timeline (gráfico) ignora o dateRange completamente
A linha 461 itera de `dataInicio` até `dataMaxima` (min de hoje e data_fim), sem considerar o período selecionado. O gráfico sempre mostra desde o início da campanha, independente do filtro.

### 3. Exibições estimadas ignoram dateRange
Linhas 518-520: `activeSeconds` é calculado de `effectiveStart` até `hoje`, sem clampar ao intervalo do filtro.

### 4. Botões de zoom do gráfico são decorativos
Os botões "1 Semana", "1 Mês", "Todo Período" alteram o state `zoomLevel`, mas esse state nunca é usado para filtrar os dados. O `Brush` faz o zoom manual, mas os botões não o controlam.

### 5. Card de resumo "Vídeos Totais Exibidos" confuso
Mostra a contagem total de vídeos (incluindo inativos), não filtra por período.

## Solução

### Arquivo 1: `src/hooks/useVideoReportData.ts`
- **Clampar effectiveStart ao dateRange.start** — `effectiveStart = max(approvedAt, dataInicio, dateRange.start)`
- **Clampar effectiveEnd ao dateRange.end** — já existe parcialmente, garantir consistência
- **Filtrar timeline pelo dateRange** — o loop do gráfico deve iterar de `max(dataInicio, dateRange.start)` até `min(hoje, dataFim, dateRange.end)`
- **Filtrar exibições estimadas pelo dateRange** — aplicar o mesmo clamping no cálculo de exhibitions (linhas 518-520)
- **Recalcular diasAtivos com base no dateRange** — para que o label "X dias ativos" reflita o período selecionado

### Arquivo 2: `src/components/advertiser/CampaignPerformanceChart.tsx`
- **Conectar botões de zoom aos dados** — filtrar `chartData` baseado em `zoomLevel`: "1 Semana" mostra últimos 7 pontos, "1 Mês" últimos 30, "Todo Período" mostra tudo
- **Remover Brush redundante** — ou manter Brush mas sincronizar com os botões via `startIndex`/`endIndex`

### Arquivo 3: `src/components/advertiser/CampaignSummaryStats.tsx`
- Renomear "Vídeos Totais Exibidos" para "Vídeos na Campanha" para evitar confusão

## Detalhes Técnicos

### Clamping do dateRange na estimativa
```text
effectiveStart = max(approvedAt, dataInicio, dateRange.start)
effectiveEnd = min(hoje, dataFim, dateRange.end)
totalActiveMs = max(0, effectiveEnd - effectiveStart)
```

### Timeline filtrada
```text
loopStart = max(dataInicio, dateRange.start)
loopEnd = min(hoje, dataFim, dateRange.end)
for (date = loopStart; date <= loopEnd; date++)
```

### Zoom funcional no gráfico
```text
filteredData = zoomLevel === '1w' ? chartData.slice(-7)
             : zoomLevel === '1m' ? chartData.slice(-30)
             : chartData
```

## Impacto
- 3 arquivos modificados
- Nenhuma migration
- O filtro de período passa a funcionar de verdade em todos os números, gráfico e PDF

