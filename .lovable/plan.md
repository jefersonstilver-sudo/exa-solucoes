
# Gerenciador de Tipos de Evento - Engrenagem no Select

## Resumo

Criar um sistema completo de CRUD para tipos de evento na agenda, acessivel por um botao de engrenagem ao lado do campo "Tipo de Evento" nos modais de criacao e edicao de tarefas. Atualmente os tipos (Tarefa, Reuniao, Compromisso, Aviso) sao hardcoded em 4 arquivos diferentes.

## Arquitetura

### 1. Nova Tabela no Supabase: `event_types`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | Identificador |
| name | text UNIQUE | Chave interna (ex: "tarefa", "reuniao") |
| label | text | Label visivel (ex: "Tarefa", "Reuniao") |
| icon | text | Emoji ou nome do icone (ex: "check", "video") |
| color | text | Classe CSS de cor (ex: "bg-emerald-100 text-emerald-700") |
| is_default | boolean | Tipos padrao nao podem ser deletados |
| sort_order | integer | Ordem de exibicao |
| active | boolean | Se esta ativo para selecao |
| created_at | timestamptz | Data de criacao |

Os 4 tipos atuais serao inseridos como defaults (`is_default = true`).

### 2. Novo Componente: `EventTypeManagerModal.tsx`

Modal completo com:
- Lista de todos os tipos de evento (ordenados por `sort_order`)
- Cada item mostra: icone, label, cor, badge "padrao" se aplicavel
- Botao "Adicionar Novo Tipo" no topo
- Acoes por tipo:
  - **Editar**: abre inline ou sub-modal para alterar label, icone e cor
  - **Ativar/Desativar**: toggle para tipos customizados
  - **Excluir**: apenas tipos nao-default, com confirmacao
- Tipos default (Tarefa, Reuniao, Compromisso, Aviso): podem ter label/icone editados, mas nao podem ser excluidos
- Seletor de cor com paleta pre-definida (emerald, blue, orange, purple, red, pink, cyan, amber)
- Seletor de emoji para o icone

### 3. Novo Hook: `useEventTypes.ts`

Seguindo o padrao existente do `useContactTypes.ts`:
- `fetchEventTypes()` - buscar todos os tipos
- `createEventType(name, label, icon, color)` - criar novo
- `updateEventType(id, label, icon, color)` - editar
- `deleteEventType(id)` - remover (apenas nao-default)
- `toggleEventType(id, active)` - ativar/desativar
- Cache via React Query para performance

### 4. Alteracoes nos Componentes Existentes

**CreateTaskModal.tsx (linha 519-533)**:
- Adicionar botao de engrenagem (Settings icon) ao lado do label "Tipo de Evento"
- Substituir `SelectItem` hardcoded por mapeamento dinamico do hook `useEventTypes`
- Botao abre o `EventTypeManagerModal`

**EditTaskModal.tsx (linha 188-200)**:
- Mesma alteracao: engrenagem + select dinamico

**TaskCard.tsx (linha 73-78)**:
- `TIPO_EVENTO_CONFIG` passa a ser construido dinamicamente a partir dos dados do banco
- Fallback para config padrao caso tipo nao seja encontrado

### 5. Detalhes Tecnicos

**Migracao SQL:**
```text
- CREATE TABLE event_types (id, name, label, icon, color, is_default, sort_order, active, created_at)
- INSERT dos 4 tipos padrao
- RLS: leitura para authenticated, escrita para admin/super_admin
```

**Arquivos novos:**
- `supabase/migrations/XXX_create_event_types.sql`
- `src/hooks/agenda/useEventTypes.ts`
- `src/components/admin/agenda/EventTypeManagerModal.tsx`

**Arquivos alterados:**
- `src/components/admin/agenda/CreateTaskModal.tsx` - engrenagem + select dinamico
- `src/components/admin/agenda/EditTaskModal.tsx` - engrenagem + select dinamico
- `src/components/admin/agenda/TaskCard.tsx` - config dinamica de tipos

Nenhuma outra funcionalidade ou interface sera alterada.
