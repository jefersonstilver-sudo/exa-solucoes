

# Auditoria Completa: Destinatários de Compromissos via ZAPI

## Diagnóstico Confirmado

A auditoria revelou que **pessoas que NÃO foram selecionadas para um compromisso específico estão recebendo notificações** porque várias edge functions usam a tabela `exa_alerts_directors` como fallback/merge indiscriminado.

### Evidência concreta do banco de dados

```text
TABELA exa_alerts_directors (13 contatos ativos):
  Alencar Lima, Beatriz, Blenda Pessoal, Blenda TRABALHO,
  JEFERSON, Jeniffer Aireliza, joao, jonathan kaizen, kAIZEN,
  Marcio Abrasel, Melo, Pamela Via laser, Rockuy

CASO REAL — Tarefa "Reunião MAGNO BANCO EBW" (13331d49):
  → Criada com 2 contatos selecionados (Jefferson Silver + Blenda TRABALHO)
  → Quando ALTERADA: task-notify-change enviou para 14 contatos!
  → Motivo: a função faz merge de receipts + TODOS os directors ativos

CASO REAL — Tarefa "Apresentação ABRASEL" (a0f9b72a):  
  → Criada com 6 contatos selecionados (Jeferson, Jeniffer, Beatriz, Blenda×2, Marcio)
  → Se for alterada/cancelada → iria para TODOS os 13 directors ativos
  → Marcio recebeu corretamente porque FOI selecionado nesta tarefa
```

### Causa raiz — 5 edge functions com lógica errada

| Edge Function | Comportamento atual | Problema |
|---|---|---|
| `task-notify-created` | Usa `specific_contacts` do frontend | OK — respeita seleção |
| `task-notify-change` | Merge `task_read_receipts` + TODOS `exa_alerts_directors` | Envia para quem NÃO foi selecionado |
| `task-notify-cancelled` | Merge `task_read_receipts` + TODOS `exa_alerts_directors` | Envia para quem NÃO foi selecionado |
| `task-follow-up-cron` | Escalação vai para TODOS `exa_alerts_directors` | Envia para quem NÃO foi selecionado |
| `task-follow-up-response` | Broadcasts de conclusão/reagendamento/cancelamento vão para TODOS `exa_alerts_directors` | Envia para quem NÃO foi selecionado |
| `task-reminder-scheduler` | Fallback: se não há `task_read_receipts`, usa TODOS `exa_alerts_directors` | Envia para quem NÃO foi selecionado |
| `task-daily-report` | Envia para TODOS `exa_alerts_directors` | OK — é relatório global configurado separadamente |

### Resumo diário — está correto
O resumo diário (`agenda_resumo_diario`) está configurado para enviar apenas para JEFERSON às 08:09. Isso está funcionando corretamente e NÃO será alterado.

## Plano de Correção

**Princípio**: `task_read_receipts` é a fonte de verdade de quem deve receber notificações sobre cada tarefa. Nenhuma função deve fazer fallback para `exa_alerts_directors` em notificações por tarefa.

### 1. Corrigir `task-notify-change`
- Remover o merge com `exa_alerts_directors` (linhas 91-115)
- Usar APENAS `task_read_receipts` para determinar destinatários
- Se não houver receipts, não enviar (a tarefa nunca foi notificada antes)

### 2. Corrigir `task-notify-cancelled`
- Remover o merge com `exa_alerts_directors` (linhas 57-81)
- Usar APENAS `task_read_receipts` para determinar destinatários

### 3. Corrigir `task-reminder-scheduler`
- Na função `getRecipients` (linhas 453-468): remover o fallback para `alertContacts`
- Se não há `task_read_receipts` para uma tarefa, não enviar lembrete (significa que ninguém foi notificado sobre ela)

### 4. Corrigir `task-follow-up-cron`
- Na fase de escalação (linhas 213-267): escalar APENAS para contatos que estão em `task_read_receipts` da tarefa, não para todos os directors

### 5. Corrigir `task-follow-up-response`
- Ao confirmar conclusão (linhas 216-233): notificar apenas contatos dos `task_read_receipts`, não todos os directors
- Ao confirmar reagendamento (linhas 277-297): idem
- Ao confirmar cancelamento (linhas 342-358): idem
- Remover a busca de CEO users (linhas 323-339) que recebem cancelamentos indiscriminadamente

### O que NÃO será alterado
- `task-notify-created`: já funciona corretamente com `specific_contacts`
- `task-daily-report`: relatório global com configuração própria
- Tabela `exa_alerts_directors`: permanece intacta, continua útil para relatórios globais e como fonte de contatos no frontend
- UI de criação/edição de tarefas (CreateTaskModal, EditTaskModal): já permite seleção granular de destinatários
- Nenhuma interface existente será modificada

## Arquivos a editar

1. `supabase/functions/task-notify-change/index.ts`
2. `supabase/functions/task-notify-cancelled/index.ts`
3. `supabase/functions/task-reminder-scheduler/index.ts`
4. `supabase/functions/task-follow-up-cron/index.ts`
5. `supabase/functions/task-follow-up-response/index.ts`

