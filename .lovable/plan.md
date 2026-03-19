

# Plano: 4 Grupos de Correção — Agenda & Notificações

Execução sequencial: cada grupo aguarda confirmação antes do próximo.

---

## GRUPO 1 — BUG CRÍTICO: task-reminder-scheduler ignora task_reminders

**Problema**: A Edge Function usa apenas `exa_alerts_config.agenda_lembrete_pre_evento` (valor global fixo). A tabela `task_reminders` criada recentemente é ignorada.

**Alterações**:

### 1a. Migration — campo `fired_at` na tabela `task_reminders`
```sql
ALTER TABLE task_reminders ADD COLUMN IF NOT EXISTS fired_at timestamptz;
```

### 1b. Reescrever `supabase/functions/task-reminder-scheduler/index.ts`

Nova lógica:
1. Buscar tarefas do dia com `status IN ('pendente', 'em_andamento')` e `horario_inicio NOT NULL`
2. Para cada tarefa, buscar seus `task_reminders` onde `ativo = true` e `fired_at IS NULL`
3. Converter cada lembrete em minutos totais (valor * unidade): minutos=1, horas=60, dias=1440, semanas=10080
4. Comparar: se `taskTotalMinutes - currentTotalMinutes == lembreteMinutos`, disparar
5. Após disparo, atualizar `fired_at = NOW()` no registro
6. **Fallback**: tarefas SEM registros em `task_reminders` usam o valor global `minutos_antes` da `exa_alerts_config` (comportamento atual preservado)
7. Destinatários: mesma lógica atual (task_read_receipts → alertContacts fallback)
8. Log em `task_alert_logs` com `alert_type = 'lembrete_custom_{valor}{unidade}'`

**Arquivos**: 1 migration + 1 Edge Function reescrita

---

## GRUPO 2 — NOVA FEATURE: follow-up para responsáveis

**Problema**: `task-follow-up-cron` envia só para o criador (Fase 1) e escala para diretores (Fase 2). Não notifica os responsáveis vinculados em `task_responsaveis`.

**Alterações em `supabase/functions/task-follow-up-cron/index.ts`**:

Inserir **Fase 1.5** entre a atual Fase 1 e Fase 2:

1. Após enviar para o criador, buscar `task_responsaveis` para a tarefa
2. Para cada responsável, buscar telefone na tabela `users`
3. Excluir o criador da lista (se já recebeu na Fase 1)
4. Enviar mensagem: "A tarefa '[título]' estava prevista para [horário]. Foi concluída? Responda 1 para Sim ou 2 para Não."
5. Atualizar `task_notification_queue` com status `sent_to_responsaveis`

Ajuste na Fase 2 (escalação): verificar `sent_to_responsaveis` além de `sent_to_creator` para o timeout de 30min.

Ajuste no `zapi-webhook` (se responder "2"):
- Atualizar status da tarefa para `atrasada` (ou manter `pendente` com flag)
- Notificar o criador: "O responsável [nome] informou que a tarefa '[título]' NÃO foi concluída."

**Arquivos**: 1 Edge Function editada + 1 Edge Function editada (zapi-webhook, trecho de resposta "2")

---

## GRUPO 3 — REDESIGN do EditTaskModal.tsx

### G3-01: Header sticky
- Extrair o bloco do header (emoji + tipo + título + badges) para fora do `overflow-y-auto`
- Aplicar `sticky top-0 bg-background z-10 pb-3 border-b`

### G3-02: Texto cortado no TaskRemindersPanel
- No `TaskRemindersPanel.tsx`, trocar labels longas ("minutos antes") por abreviações: `min`, `h`, `dias`, `sem`
- Ajustar o `SelectTrigger` de unidade para `w-[80px]` fixo em vez de `flex-1 min-w-[100px]`
- Ajustar o `SelectTrigger` de tipo para `w-[100px]`

### G3-03: Sidebar com seções colapsáveis
- Envolver "Monitor de Confirmações" (linhas 1117-1375) em `Collapsible` — fechado por padrão
  - Header: `Confirmações ({confirmedCount}/{totalReceipts})`
- Envolver "Contatos WhatsApp" (linhas 1401-1563) em `Collapsible` — fechado por padrão
  - Header: `Contatos ({selectedNotifyContacts.length})`
- "Lembretes" e "Ao salvar" permanecem sempre visíveis

### G3-04: Mobile → bottom Drawer
- Importar `Drawer` de vaul e `useAdvancedResponsive`
- No render, se `isMobile`: renderizar `<Drawer>` com `<DrawerContent className="max-h-[92dvh]">` e handle de arrasto
- Se desktop: manter `<Dialog>` atual
- O conteúdo interno (form + sidebar) é o mesmo, apenas o wrapper muda
- Em mobile o grid vira `grid-cols-1` (já faz isso pelo `md:grid-cols-[1fr_400px]`)

**Arquivos**: `EditTaskModal.tsx` + `TaskRemindersPanel.tsx`

---

## GRUPO 4 — NotificationsPage mobile

**Problema**: Página desktop-only sem otimização mobile.

**Alterações em `src/pages/admin/NotificationsPage.tsx`**:

1. **Header responsivo**: Em mobile, título menor (`text-xl`), badge de não-lidas inline, botão "Marcar todas" como ícone-only
2. **Cards mobile**: Cada notificação vira um card compacto com:
   - Ícone de tipo (esquerda) + título + tempo relativo ("há 5 min")
   - Mensagem truncada (`line-clamp-2`)
   - Botão check à direita para marcar como lida
3. **Empty state**: Ilustração com ícone `Bell` grande + texto orientativo
4. **Filtros mobile**: Chips horizontais scrolláveis em vez de dropdown
5. Usar `useAdvancedResponsive().isMobile` para alternar layouts

**Arquivos**: `NotificationsPage.tsx`

---

## Resumo de execução

| Grupo | Arquivos | Tipo |
|-------|----------|------|
| G1 | 1 migration + `task-reminder-scheduler/index.ts` | Bug fix + migration |
| G2 | `task-follow-up-cron/index.ts` + `zapi-webhook/index.ts` | Feature |
| G3 | `EditTaskModal.tsx` + `TaskRemindersPanel.tsx` | Redesign UI |
| G4 | `NotificationsPage.tsx` | Redesign UI |

Cada grupo será implementado e apresentado separadamente, aguardando confirmação antes de avançar.

