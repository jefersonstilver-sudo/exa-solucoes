
# Notificacoes WhatsApp Inteligentes para Tarefas

## Resumo

Adicionar ao EditTaskModal (e ao fluxo de criacao de tarefas) um sistema completo de notificacoes via WhatsApp (EXA Alerts) com:
- Envio de aviso quando uma tarefa/reuniao e criada
- Follow-up automatico 1h apos o horario do compromisso com 3 opcoes: Concluir, Reagendar, Cancelar
- Escalacao automatica para outros contatos se o criador nao responder em 30 minutos
- Confirmacao dupla para todas as acoes
- Log completo de quem fez o que

## Arquitetura do Fluxo

```text
CRIACAO/EDICAO DA TAREFA
        |
        v
[Salvar] --> Envia WhatsApp para todos os contatos ativos
             "Nova reuniao agendada: [titulo] em [data] as [hora]"
        |
        v
[CRON a cada 5min] --> Verifica tarefas com horario <= agora - 1h
        |
        v
Envia para CRIADOR da tarefa:
  "A tarefa [titulo] foi concluida?"
  [1] Concluir  [2] Reagendar  [3] Cancelar
        |
        v
Criador responde "1" --> "Tem certeza? Responda SIM"
                   --> Confirma --> Marca como concluida + log
        |
Criador responde "2" --> "Qual a nova data? (dd/mm)"
                   --> Informa data --> "Confirma reagendar para [data]? SIM/NAO"
                   --> Confirma --> Reagenda + notifica todos
        |
Criador responde "3" --> "Qual a justificativa?"
                   --> Informa --> "Confirma cancelar? Justificativa sera enviada ao gestor. SIM/NAO"
                   --> Confirma --> Cancela + envia justificativa ao gestor
        |
        v
[30min sem resposta do criador]
        |
        v
Envia MESMO MENU para os demais contatos registrados
```

## Alteracoes Detalhadas

### 1. Nova Tabela: `task_notification_queue`

Rastreia o estado de cada notificacao de follow-up:

- `id` (uuid, PK)
- `task_id` (uuid, FK para tasks)
- `criado_por` (uuid, quem criou a tarefa)
- `status` (text): `pending`, `sent_to_creator`, `escalated`, `resolved`
- `action` (text, nullable): `concluir`, `reagendar`, `cancelar`
- `resposta_de` (text, nullable): telefone de quem respondeu
- `justificativa` (text, nullable): para cancelamentos
- `nova_data` (date, nullable): para reagendamentos
- `awaiting_confirmation` (boolean, default false): aguardando "SIM"
- `pending_action` (text, nullable): acao pendente de confirmacao
- `sent_at` (timestamptz): quando foi enviado ao criador
- `escalated_at` (timestamptz, nullable): quando foi escalado
- `resolved_at` (timestamptz, nullable): quando foi resolvido
- `created_at` (timestamptz, default now())

### 2. Nova Edge Function: `task-notify-created`

Chamada quando uma tarefa e salva (criacao ou edicao com mudanca de data):
- Recebe: task_id, titulo, data, horario, criador_nome
- Busca todos os contatos ativos em `exa_alerts_directors`
- Envia mensagem via `zapi-send-message` (agentKey: `exa_alert`):
  ```
  Ola [nome],
  
  Nova tarefa agendada:
  [titulo]
  Data: [data] as [horario]
  Criado por: [criador]
  
  Voce sera notificado sobre o status.
  ```

### 3. Nova Edge Function: `task-follow-up-cron`

Executada via CRON a cada 5 minutos:

**Fase 1 - Enviar para criador (1h apos horario)**:
- Busca tarefas com `status = pendente` ou `em_andamento`
- Onde `data_prevista + horario_limite <= agora - 1h`
- Que NAO tem registro em `task_notification_queue` com status != `pending`
- Busca telefone do criador na tabela `users`
- Envia mensagem:
  ```
  A tarefa "[titulo]" agendada para [data] as [hora] foi concluida?
  
  Responda:
  1 - Concluir tarefa
  2 - Reagendar
  3 - Cancelar compromisso
  ```
- Cria registro em `task_notification_queue` com status `sent_to_creator`

**Fase 2 - Escalar (30min sem resposta)**:
- Busca registros em `task_notification_queue` com status `sent_to_creator`
- Onde `sent_at <= agora - 30min`
- Busca todos os contatos ativos em `exa_alerts_directors` (exceto o criador)
- Envia a mesma mensagem para cada um
- Atualiza status para `escalated`

### 4. Logica de Resposta no `zapi-webhook`

Adicionar handler no webhook existente para detectar respostas ao follow-up:
- Quando recebe "1", "2" ou "3" de um telefone com `task_notification_queue` ativa:
  - **"1" (Concluir)**: Responde "Tem certeza que a tarefa [titulo] foi concluida? Responda SIM para confirmar."
    - Marca `awaiting_confirmation = true`, `pending_action = concluir`
  - **"2" (Reagendar)**: Responde "Para qual data deseja reagendar? (formato: dd/mm)"
    - Marca `pending_action = reagendar`
  - **"3" (Cancelar)**: Responde "Qual a justificativa do cancelamento? (A justificativa sera enviada ao gestor)"
    - Marca `pending_action = cancelar`

- Quando recebe "SIM" com `awaiting_confirmation = true`:
  - Se `pending_action = concluir`: Atualiza task para `concluida`, registra log, notifica todos
  - Se `pending_action = reagendar`: Atualiza task com nova data, notifica todos
  - Se `pending_action = cancelar`: Atualiza task para `cancelada`, envia justificativa ao gestor (CEO)

- Quando recebe data (dd/mm) com `pending_action = reagendar`:
  - Salva `nova_data`, responde "Confirma reagendar [titulo] para [nova_data]? Responda SIM."
  - Marca `awaiting_confirmation = true`

- Quando recebe texto com `pending_action = cancelar`:
  - Salva `justificativa`, responde "Confirma cancelar [titulo]? A justificativa sera enviada ao gestor. Responda SIM."
  - Marca `awaiting_confirmation = true`

### 5. UI no EditTaskModal

Adicionar secao de notificacoes no modal:
- Botao "Contatos de Alerta" que abre o `ManageAlertContactsModal` existente
- Toggle "Notificar contatos ao salvar" (default: true para novos eventos, false para edicoes)
- Toggle "Follow-up automatico (1h apos)" (default: true)
- Ao salvar com notificacao ativa, chama `task-notify-created`

### 6. Log e Auditoria

Todas as acoes (concluir, reagendar, cancelar via WhatsApp) sao registradas em:
- `task_status_log` (trigger existente ja captura mudancas de status)
- `task_notification_queue` (quem respondeu, quando, qual acao)
- `agent_logs` (log do EXA Alert)

## Arquivos

**Novos (3)**:
- `supabase/functions/task-notify-created/index.ts` -- envia notificacao de criacao
- `supabase/functions/task-follow-up-cron/index.ts` -- CRON de follow-up + escalacao
- `supabase/functions/task-follow-up-response/index.ts` -- processa respostas do WhatsApp

**Editados (2)**:
- `src/components/admin/agenda/EditTaskModal.tsx` -- secao de notificacoes + chamar notify ao salvar
- `supabase/functions/zapi-webhook/index.ts` -- rotear respostas de follow-up para a nova function

**Migracao (1)**:
- Nova tabela `task_notification_queue` com indices e RLS

**NAO alterados**:
- ManageAlertContactsModal (ja existe e funciona)
- zapi-send-message (usado como esta)
- Nenhum outro componente de UI
