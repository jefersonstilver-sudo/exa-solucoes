
# Correcao do Sistema de Notificacoes WhatsApp para Tarefas

## Diagnostico dos Problemas

Analisei os logs do webhook, o codigo fonte e as screenshots. Encontrei **4 problemas raiz** que quebram todo o fluxo:

### Problema 1: task_id = 'batch' quebra a confirmacao
Quando uma tarefa e criada no `CreateTaskModal`, o notify e chamado com `task_id: 'batch'` (linha 445). Porem:
- O receipt e salvo com `task_id: null` (porque o codigo faz `task_id === 'batch' ? null : task_id`)
- O botao de confirmacao gera buttonId = `task_ack:batch:phone`
- Quando o usuario clica, o webhook tenta buscar `tasks` com id = 'batch' -- nao encontra nada
- O update no `task_read_receipts` com `.eq('task_id', 'batch')` tambem falha -- pois foi salvo como `null`
- Resultado: **confirmacao nunca funciona**, comprovante mostra tudo como N/A

**Evidencia nos logs:** `buttonId: "task_ack:batch:5545998090000"` -- exatamente o bug.

### Problema 2: EVENT_TYPE_MAP hardcoded nao reconhece tipos personalizados
O mapa de tipos (linha 10-19 do edge function) so tem 8 tipos fixos. Tipos criados pelo usuario como "Apresentacao EXA" nao sao reconhecidos e caem no fallback `tarefa`, gerando mensagem com emoji e label errados.

### Problema 3: Template com erro gramatical
A mensagem diz "Nova Compromisso agendada" -- o correto seria "Novo Compromisso agendado". A logica de genero (linha 36) so trata `aviso` como masculino, mas `compromisso` tambem e masculino.

### Problema 4: Notificacao disparada antes de ter os task_ids reais
O notify e chamado no `onSuccess` do mutation, mas os IDs das tarefas criadas nao sao passados -- ficam perdidos dentro do `mutationFn`.

---

## Plano de Correcao

### Arquivo 1: `src/components/admin/agenda/CreateTaskModal.tsx`
- Coletar os IDs reais das tarefas criadas dentro do `mutationFn` e retorna-los
- No `onSuccess`, usar `data` (retorno do mutation) para enviar notificacoes com o ID real de cada tarefa
- Para multiplas datas: enviar uma notificacao por tarefa com seu ID real, ou usar o ID da primeira tarefa

### Arquivo 2: `supabase/functions/task-notify-created/index.ts`
- Remover o `EVENT_TYPE_MAP` hardcoded
- Buscar o tipo de evento no banco (`event_types` table) usando o campo `tipo_evento` recebido
- Fallback para emoji/label padrao se nao encontrar
- Corrigir logica de genero: palavras masculinas (compromisso, aviso) usam "Novo/agendado", femininas usam "Nova/agendada"
- Corrigir o insert de receipt: nunca salvar `task_id` como null quando um ID real foi fornecido

### Arquivo 3: `supabase/functions/zapi-webhook/index.ts` (trecho task_ack)
- Adicionar fallback: se `taskId === 'batch'` ou task nao encontrada, buscar receipt mais recente pelo phone (mesma logica que ja existe no bloco text-based ack)
- Garantir que o comprovante sempre tenha os dados reais da tarefa
- Unificar a logica de confirmacao (atualmente duplicada em 3 lugares: fromMe intercept, text-based ack, e button-based ack)

### Arquivo 4: `src/components/admin/agenda/EditTaskModal.tsx`
- Garantir que o `tipo_evento` enviado ao notify use o valor do banco (nao o slug hardcoded)
- Pequeno ajuste para incluir `responsaveis_nomes` no payload (ja esta no CreateTaskModal mas falta no EditTaskModal)

---

## Detalhes Tecnicos

### CreateTaskModal - Retornar IDs reais
```text
mutationFn: async () => {
  const createdIds: string[] = [];
  for (const data of datasPrevistas) {
    const { data: taskData } = await supabase.from('tasks').insert({...}).select('id').single();
    createdIds.push(taskData.id);
  }
  return createdIds;  // <-- retornar
},
onSuccess: (createdIds) => {
  // Notificar com o ID real (primeiro ou todos)
  supabase.functions.invoke('task-notify-created', {
    body: { task_id: createdIds[0], ... }  // ID real, nao 'batch'
  });
}
```

### task-notify-created - Resolver tipo dinamicamente
```text
// Buscar event_type do banco
const { data: eventType } = await supabase
  .from('event_types')
  .select('label, icon, color')
  .eq('value', tipo_evento)
  .maybeSingle();

// Usar dados do banco ou fallback
const emoji = eventType?.icon || '📋';
const label = eventType?.label || 'Tarefa';
```

### Genero correto no template
```text
// Palavras masculinas
const masculinos = ['compromisso', 'aviso', 'lembrete'];
const isMasc = masculinos.includes(tipo);
message = `${emoji} *Nov${isMasc ? 'o' : 'a'} ${label} agendad${isMasc ? 'o' : 'a'}*`;
```

### Webhook - Fallback para batch
```text
if (taskId === 'batch' || !taskId) {
  // Buscar receipt mais recente pelo telefone
  const { data: receipt } = await supabase
    .from('task_read_receipts')
    .select('id, task_id')
    .eq('contact_phone', contactPhone)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  // Usar o task_id real do receipt
}
```

## Impacto
- Nenhuma interface alterada (apenas dados enviados nos payloads)
- Nenhum workflow existente quebrado
- Edge functions precisam ser redeployadas apos as alteracoes
- Corrige: confirmacao de recebimento, comprovante de ciencia, template de notificacao, genero gramatical
