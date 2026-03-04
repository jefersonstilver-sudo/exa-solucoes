

# Plano: Painel de Configurações de Notificações da Agenda (Engrenagem Super Admin)

## Contexto

O sistema de notificações da agenda hoje tem lógica hardcoded nas Edge Functions (horários fixos, intervalos fixos). O usuário quer que TUDO seja configurável via UI, com um botão de engrenagem minimalista e luxuoso na Central de Tarefas, acessível apenas ao super_admin.

As configurações serão salvas na tabela `exa_alerts_config` (já existente, key-value com JSON).

---

## O que será criado

### 1. Botão Engrenagem na Central de Tarefas

**Arquivo**: `src/pages/admin/tarefas/CentralTarefasPage.tsx`

Adicionar um ícone `Settings` (engrenagem) minimalista ao lado dos botões "Atualizar" e "Tela Cheia" no header, visível apenas para `super_admin`. Ao clicar, abre o modal de configurações.

### 2. Modal de Configurações de Notificações da Agenda

**Novo arquivo**: `src/pages/admin/tarefas/components/AgendaNotificationSettingsModal.tsx`

Dialog premium (padrão Apple/glass do projeto) com as seguintes seções em accordion:

**Seção 1: Relatório Diário Noturno (19h)**
- Switch: Ativar/desativar
- Input: Horário de envio (default: 19:00)
- Descrição: "Resume os eventos registrados no dia e pendentes não concluídos"

**Seção 2: Relatório Matinal (08h)**
- Switch: Ativar/desativar
- Input: Horário de envio (default: 08:00)
- Descrição: "Envia pendentes do dia anterior + agenda do dia atual"

**Seção 3: Lembrete Antes do Evento**
- Switch: Ativar/desativar
- Input: Minutos antes (default: 60)
- Descrição: "Envia lembrete WhatsApp X minutos antes de cada evento"

**Seção 4: Follow-up Pós-Evento**
- Switch: Ativar/desativar
- Input: Minutos após (default: 60)
- Descrição: "Cobra conclusão/reagendamento X minutos após horário do evento"

**Seção 5: Destinatários Padrão**
- Lista dos contatos ativos em `exa_alerts_directors`
- Link para gerenciar contatos (abre ManageAlertContactsModal)
- Descrição: "Pessoas que recebem os relatórios diários automaticamente"

Cada seção terá:
- Título com ícone
- Descrição explicativa clara
- Controles inline (switch + input)
- Visual glassmorphism/backdrop-blur alinhado ao design system EXA Premium

### 3. Hook de Configurações da Agenda

**Novo arquivo**: `src/hooks/tarefas/useAgendaNotificationSettings.ts`

- Lê/escreve na tabela `exa_alerts_config` usando keys:
  - `agenda_relatorio_noturno` → `{ ativo: bool, horario: "19:00" }`
  - `agenda_relatorio_matinal` → `{ ativo: bool, horario: "08:00" }`
  - `agenda_lembrete_pre_evento` → `{ ativo: bool, minutos_antes: 60 }`
  - `agenda_followup_pos_evento` → `{ ativo: bool, minutos_apos: 60 }`
- React Query para cache e invalidação
- Função `saveConfig(key, value)` com toast de sucesso/erro

### 4. Atualizar Edge Functions para ler configs

**Arquivos**: 
- `supabase/functions/task-reminder-scheduler/index.ts` — Ler `agenda_lembrete_pre_evento` da `exa_alerts_config` para saber quantos minutos antes enviar. **Corrigir** para usar tabela `tasks` em vez de `notion_tasks`.
- `supabase/functions/task-follow-up-cron/index.ts` — Ler `agenda_followup_pos_evento` para ajustar o tempo de espera.
- **Novo**: `supabase/functions/task-daily-report/index.ts` — Ler `agenda_relatorio_noturno` e `agenda_relatorio_matinal` para horário e status ativo. Gerar relatório formatado e enviar via Z-API para todos os `exa_alerts_directors` ativos.

### 5. CRON jobs para relatórios diários

Via SQL insert (não migration):
- CRON a cada minuto que chama `task-daily-report` com `{ check_schedule: true }`
- A Edge Function compara horário atual (BRT) com os horários configurados na `exa_alerts_config` e só executa quando bater

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/admin/tarefas/CentralTarefasPage.tsx` | Adicionar botão engrenagem (super_admin only) |
| `src/pages/admin/tarefas/components/AgendaNotificationSettingsModal.tsx` | **Criar** modal de configurações |
| `src/hooks/tarefas/useAgendaNotificationSettings.ts` | **Criar** hook para ler/salvar configs |
| `supabase/functions/task-reminder-scheduler/index.ts` | Corrigir tabela + ler config dinâmica |
| `supabase/functions/task-daily-report/index.ts` | **Criar** Edge Function de relatórios diários |
| `supabase/functions/task-follow-up-cron/index.ts` | Ler config dinâmica de minutos |

## O que NAO muda

- Nenhuma outra página, componente ou funcionalidade
- `task-notify-created` e `task-notify-change` permanecem intactos
- `task-follow-up-response` permanece intacto
- Nenhuma tabela precisa ser criada (usa `exa_alerts_config` existente)
- Design de todos os outros módulos permanece inalterado

