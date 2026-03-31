

# Plano: Notificação de cancelamento ao excluir tarefa

## Problema
Quando uma tarefa é excluída, os participantes configurados não são avisados. O alerta de confirmação atual não menciona que as pessoas serão notificadas.

## Solução

### 1. Nova Edge Function: `supabase/functions/task-notify-cancelled/index.ts`

Cria uma edge function que:
- Recebe `task_id`, `titulo`, `tipo_evento`, `data`, `horario_inicio`, `criador_nome`, `descricao`, `local_evento`, `link_reuniao`
- Busca os contatos que já foram notificados via `task_read_receipts` (status = 'sent') para aquela task
- Se não houver receipts, busca `exa_alerts_directors` ativos como fallback
- Envia mensagem de cancelamento via Z-API para cada contato
- Usa `fmtDateBR` para formatar a data no padrão brasileiro com dia da semana

**Formato da mensagem:**
```
❌ *Compromisso cancelado*

*Título da tarefa*

📅 Segunda-feira, 31/03/2026
🕐 14:00
👤 Cancelado por: Jefferson Silver

📍 Local (se existir)
🔗 Link (se existir)
📝 Descrição (se existir)

Este evento foi cancelado.
```

### 2. Alterar `src/components/admin/agenda/EditTaskModal.tsx`

**Alerta de confirmação (linhas 1684-1703):**
- Alterar o texto da `AlertDialogDescription` para avisar que os participantes serão notificados do cancelamento
- Texto: `Tem certeza que deseja excluir "{task?.titulo}"? Todos os participantes que foram notificados serão avisados sobre o cancelamento. Esta ação não pode ser desfeita.`

**Mutation de delete (linhas 593-610):**
- Antes de deletar a task, buscar os dados necessários da task atual (que já estão em state/props)
- Invocar `task-notify-cancelled` com os dados da tarefa
- Depois deletar a task normalmente
- Mostrar toast de sucesso mencionando notificação

### O que NÃO muda
- Nenhuma outra UI, funcionalidade, calendário ou workflow existente
- Outras edge functions permanecem iguais

