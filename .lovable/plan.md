

# Plano: Eventos com duração visual (estilo Google Calendar) na agenda

## Problema atual
Na visão de dia (AgendaDayView), cada tarefa ocupa apenas o slot de 1 hora onde começa. Se um evento vai das 14:00 às 15:30, ele aparece só no slot das 14:00 com altura fixa — não cobre visualmente o período inteiro como no Google Calendar.

## Solução

### Arquivo: `src/pages/admin/tarefas/components/AgendaDayView.tsx`

**Refatorar para layout absoluto posicionado (como Google Calendar):**

1. **Calcular posição e altura de cada tarefa baseado em `horario_inicio` e `horario_limite`:**
   - Posição Y = offset em pixels a partir do topo da timeline, baseado no horário de início (hora + minutos)
   - Altura = duração em horas × altura do slot por hora
   - Se não tem `horario_limite`, assume 1 hora de duração padrão
   - Tarefas sem horário continuam na seção "Dia inteiro"

2. **Mudar a timeline de `flex` por hora para container `relative` com altura fixa:**
   - Cada hora = 80px (desktop) / 60px (mobile) de altura
   - Linhas de hora são posicionadas com `absolute` a cada intervalo
   - Tarefas ficam posicionadas com `absolute` sobre as linhas, cobrindo a faixa horária correta
   - Tarefas sobrepostas ficam lado a lado (colunas)

3. **Manter a linha vermelha "now indicator"** com posição absoluta baseada na hora/minuto atual

4. **Estilizar os blocos de evento** com cores baseadas no `tipo_evento` (via `useEventTypes`), emoji do tipo, título, subtipo e horário — similar à imagem de referência

### Arquivo: `src/pages/admin/tarefas/components/AgendaWeekView.tsx`
Aplicar a mesma lógica de altura proporcional nos slots semanais.

### Comportamento visual esperado
```text
09:00 |                                    |
10:00 |████████████████████████████████████ | ← Evento 10:00-11:00 (1h)
11:00 |████████████████████████████████████ |
      |██ Evento 11:00-11:30 (30min) ██████|
12:00 |                                    |
13:00 |                                    |
14:00 |████████████████████████████████████ | ← Evento 14:00-15:30
15:00 |██████████████████████████          | ← continua até 15:30
```

## O que NÃO muda
- Nenhuma outra página, modal, rota ou funcionalidade existente
- A interface AgendaTask permanece inalterada
- Seção "Dia inteiro / Sem horário" continua igual

