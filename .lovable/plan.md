

# Plano: Data no padrão brasileiro com dia da semana em todas as notificações

## Problema
As datas nas notificações WhatsApp estão em formato ISO (`2026-03-30`) em vez do padrão brasileiro (`Segunda-feira, 30/03/2026`). Isso acontece em 3 edge functions que usam `data_prevista` direto do banco sem formatar.

## Solução

Criar uma função helper `fmtDateBR` em cada edge function que converte `YYYY-MM-DD` para `Segunda-feira, 30/03/2026`:

```typescript
const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function fmtDateBR(dateStr: string): string {
  if (!dateStr) return '';
  // Detect if already formatted (contains "/")
  if (dateStr.includes('/')) {
    // Already dd/MM/yyyy, just add weekday
    const [d, m, y] = dateStr.split('/').map(Number);
    const dt = new Date(y, m - 1, d);
    return `${DIAS_SEMANA[dt.getDay()]}, ${dateStr}`;
  }
  // ISO format YYYY-MM-DD
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${DIAS_SEMANA[dt.getDay()]}, ${dd}/${mm}/${y}`;
}
```

### Arquivos a alterar

**1. `supabase/functions/task-notify-change/index.ts`** (reagendamento)
- Adicionar `fmtDateBR`
- Linhas 109-115: aplicar `fmtDateBR()` nos valores de `oldDate` e `newDate`
- Ex: `📅 Data: ~Segunda-feira, 30/03/2026~ → *Terça-feira, 31/03/2026*`

**2. `supabase/functions/task-reminder-scheduler/index.ts`** (lembretes)
- Adicionar `fmtDateBR`
- Linha 316: trocar `task.data_prevista` por `fmtDateBR(task.data_prevista)`
- Ex: `📅 Segunda-feira, 30/03/2026 às 23:45`

**3. `supabase/functions/task-notify-created/index.ts`** (criação)
- A data já vem formatada do frontend como `dd/MM/yyyy` — adicionar dia da semana
- Linha 69: aplicar `fmtDateBR(params.data)` para incluir o dia da semana

### O que NÃO muda
- Nenhuma UI, modal, calendário ou funcionalidade existente
- Formato dos horários (já correto em HH:MM)
- Fluxo de confirmação/follow-up

