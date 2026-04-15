

# Auditoria Completa: Sincronizar Relatório com Programação do Pedido

## Problemas Identificados

### 1. Badge "Não exibindo" em vídeos agendados (VideoListItem.tsx)
**Linha 45**: `isDisplaying = isActive && selectedForDisplay && approvalStatus === 'approved'`
Vídeos com schedule (kammer 2, 3, 4) têm `is_active=false`, então mostram "Não exibindo" + "sem exibição" — mesmo tendo horas calculadas (227.7h, 130.2h, 113.9h).

### 2. Contagem "1 em exibição · 3 inativos" errada (CampaignReportCard.tsx)
**Linha 99**: `videosAtivos` usa mesma lógica `isActive && selectedForDisplay` — deveria contar vídeos agendados como ativos.

### 3. KAMMER 1 com horas infladas (useVideoReportData.ts)
KAMMER 1 não tem regras de agendamento → `scheduleFactor = 1` (24/7). Mas o cálculo do ciclo usa um `totalCycleDuration` fixo que inclui todos os vídeos agendados. Na realidade, KAMMER 1 divide a playlist com vídeos diferentes em dias diferentes:
- Seg/Sex: sozinho (ciclo = 15s, share = 100%)
- Ter/Sáb: com kammer 2 (ciclo = 30s, share = 50%)
- Dom/Qua: com KAMMER 3 (ciclo = 30s, share = 50%)
- Qui: com KAMMER 4 (ciclo = 30s, share = 50%)

O cálculo atual assume um ciclo fixo, inflando ou deflando as horas.

### 4. PDF não mostra informação de agendamento
A tabela de vídeos no PDF mostra apenas Nome/Duração/Horas/Status. Não indica se é 24/7 ou agendado.

## Solução

### Arquivo 1: `src/components/advertiser/VideoListItem.tsx`
- **Linha 45**: Mudar `isDisplaying` para incluir vídeos com schedule:
  ```
  const isDisplaying = (isActive && selectedForDisplay && approvalStatus === 'approved') 
    || (approvalStatus === 'approved' && scheduleInfo?.startsWith('Agendado'));
  ```
- Isso corrige automaticamente o badge (mostrará "Agendado: Ter, Sáb" em vez de "Não exibindo") e o label "total exibido" em vez de "sem exibição"

### Arquivo 2: `src/components/advertiser/CampaignReportCard.tsx`
- **Linha 99**: Incluir vídeos agendados na contagem de ativos:
  ```
  const videosAtivos = campaign.videos.filter(v => 
    (v.isActive && v.selectedForDisplay && v.approvalStatus === 'approved') ||
    (v.approvalStatus === 'approved' && v.scheduleInfo?.startsWith('Agendado'))
  ).length;
  ```

### Arquivo 3: `src/hooks/useVideoReportData.ts`
- **Refatorar cálculo de horas para considerar composição diária da playlist**: Em vez de usar um `totalCycleDuration` fixo por prédio, calcular por dia da semana quais vídeos estão ativos naquele dia, determinar o ciclo daquele dia, e somar as horas proporcionalmente.
- Lógica:
  - Para cada dia da semana (0-6), determinar quais vídeos rodam (24/7 + agendados para aquele dia)
  - Calcular ciclo daquele dia = soma das durações dos vídeos ativos naquele dia
  - Share do vídeo naquele dia = duração_video / ciclo_dia
  - Horas por dia = 24h × share × num_telas (se all_day) ou horas_agendadas × share × num_telas
  - Total = soma dos 7 dias × (semanas_ativas)

### Arquivo 4: `src/components/advertiser/CampaignPDFExporter.tsx`
- Adicionar coluna "Programação" na tabela de vídeos do PDF, mostrando scheduleInfo (24/7 ou Agendado: dias)
- Atualizar interface `CampaignPDFData.videos` para incluir `scheduleInfo`
- Atualizar `CampaignReportCard.tsx` para passar `scheduleInfo` no pdfData

## Impacto
- 4 arquivos modificados
- Nenhuma migration
- A lógica de estimativa fica mais precisa e sincronizada com a programação semanal real

