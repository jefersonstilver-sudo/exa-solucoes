
# Mensagens WhatsApp Ricas + Confirmacao de Leitura

## Problema Atual

1. A notificacao chega como "Nova tarefa agendada" para TUDO (reunioes, instalacoes, manutencoes, etc.)
2. Faltam detalhes: descricao, observacoes, predio, responsaveis, tipo de evento
3. Nao ha botao de confirmacao (Z-API suporta `send-button-actions`)
4. Nao ha monitoramento de quem viu/confirmou a tarefa

## Solucao

### 1. Mensagem rica e contextual (Edge Function `task-notify-created`)

O frontend passa dados adicionais: `tipo_evento`, `descricao`, `local_evento`, `building_name`, `responsaveis_nomes`, `subtipo_reuniao`. A edge function monta a mensagem baseada no tipo:

```text
-- Para Reuniao:
🤝 *Nova Reunião agendada*

*Reunião com cliente X*
📅 Data: 24/02/2026 às 10:00
📍 Local: Sala de reuniões
👤 Criado por: Jeferson Encina
👥 Responsáveis: Maria, João
📝 Descrição: Discutir proposta comercial

-- Para Instalação/Manutenção:
🔧 *Nova Manutenção agendada*

*Troca do motor elevador*
📅 Data: 25/02/2026 às 14:00
🏢 Prédio: Edifício Aurora
👤 Criado por: Jeferson
📝 Descrição: Motor principal apresentando ruído

-- Para Tarefa genérica:
📋 *Nova Tarefa agendada*
(formato atual, mais completo)

-- Para Aviso:
⚠️ *Novo Aviso*
```

Cada tipo de evento (`reuniao`, `tarefa`, `instalacao`, `manutencao`, `aviso`, etc.) tera um emoji e label diferente, resolvidos a partir do campo `tipo_evento` ou da tabela `event_types`.

### 2. Botao de confirmacao via Z-API (`send-button-actions`)

Junto com a mensagem, a edge function envia um botao interativo usando o endpoint `send-button-actions` do Z-API (ja usado no projeto em `monitor-panels` e `notify-escalation`):

```text
[mensagem rica acima]

---
footer: "Confirme o recebimento"
botoes:
  ✅ Confirmar recebimento  (id: "task_ack:{task_id}:{contact_phone}")
```

Quando o contato clica, o webhook recebe o `buttonId` e registra a confirmacao.

### 3. Nova tabela: `task_read_receipts`

Rastreia quem recebeu e quem confirmou:

- `id` (uuid PK)
- `task_id` (uuid FK tasks)
- `contact_phone` (text)
- `contact_name` (text)
- `sent_at` (timestamptz) -- quando a mensagem foi enviada
- `delivered_at` (timestamptz, nullable) -- se o Z-API confirma delivery
- `read_at` (timestamptz, nullable) -- quando o contato clicou "Confirmar"
- `status` (text): `sent`, `delivered`, `read`

### 4. Handler no webhook para confirmacao

No `zapi-webhook`, ao receber um clique de botao com ID prefixado por `task_ack:`, atualizar o registro em `task_read_receipts` com `read_at = now()` e `status = 'read'`. Enviar resposta automatica: "Recebimento confirmado. Obrigado!"

### 5. Modal de monitoramento no frontend

Dentro do drawer de detalhes da tarefa (`TaskDetailDrawer`), adicionar uma nova secao **"Notificacoes"** que exibe:

- Lista de contatos notificados com status visual:
  - Icone cinza: Enviado (aguardando)
  - Icone azul: Entregue
  - Icone verde com check: Confirmado + horario
- Contagem: "2 de 3 confirmaram"

Componente: `TaskNotificationStatus.tsx`

## Arquivos

**Editados (3)**:
- `supabase/functions/task-notify-created/index.ts` -- mensagem rica + envio com botao + registro em `task_read_receipts`
- `supabase/functions/zapi-webhook/index.ts` -- handler para `task_ack:` button clicks
- `src/components/admin/agenda/CreateTaskModal.tsx` -- passar dados extras (tipo_evento, descricao, building, responsaveis) ao invocar a function

**Novos (1)**:
- `src/pages/admin/tarefas/components/TaskNotificationStatus.tsx` -- componente de monitoramento de leitura

**Editados para integrar o monitor (1)**:
- `src/pages/admin/tarefas/components/TaskDetailDrawer.tsx` -- adicionar secao de notificacoes

**Migracao (1)**:
- Nova tabela `task_read_receipts`

**NAO alterados**:
- Nenhum outro componente de UI, filtro ou funcionalidade existente
