

# Plano: Corrigir lógica de destinatários nas notificações de alteração e cancelamento

## Problema
Quando uma tarefa é reagendada ou cancelada, a notificação só vai para os contatos que já tinham `task_read_receipts`. Se poucos foram notificados originalmente, o resto (incluindo o criador e responsáveis) não recebe aviso. O fallback para `exa_alerts_directors` só ativa quando NÃO há nenhum receipt — deveria ser complementar, não exclusivo.

## Solução

Alterar a lógica de destinatários em **2 edge functions** para combinar receipts + exa_alerts_directors (sem duplicatas):

### 1. `supabase/functions/task-notify-change/index.ts`

**Linhas 86-110** — Alterar a lógica de contatos:
- Buscar `task_read_receipts` (quem já foi notificado)
- **TAMBÉM** buscar `exa_alerts_directors` ativos
- Fazer merge das duas listas, deduplicando por telefone
- Resultado: todos os contatos relevantes recebem a notificação de alteração

```text
Antes:  receipts OU fallback(directors)
Depois: receipts + directors (merge, sem duplicatas)
```

### 2. `supabase/functions/task-notify-cancelled/index.ts`

Mesma alteração — combinar receipts + directors sem duplicatas.

### O que NÃO muda
- Formato da mensagem (já corrigido com data BR e dia da semana)
- UI, modal, calendário, workflows existentes
- Outras edge functions

