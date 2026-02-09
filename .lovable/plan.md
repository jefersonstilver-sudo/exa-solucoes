

# Plano Completo: Modulo de Tarefas & Agenda Robusto

---

## Diagnostico Completo do Estado Atual

### 3 Paginas, 2 Fontes de Dados Diferentes

| Pagina | Fonte | Status |
|--------|-------|--------|
| **Minha Manha** (`MinhaManha.tsx`) | Tabela `tasks` (canonica) | Funcional |
| **Central de Tarefas** (`CentralTarefasPage.tsx`) | Tabela `tasks` (canonica) | Funcional |
| **Agenda** (`AgendaPage.tsx`) | Tabela `notion_tasks` (LEGADO!) | Desconectada |

A Agenda usa `notion_tasks` (58 registros, sincronizados do Notion), enquanto as outras paginas usam `tasks` (8 registros). Sao mundos separados.

### Tabelas que JA existem no banco

- `tasks` - tabela canonica com status, prioridade, origem (ENUMs), horario_limite, etc.
- `task_types` - tipos de tarefa com departamento e prioridade padrao
- `task_responsaveis` - N:N entre tasks e users (com `lida_em`)
- `task_checklist_items` - checklist por tarefa com obrigatoriedade
- `task_status_log` - auditoria completa de mudancas
- `task_rotinas` - rotinas com frequencia, dias_semana, dia_mes
- `calendar_events` - tabela separada (usada apenas no modulo Contatos) com contact_id, event_type, meeting_url, participants (JSONB)
- `notion_tasks` - tabela legado (58 registros) sincronizada com Notion

### O que FALTA na tabela `tasks`

- Campo `tipo_evento` (tarefa, reuniao, compromisso, aviso)
- Campo `subtipo_reuniao` (lead, interna, externa)
- Campo `departamento_id` (FK para `process_departments`)
- Campo `horario_inicio` (TIME) - so tem `horario_limite`
- Campo `local` / `link_reuniao`
- Campo `escopo` (individual, departamento, global)
- Vinculacao N:N com propostas (nao existe tabela)
- Vinculacao N:N com participantes/contatos (nao existe tabela)

### O que FALTA no `CreateTaskModal`

- Nao tem seletor de tipo de evento
- Nao tem busca de lead/contato
- Nao tem vinculacao com propostas
- Nao tem campo de local/link de reuniao
- Nao tem escopo (individual/departamento/global)
- Nao tem configuracao de recorrencia

### O que FALTA na `AgendaPage`

- Usa `notion_tasks` em vez de `tasks`
- Nao tem visoes Semana/Dia (so Mes)
- Sidebar nao minimiza
- Filtros muito basicos (so status e prioridade do Notion)
- Nao filtra por departamento/pessoa
- Nao tem cores por tipo de evento

---

## Plano de Implementacao - Fase 1: Fundacao

Dado o tamanho, proponho comecar pela **Fase 1** que cria a estrutura no banco e expande o modal de criacao. Sem isso, as outras fases nao tem dados corretos para trabalhar.

### 1.1 - Migracoes de Banco de Dados

**Adicionar colunas na tabela `tasks`:**

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tipo_evento TEXT DEFAULT 'tarefa';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtipo_reuniao TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS departamento_id UUID REFERENCES process_departments(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS horario_inicio TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS local_evento TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS link_reuniao TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS escopo TEXT DEFAULT 'individual';
```

**Criar tabela `task_propostas` (N:N):**

```sql
CREATE TABLE task_propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  proposta_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, proposta_id)
);
```

**Criar tabela `task_participantes`:**

```sql
CREATE TABLE task_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  contato_nome TEXT,
  contato_telefone TEXT,
  tipo TEXT DEFAULT 'participante',
  confirmado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS nas novas tabelas** - politicas para authenticated users.

### 1.2 - Expandir `CreateTaskModal.tsx`

Adicionar os seguintes campos no formulario:

1. **Seletor de Tipo de Evento** (tabs ou select):
   - Tarefa (padrao - formulario atual)
   - Reuniao (mostra: subtipo, lead/contato, propostas, link reuniao)
   - Compromisso (mostra: horario inicio/fim, local)
   - Aviso (mostra: escopo individual/departamento/global)

2. **Quando "Reuniao" selecionado:**
   - Subtipo: Lead, Interna, Externa, Fornecedor
   - Campo de busca de contato/lead (se subtipo = lead)
   - Multi-select de propostas vinculadas
   - Campo de link de reuniao (Google Meet, Zoom, etc.)

3. **Departamento:** Seletor do departamento vinculado (herda do usuario criador como padrao)

4. **Escopo:** Radio group - Individual | Meu Departamento | Todos (Global)
   - "Todos" = aparece no quadro de todos os usuarios

5. **Gravar novos campos** no insert da tabela `tasks`

### 1.3 - Migrar AgendaPage para tabela `tasks`

Trocar a query de `notion_tasks` para `tasks` no `AgendaPage.tsx`:
- Query: `supabase.from('tasks').select('*').order('data_prevista')`
- Mapear campos: `data_prevista` em vez de `data`, `titulo` em vez de `nome`, status canonico em vez de Notion
- Remover dependencia de `sync-notion-tasks` e `update-notion-task`
- Manter drag-and-drop funcional (atualizar `data_prevista` diretamente)

### 1.4 - Atualizar tipos TypeScript

Adicionar novos campos ao tipo `Task` e `TaskWithDetails` em `src/types/tarefas.ts`:
- `tipo_evento`, `subtipo_reuniao`, `departamento_id`, `horario_inicio`, `local_evento`, `link_reuniao`, `escopo`
- Novo tipo `TaskParticipante`
- Novo tipo `TaskProposta`

---

## Fase 2: Calendario Robusto (proxima iteracao)

- Visoes Mes / Semana / Dia com tabs
- Sidebar auto-minimiza (comunicacao com layout pai)
- Filtros avancados: departamento, pessoa, tipo de evento, status realizado/nao
- Cores por tipo: azul=reuniao, verde=tarefa, laranja=compromisso, roxo=aviso
- Calendario full-width quando sidebar minimizada

## Fase 3: Governanca Departamental (iteracao final)

- Cada setor ve automaticamente suas tarefas
- CEO ve tudo com filtro por departamento
- Avisos `escopo='global'` aparecem em TODOS os quadros
- Timeline de acompanhamento reuniao-lead-proposta

---

## Arquivos a Criar/Modificar na Fase 1

| Arquivo | Acao |
|---------|------|
| **Migracao SQL** | Novos campos em `tasks` + tabelas `task_propostas` e `task_participantes` |
| `src/types/tarefas.ts` | Adicionar novos tipos e campos |
| `src/components/admin/agenda/CreateTaskModal.tsx` | Expandir com tipo_evento, subtipo, lead, propostas, escopo |
| `src/pages/admin/AgendaPage.tsx` | Migrar de `notion_tasks` para `tasks` |
| `src/components/admin/agenda/TaskCard.tsx` | Adaptar para campos da tabela `tasks` |
| `src/components/admin/agenda/DraggableTaskCard.tsx` | Atualizar interface para `tasks` |
| `src/components/admin/agenda/DroppableCalendarDay.tsx` | Atualizar interface para `tasks` |
| `src/components/admin/agenda/EditTaskModal.tsx` | Atualizar para `tasks` |
| `src/components/admin/agenda/TaskListModal.tsx` | Atualizar para `tasks` |

Nenhuma alteracao sera feita em Minha Manha, Central de Tarefas, ou qualquer outro modulo existente que nao seja diretamente relacionado.

