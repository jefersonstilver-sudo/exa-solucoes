

# Sistema de Gestão de Incidentes Offline — Plano Estruturado

## Problema
Quando um painel fica offline, ninguem registra a causa. Quando volta online, o histórico se perde. Não há rastreabilidade de quem investigou, qual foi o problema, nem categorização dos tipos de falha.

## Arquitetura

### 1. Banco de Dados — 2 novas tabelas

**`incident_categories`** — CRUD completo de categorias (criar, editar, apagar)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| name | text UNIQUE | Slug: `energia`, `internet`, etc. |
| label | text | Display: "Queda de Energia" |
| icon | text | Emoji: ⚡, 🌐, 🔧 |
| color | text | Hex: #EF4444 |
| is_default | boolean | Protege contra exclusão |
| sort_order | integer | Ordenação |
| created_at | timestamptz | |

Categorias padrão inseridas: Energia, Internet, Hardware, Elevador, Manutenção Programada, Desconhecido.

**`device_offline_incidents`** — Registro de cada incidente
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| device_id | uuid FK → devices | |
| started_at | timestamptz | Início do offline |
| resolved_at | timestamptz | Quando voltou online |
| category_id | uuid FK → incident_categories | Categoria selecionada |
| causa | text | Texto livre da causa |
| resolucao | text | O que foi feito |
| registrado_por | uuid FK → auth.users | Quem registrou a causa |
| registrado_por_nome | text | Nome cacheado |
| registrado_em | timestamptz | Quando registrou |
| status | text | `pendente` / `causa_registrada` / `resolvido` |
| auto_resolved | boolean | Se voltou online sem intervenção manual |

**Trigger automático**: Quando `devices.status` muda para `offline` → cria incidente `pendente`. Quando muda para `online` → marca `resolved_at` e `auto_resolved = true`.

### 2. Novos Componentes

**`IncidentCategoryManager.tsx`** — Modal de CRUD de categorias
- Acessível via botão ⚙️ no card de incidente ou na aba de incidentes
- Listar categorias com ícone, cor, label
- Criar nova categoria (nome, label, emoji, cor)
- Editar categorias existentes
- Apagar categorias não-default (com confirmação)
- Reordenar via botões subir/descer
- Padrão idêntico ao `useEventTypes` da agenda

**`OfflineIncidentCard.tsx`** — Card de incidente ativo
- Aparece no `ComputerDetailModal` quando device está offline
- Card vermelho/amarelo com formulário:
  - Dropdown de categoria (com botão ⚙️ para gerenciar)
  - Textarea de causa
  - Textarea de resolução
  - Botão "Registrar Causa"
- Quando já registrada: mostra quem, quando, e a categoria com badge colorido

**`IncidentHistoryTab.tsx`** — Nova 4a aba "Incidentes" no modal
- Lista todos os incidentes do device
- Cada item: data, duração, categoria (badge colorido), causa, responsável
- Filtro por período
- Status visual: pendente (vermelho), causa_registrada (amarelo), resolvido (verde)

### 3. Hook

**`useDeviceIncidents.ts`**
- `fetchActiveIncident(deviceId)` — incidente pendente atual
- `fetchIncidentHistory(deviceId)` — todos os incidentes
- `registerCause(incidentId, categoryId, causa, resolucao)` — registra causa + user
- CRUD de categorias: `fetchCategories`, `createCategory`, `updateCategory`, `deleteCategory`

### 4. Integração no `ComputerDetailModal.tsx`
- Inserir `OfflineIncidentCard` entre os cards superiores e as tabs (quando offline)
- Adicionar 4a tab "Incidentes" com ícone `AlertTriangle`
- Grid de tabs passa de `grid-cols-3` para `grid-cols-4`

### 5. Badge no `ComputerCard.tsx`
- Quando device offline tem incidente `pendente`: badge piscante "⚠ Sem causa"
- Quando tem `causa_registrada`: badge amarelo com ícone da categoria

## Arquivos

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar 2 tabelas + trigger + dados padrão + RLS |
| `hooks/useDeviceIncidents.ts` | Criar — hook CRUD |
| `components/anydesk/OfflineIncidentCard.tsx` | Criar — card de incidente ativo |
| `components/anydesk/IncidentHistoryTab.tsx` | Criar — tab de histórico |
| `components/anydesk/IncidentCategoryManager.tsx` | Criar — modal CRUD de categorias |
| `components/anydesk/ComputerDetailModal.tsx` | Modificar — integrar card + tab |
| `components/anydesk/ComputerCard.tsx` | Modificar — badge de causa pendente |

## Fluxo

1. Device fica offline → trigger cria incidente `pendente`
2. Admin abre modal → vê card vermelho "Causa Pendente"
3. Admin seleciona categoria + escreve causa → salva → status `causa_registrada`, grava user
4. Admin pode gerenciar categorias via ⚙️ (criar, editar, apagar)
5. Device volta online → trigger auto-resolve, marca `resolved_at`
6. Histórico completo na aba "Incidentes" com filtros e responsáveis

