

# Plano: Sistema de Follow-Up e Histórico — Reconstrução Completa

## Ordem de execução

```text
Migration DB → Edge Functions → Frontend
```

---

## 1. Migration (1 SQL)

Adiciona 3 colunas à `task_notification_queue`:

```sql
ALTER TABLE task_notification_queue 
  ADD COLUMN IF NOT EXISTS nova_hora text,
  ADD COLUMN IF NOT EXISTS locked_by text,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz;
```

Nenhuma outra tabela precisa de alteração — `tasks.concluida_por` e `task_status_log` já existem.

---

## 2. Edge Function: `task-follow-up-response/index.ts`

### M-01 — Registro de conclusão, reagendamento e cancelamento no `task_status_log`

Em cada bloco de confirmação "SIM" (`concluir`, `reagendar`, `cancelar`):
- Buscar UUID do respondente via telefone (já existe `creatorUser` — reutilizar)
- **Concluir**: preencher `concluida_por` no update de `tasks` + insert em `task_status_log`
- **Reagendar**: insert em `task_status_log` com motivo incluindo data e hora
- **Cancelar**: insert em `task_status_log` com motivo incluindo justificativa

### M-02 — Horário no reagendamento (3 etapas)

Fluxo expandido quando `pending_action === 'reagendar'`:

1. **Recebe data dd/mm** → salva `nova_data`, muda `pending_action` para `'reagendar_aguardando_horario'`, responde pedindo horário
2. **Novo handler**: se `pending_action === 'reagendar_aguardando_horario'` e input match `/^\d{1,2}:\d{2}$/` → valida 0-23:0-59, salva `nova_hora`, seta `awaiting_confirmation = true`, responde pedindo confirmação com data+hora
3. **Na confirmação "SIM" do reagendar**: além de `data_prevista = nova_data`, atualiza `horario_inicio = nova_hora` e `horario_limite = nova_hora`. Reseta `fired_at = null` em todos os `task_reminders` da tarefa.

### M-03 — Lock de concorrência

No handler de menu (1/2/3), antes de processar:
- Verifica `locked_by` e `locked_at` — se locked por outro telefone há menos de 10 min, responde "⏳ Outra pessoa já está respondendo"
- Caso contrário, aplica lock (`locked_by = phone`, `locked_at = now`)
- Lock é liberado ao `status = 'resolved'`

### M-07 — Logs enriquecidos

Ao enviar follow-up e ao escalar, registrar no `task_status_log` com `status_anterior = status_novo = status atual` e motivo descritivo.

---

## 3. Edge Function: `task-follow-up-cron/index.ts`

### M-04 — Default 30 minutos

Alterar fallback de `minutos_apos: 60` para `minutos_apos: 30` em duas ocorrências (default object e fallback `||`).

Atualizar valor na tabela via insert tool (UPDATE em `exa_alerts_config`).

### M-05 — Template profissional

Substituir `buildFollowUpMessage` por versão com saudação personalizada (`Olá, *nome*!`), texto "encerrada há 30 minutos", e formatação dd/mm/yyyy.

Adicionar helper `formatDate`. Passar `nome` do destinatário ao invocar para criador e para cada responsável na Fase 1.5.

### M-07 (cron) — Log de envio

Após enviar follow-up para criador e após escalar, inserir no `task_status_log`.

---

## 4. Frontend: `EditTaskModal.tsx`

### M-06 — Seção Histórico

Após a seção "Ao Salvar" (linha ~1394) e antes de "Contatos WhatsApp" (linha ~1396):

- Adicionar import de `TaskStatusHistory` e `History` (lucide)
- Inserir Collapsible com header "Histórico" e `<TaskStatusHistory taskId={task.id} />` dentro
- Só renderiza se `task?.id` existe (tarefa já salva)

---

## Arquivos alterados (por ordem de execução)

| # | Tipo | Arquivo/Ação |
|---|------|-------------|
| 1 | Migration | `ALTER TABLE task_notification_queue ADD COLUMN nova_hora, locked_by, locked_at` |
| 2 | Data UPDATE | `exa_alerts_config` → `minutos_apos: 30` |
| 3 | Edge Function | `supabase/functions/task-follow-up-response/index.ts` (M-01, M-02, M-03, M-07) |
| 4 | Edge Function | `supabase/functions/task-follow-up-cron/index.ts` (M-04, M-05, M-07) |
| 5 | Frontend | `src/components/admin/agenda/EditTaskModal.tsx` (M-06) |

Nenhuma lógica de negócio existente é alterada — apenas adições e enriquecimentos.

