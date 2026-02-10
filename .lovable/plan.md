

# Mostrar Tipo de Evento + Responsaveis no Calendario e Atualizar em Tempo Real

## Problema

1. No calendario (compact TaskCard), so aparece o titulo e horario. Nao mostra **qual o tipo** (Tarefa, Reuniao, Compromisso, Aviso) nem **para quem** e atribuido.
2. O usuario quer que ao criar uma tarefa, ela apareca imediatamente tanto no calendario quanto nas listas de tarefas.

## Diagnostico

### Tipo de evento no compact card
O `TaskCard` em modo `compact` (usado no calendario) ja exibe o icone do tipo de evento, mas **nao exibe o label** ("Reuniao", "Compromisso", etc.) nem os responsaveis. Linhas 129-147 do `TaskCard.tsx`.

### Responsaveis nao carregados
A query da Agenda (`AgendaPage.tsx` linha 79-82) busca campos diretos da tabela `tasks` mas **nao faz join** com `task_responsaveis` e `users`. O tipo `AgendaTask` tambem nao tem campo de responsaveis.

### Tempo real
O `invalidateQueries` para `agenda-tasks`, `minha-manha-tasks` e `central-tarefas` ja existe no `CreateTaskModal.tsx`. A atualizacao ja deveria funcionar apos criacao. Se nao esta aparecendo, pode ser por causa do `pollingCoordinator` com throttle de 30 segundos.

## O que sera feito

### 1. Expandir o tipo `AgendaTask` (TaskCard.tsx)
Adicionar campo opcional `responsaveis` ao tipo:
```typescript
responsaveis?: { user_id: string; user_nome: string }[];
todos_responsaveis?: boolean;
```

### 2. Atualizar a query da Agenda (AgendaPage.tsx)
Incluir o join com `task_responsaveis` e `users`:
```typescript
.select('id, titulo, ..., task_responsaveis(user_id, users:user_id(nome))')
```

### 3. Melhorar o compact TaskCard (TaskCard.tsx)
Alterar o modo `compact` (linhas 129-147) para mostrar:
- Icone do tipo + **label abreviado** (ex: "Reuniao", "Tarefa")
- Nome do responsavel (primeiro nome, truncado)
- Manter horario

Layout proposto:
```
[icone] Reuniao de fechamento
Joao | 18:00
```

### 4. Garantir refresh imediato
O `invalidateQueries` ja esta implementado corretamente. Verificar se nao ha cache bloqueando. Se necessario, adicionar `refetchType: 'all'` nas invalidacoes.

## Arquivos modificados

1. **`src/components/admin/agenda/TaskCard.tsx`** - Expandir tipo AgendaTask, melhorar compact card
2. **`src/pages/admin/AgendaPage.tsx`** - Expandir query para incluir responsaveis

Nenhum outro arquivo sera alterado.

