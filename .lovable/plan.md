

# Vídeo Base como Fallback Inteligente (Com Horários Parciais)

## Situação Atual no Banco

```text
KAMMER 1 → base=true, SEM schedule → aparece TODOS os 7 dias (ERRADO)
kammer 2 → schedule: Ter(2), Sáb(6) — DIA TODO
KAMMER 3 → schedule: Dom(0), Qua(3) — DIA TODO
KAMMER 4 → schedule: Qui(4) — DIA TODO
```

## Regra Correta (Confirmada pelo Usuário)

O vídeo base é FALLBACK — ele preenche os ESPAÇOS VAZIOS:

1. **Dia sem nenhum agendamento** → vídeo base toca o dia inteiro (24h)
2. **Dia com agendamento DIA TODO** → vídeo base NÃO aparece
3. **Dia com agendamento PARCIAL** (ex: 09h-18h) → vídeo base preenche os horários restantes (00h-09h e 18h-24h)

### Resultado esperado para este pedido (todos são dia todo):

```text
Dom → KAMMER 3 (dia todo)         ← base NÃO aparece
Seg → KAMMER 1 (dia todo)         ← ÚNICO dia livre, base preenche
Ter → kammer 2 (dia todo)         ← base NÃO aparece
Qua → KAMMER 3 (dia todo)        ← base NÃO aparece
Qui → KAMMER 4 (dia todo)        ← base NÃO aparece
Sex → KAMMER 1 (dia todo)        ← ÚNICO dia livre, base preenche
Sáb → kammer 2 (dia todo)        ← base NÃO aparece
```

### Exemplo hipotético com agendamento parcial:

```text
Ter → kammer 2 (09:00-18:00) + KAMMER 1 (00:00-09:00 e 18:00-23:59)
```

## Mudanças

### Arquivo 1: `src/components/video-management/VideoWeeklySchedule.tsx`

Refatorar `generateWeeklySchedule()` (linhas 105-152):

- **Fase 1**: Processar todos os vídeos agendados, coletando por dia quais horários estão ocupados
- **Fase 2**: Para cada dia, calcular as janelas livres (gaps)
- **Fase 3**: Se existem gaps, adicionar vídeo base com os horários corretos das janelas
- Se um dia inteiro está coberto por agendamentos (is_all_day ou cobertura total), o vídeo base NÃO aparece

### Arquivo 2: `src/hooks/useVideoReportData.ts`

**Linhas 346-353** — Refatorar cálculo do vídeo base no dailyMap:
- Fase 1: Processar agendados, marcar por dia quantas horas estão ocupadas
- Fase 2: Para o vídeo base, adicionar apenas nos dias com horas livres
- Fase 2b: No cálculo de `hoursThisDay` (linha 411), para o vídeo base sem schedule, usar as horas de gap calculadas (24h menos horas ocupadas por agendados)

**Linhas 110-138** — Refatorar `formatScheduleInfo`:
- Para vídeo base (isActive && selectedForDisplay && sem regras próprias), calcular dias de fallback e mostrar "Base: Seg, Sex" em vez de "24/7"
- Isso requer passar os scheduleRules de TODOS os vídeos do mesmo pedido para a função

### Arquivo 3: `src/components/advertiser/VideoListItem.tsx`

- Linha 45: Reconhecer `scheduleInfo` que começa com "Base:" como `isDisplaying = true`

## Detalhes Técnicos

### Algoritmo de gap-filling para a grade semanal

```text
para cada dia 0-6:
  scheduledBlocks = []
  para cada vídeo agendado ativo neste dia:
    se is_all_day → scheduledBlocks = [{start: 0, end: 1440}]
    senão → scheduledBlocks.push({start: startMinutes, end: endMinutes})
  
  gaps = calcularGaps(scheduledBlocks, 0, 1440)
  // gaps = [{start: 0, end: 540}, {start: 1080, end: 1440}] ex: antes das 9h e depois das 18h
  
  se gaps.length > 0 e baseVideo existe:
    para cada gap:
      adicionar baseVideo com startTime=gap.start, endTime=gap.end
```

### Cálculo de horas do vídeo base na estimativa

```text
para cada dia 0-6:
  totalScheduledMinutes = soma de minutos de todos os agendamentos do dia
  gapMinutes = max(0, 1440 - totalScheduledMinutes)
  se gapMinutes > 0:
    hoursThisDay = gapMinutes / 60
    // adicionar vídeo base com hoursThisDay
```

## Impacto
- 3 arquivos modificados
- Nenhuma migration
- Lógica de fallback inteligente: vídeo base preenche apenas os espaços vazios

