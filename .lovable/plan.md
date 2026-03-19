

# Plano: Lembretes de Notificação por Tarefa (estilo Google Calendar)

## Problema

O EditTaskModal não tem nenhum painel para configurar **lembretes individuais por tarefa** — ex: "notificar 5 minutos antes", "1 dia antes", "1 semana antes". Hoje só existe configuração **global** (AgendaNotificationSettingsModal) com um único "Lembrete Pré-Evento" fixo em X minutos. Falta a granularidade por evento como no Google Calendar.

## Solução

Criar uma tabela `task_reminders` para armazenar N regras de lembrete por tarefa, e adicionar um painel de lembretes dentro do EditTaskModal (sidebar direita) + CreateTaskModal.

## Alterações

### 1. Migration — nova tabela `task_reminders`

```sql
CREATE TABLE task_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'notificacao',  -- notificacao, email
  unidade TEXT NOT NULL DEFAULT 'minutos',   -- minutos, horas, dias, semanas
  valor INT NOT NULL DEFAULT 30,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: authenticated users can manage
ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage task_reminders" ON task_reminders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Index for fast lookup
CREATE INDEX idx_task_reminders_task_id ON task_reminders(task_id);
```

Ao criar uma tarefa sem lembretes customizados, inserir 3 regras padrão:
- 30 minutos antes (Notificação)
- 1 dia antes (Notificação)  
- 1 semana antes (Notificação)

### 2. Novo componente `TaskRemindersPanel.tsx`

Componente reutilizável (usado no EditTaskModal e CreateTaskModal) com:
- Lista de lembretes existentes, cada um com:
  - Select de unidade (minutos / horas / dias / semanas)
  - Input numérico do valor
  - Toggle ativo/inativo
  - Botão remover
- Botão "+ Adicionar lembrete" (máximo 5)
- Visual estilo Apple/iOS consistente com o resto do modal
- Responsivo (funciona na sidebar desktop e em tela cheia mobile)

### 3. Atualizar `EditTaskModal.tsx`

- Na sidebar direita (seção "Notificações"), adicionar o `TaskRemindersPanel` acima do monitor de confirmações
- Carregar lembretes da tarefa via query (`task_reminders` WHERE `task_id`)
- Salvar lembretes no `handleSubmit` (upsert/delete conforme alterações)
- Se a tarefa não tem lembretes, criar os 3 padrões na primeira abertura

### 4. Atualizar `CreateTaskModal.tsx`

- Adicionar o `TaskRemindersPanel` no formulário
- Ao criar a tarefa, inserir os lembretes configurados na tabela `task_reminders`
- Iniciar com os 3 lembretes padrão pré-preenchidos

### 5. Atualizar tipos Supabase

- A tabela `task_reminders` será adicionada automaticamente aos tipos após a migration

**5 alterações: 1 migration + 1 componente novo + 2 modais atualizados + tipos**

