
# Confirmacao de Reagendamento com Notificacao + Mobile iPhone-First

## Visao Geral

Tres grandes mudancas:

1. **Modal de confirmacao ao arrastar tarefa** no calendario mensal - substituir o `ScheduleTimeModal` atual por um modal minimalista moderno que informa que os contatos serao notificados da alteracao de data
2. **Edge Function `task-notify-change`** para enviar notificacoes WhatsApp sobre alteracoes de data/horario
3. **Responsividade iPhone-first** em todo o modulo de Central de Tarefas e Agenda

---

## 1. Novo Modal de Confirmacao de Reagendamento

Substituir o `ScheduleTimeModal` (que pede tipo de horario e hora) por um modal em 2 etapas:

**Etapa 1 - Confirmacao**: Modal minimalista Apple-like mostrando:
- Nome da tarefa
- Data anterior vs Data nova (visual lado a lado com seta)
- Checkbox "Manter horario atual" (pre-marcado se a tarefa ja tem horario)
- Campo de hora (so aparece se desmarcou o checkbox)
- Aviso discreto: "Os contatos notificados serao informados da alteracao"
- Botoes: "Cancelar" e "Confirmar Reagendamento"

**Etapa 2 - Execucao**: Ao confirmar, salva no banco e chama `task-notify-change`

### Arquivo: `src/components/admin/agenda/ScheduleTimeModal.tsx`
- Refatorar completamente o modal
- Adicionar props: `taskName` (ja existe), `targetDate` (ja existe), `originalDate` (novo), `taskId` (novo)
- Apos confirmar, alem do callback `onConfirm`, disparar automaticamente a edge function de notificacao

### Arquivo: `src/pages/admin/tarefas/components/AgendaMonthView.tsx`
- Passar `originalDate` (data anterior da tarefa) ao `ScheduleTimeModal`
- Passar `taskId` para a notificacao
- Apos sucesso do mutation, chamar `task-notify-change`

---

## 2. Edge Function: `task-notify-change`

### Arquivo: `supabase/functions/task-notify-change/index.ts`

Reutiliza a mesma infraestrutura do `task-notify-created`:
- Recebe: `task_id`, `titulo`, `tipo_evento`, `changes` (com `data_anterior`, `data_nova`, `horario_inicio_anterior`, `horario_inicio_novo`, `horario_limite_anterior`, `horario_limite_novo`), `criador_nome`
- Busca contatos ja notificados em `task_read_receipts` pelo `task_id`
- Se nenhum contato foi notificado anteriormente, busca os `exa_alerts_directors` ativos (fallback)
- Resolve emoji/label do tipo de evento via `event_types`
- Monta mensagem rica:

```text
🔄 *Reuniao reagendada*

*Titulo da Tarefa*

📅 Data: 25/02/2026 → 28/02/2026
🕐 Horario: 14:00 → 16:30

👤 Alterado por: Nome do Usuario

⚠️ Por favor, atualize sua agenda.
```

- Envia via Z-API (mesmo padrao do `task-notify-created`)
- Registra log em `agent_logs` com `event_type: 'task_change_notified'`

---

## 3. Notificacao automatica no EditTaskModal

### Arquivo: `src/components/admin/agenda/EditTaskModal.tsx`

- Adicionar `useRef` para armazenar valores originais (`data_prevista`, `horario_inicio`, `horario_limite`) quando a tarefa carrega
- No `onSuccess` do `updateMutation`, comparar valores originais vs novos
- Se houve mudanca em data ou horario, chamar `task-notify-change` automaticamente
- Mostrar toast informando: "Contatos notificados sobre a alteracao"

---

## 4. Responsividade iPhone-First (Google Calendar Style)

### Principios:
- Todas as views (Dia, Semana, Mes) funcionais em tela de 375px
- Touch targets minimos de 44px
- Gestos de swipe para navegar entre dias/semanas/meses
- FAB para criacao rapida
- Modais como Drawer/bottom-sheet no mobile

### Arquivos a modificar:

**`src/pages/admin/tarefas/components/AgendaDayView.tsx`**
- Hour label: `w-12` no mobile (vs `w-20` desktop)
- Slot height reduzido no mobile
- TaskCard com fonte menor e padding compacto
- Scroll suave com `-webkit-overflow-scrolling: touch`

**`src/pages/admin/tarefas/components/AgendaWeekView.tsx`**
- No mobile: mostrar apenas 3 dias (ontem/hoje/amanha) com scroll horizontal para os demais
- Ou: manter 7 colunas mas com scroll horizontal e `snap-x`
- Header dias: abreviacoes curtas (S T Q Q S S D)
- Celulas com height reduzido
- Tarefas: apenas emoji + titulo truncado (sem horario inline)

**`src/pages/admin/tarefas/components/AgendaMonthView.tsx`**
- Grid compacto: celulas menores com `min-h-[80px]`
- Mostrar max 2 tarefas por celula no mobile (vs 3 desktop)
- Drag-and-drop: funcional em touch via `@dnd-kit` (ja suporta touch nativamente)
- Nome do dia: apenas letra inicial (D S T Q Q S S)

**`src/components/admin/agenda/DroppableCalendarDay.tsx`**
- Celula menor no mobile
- Fonte do dia: `text-[10px]`
- TaskCard compact com padding minimo

**`src/pages/admin/tarefas/components/EmbeddedAgenda.tsx`**
- Header: stack vertical no mobile (titulo em cima, tabs + nav embaixo)
- Tabs: ocupar largura total no mobile
- Nav buttons: tamanho touch-friendly

**`src/pages/admin/tarefas/CentralTarefasPage.tsx`**
- Stats bar: scroll horizontal no mobile
- Task cards: 1 coluna no mobile (ja esta `grid-cols-1 md:grid-cols-2`)
- Agenda: padding reduzido

**`src/pages/admin/tarefas/FullscreenAgendaPage.tsx`**
- Header: compacto no mobile (icones sem texto)
- Tab triggers: apenas icones no mobile (ja implementado com `hidden md:inline`)
- FAB: posicao respeitando safe-area-bottom

**`src/components/admin/agenda/ScheduleTimeModal.tsx`**
- No mobile: usar `Drawer` (bottom-sheet) em vez de `Dialog`
- Inputs touch-friendly (h-12)

**`src/components/admin/agenda/EditTaskModal.tsx`**
- Ja usa Drawer no mobile (verificar se esta implementado)
- Garantir que campos sao touch-friendly
- Scroll interno suave

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/task-notify-change/index.ts` | Edge function para notificacao de alteracao |

## Arquivos a Modificar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/admin/agenda/ScheduleTimeModal.tsx` | Refatorar para modal de confirmacao com notificacao |
| `src/pages/admin/tarefas/components/AgendaMonthView.tsx` | Passar dados originais ao modal + responsividade |
| `src/pages/admin/tarefas/components/AgendaDayView.tsx` | Responsividade iPhone |
| `src/pages/admin/tarefas/components/AgendaWeekView.tsx` | Responsividade iPhone (scroll horizontal) |
| `src/pages/admin/tarefas/components/EmbeddedAgenda.tsx` | Layout mobile-first |
| `src/components/admin/agenda/DroppableCalendarDay.tsx` | Celulas compactas no mobile |
| `src/pages/admin/tarefas/CentralTarefasPage.tsx` | Ajustes mobile menores |
| `src/pages/admin/tarefas/FullscreenAgendaPage.tsx` | Safe areas e touch |
| `src/components/admin/agenda/EditTaskModal.tsx` | Deteccao automatica de mudanca + notificacao |

## O que NAO muda

- Nenhuma outra pagina, componente ou modal fora do modulo de tarefas
- Sidebar, rotas e permissoes permanecem iguais
- Design system global permanece igual
- Flow de criacao de tarefas permanece igual
- Tabelas do banco de dados permanecem iguais (nao precisa de migration)
