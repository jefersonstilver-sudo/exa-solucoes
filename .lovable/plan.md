

# Corrigir Métricas: Exibições por Vídeo + Cortar em Ontem

## Dados do Banco (Confirmados)

```text
Pedido: 20b6e44d (kammer)
Período: 2026-03-31 → 2027-03-31
Logs de reprodução: 0 (nenhum log real em video_playback_logs)

Vídeos:
- KAMMER 1: base=true, is_active=true, selected=true, SEM schedule
- kammer 2: schedule Ter/Sáb (dia todo), is_active=false
- KAMMER 3: schedule Dom/Qua (dia todo), is_active=false  
- KAMMER 4: schedule Qui (dia todo), is_active=false
```

## Problemas

1. **Métrica errada**: Mostra "horas exibidas" mas o usuário quer "número de exibições" (count de reproduções de 15s)
2. **Período inclui hoje**: O filtro vai até hoje, mas dados de hoje não existem ainda. Deve cortar em **ontem**.
3. **"Relatório disponível em 24h"**: Aparece mesmo quando o pedido está ativo há dias. Deveria aparecer APENAS se o pedido começou hoje. Se começou antes de ontem, deve mostrar 0 exibições com clareza.

## Decisões do Usuário
- **Período**: Cortar em ontem (hoje não aparece)
- **Métrica por vídeo**: Exibições (count), não horas

## Mudanças

### Arquivo 1: `src/hooks/useVideoReportData.ts`

**Interface VideoInfo** (linha 22-31):
- Adicionar campo `exibicoes: number` (count de logs por vídeo)
- Manter `horasExibidas` para uso secundário

**Interface VideoTimelinePoint** (linha 33-41):
- Adicionar `exibicoes: number` em cada vídeo do ponto do timeline (para o gráfico mostrar exibições)

**Corte de período** (linhas 310-321):
- `dataMaxima`: usar `subDays(hoje, 1)` em vez de `hoje` — dados só existem até ontem
- Clampar `filteredEnd` ao máximo de ontem

**Cálculo de exibições por vídeo** (linhas 437-448):
- `exibicoes = videoLogs.length` (count de logs)
- `horasExibidas = soma(duration_seconds) / 3600`

**Gráfico timeline** (linhas 486-535):
- Mudar de horas acumuladas para exibições por dia
- Para cada data no timeline, contar logs reais naquele dia por vídeo
- Se não há logs, exibições = 0

**Totais da campanha** (linhas 544-558):
- `totalExibicoesCalc = pedidoLogs.length` (já está correto)

### Arquivo 2: `src/components/advertiser/VideoListItem.tsx`

**Props** (linhas 6-16):
- Adicionar `exibicoes?: number`

**Métrica à direita** (linhas 173-192):
- Trocar de `formatDisplayTime(horasExibidas)` para `exibicoes.toLocaleString()`
- Label: "exibições" em vez de "total exibido"
- Quando `exibicoes === 0` e `isDisplaying`: mostrar "0" com nota "Relatório disponível em 24h" APENAS se o pedido começou hoje/ontem. Caso contrário, mostrar "0 exibições".

### Arquivo 3: `src/components/advertiser/CampaignPerformanceChart.tsx`

**Y-axis** (linhas 134-139):
- Trocar label de "Horas de Exibição" para "Exibições"
- Trocar formatter de `${value}h` para `${value}`

**Tooltip** (linhas 80-84):
- Trocar de `{entry.value.toFixed(1)}h` para `${entry.value} exibições`

**Data mapping** (linhas 34-46):
- Usar `video.exibicoes` em vez de `video.horasExibidas` (ou novo campo)

### Arquivo 4: `src/components/advertiser/CampaignReportCard.tsx`

**Métricas resumidas** (linhas 188-210):
- Manter "Exibições" como está (já usa totalExibicoes)
- Trocar "Tempo Total" para mostrar exibições se preferir, ou manter como secundário

### Arquivo 5: `src/pages/advertiser/MyVideos.tsx`

**DateRange padrão** (linhas 14-17):
- `end: subDays(new Date(), 1)` — padrão corta em ontem

## Detalhes Técnicos

### Corte de período em ontem
```text
// MyVideos.tsx — dateRange padrão
end: subDays(new Date(), 1)  // ontem

// useVideoReportData.ts — dataMaxima
const ontem = subDays(hoje, 1);
const dataMaxima = min([ontem, dataFim]);
```

### Exibições por dia no gráfico
```text
para cada data no período:
  para cada vídeo:
    exibicoes = playbackLogs.filter(l => 
      l.video_id === video.id && 
      date(l.started_at) === dateStr
    ).length
```

### Métrica no VideoListItem
```text
Antes:  "2.5h" / "total exibido"
Depois: "1,234" / "exibições"
```

## Impacto
- 5 arquivos modificados
- Nenhuma migration
- Muda a métrica principal de horas para contagem de exibições
- Período sempre corta em ontem

