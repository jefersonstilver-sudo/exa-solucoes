

# Unificacao: Central de Tarefas + Agenda em Uma Pagina

## Problema
- "Central de Tarefas" no sidebar abre a pagina "Minha Manha" (rota `/minha-manha`) -- confuso e improdutivo
- Existem 3 paginas separadas (Minha Manha, Central de Tarefas, Agenda) buscando a mesma tabela `tasks` sem sincronizacao
- O usuario precisa navegar entre paginas para ter visao completa

## Solucao

Unificar tudo em uma unica pagina robusta em `/tarefas` com:
- Listagem de tarefas com filtros (herda da Central atual)
- Agenda embutida com 3 visoes (Dia, Semana, Mes)
- Sidebar atualizada para apontar corretamente

## Estrutura Visual

```text
+--------------------------------------------------+
|  Central de Tarefas              [Agenda] [+Nova] |
+--------------------------------------------------+
|  [Hoje] [Semana] [Atrasadas] [Todas]              |
+--------------------------------------------------+
|  Stats: Urgentes | Importantes | Rotina | Total   |
+--------------------------------------------------+
|  Tarefas agrupadas por prioridade (cards)         |
+--------------------------------------------------+
|  AGENDA INTEGRADA                                 |
|  [Dia] [Semana] [Mes]                             |
|  Timeline / Grid / Calendario mensal              |
+--------------------------------------------------+
```

## Alteracoes Detalhadas

### 1. Refatorar `CentralTarefasPage.tsx` -- Pagina Unificada Principal

Combinar o melhor das 2 paginas existentes:
- **Header**: manter titulo "Central de Tarefas" com botoes Atualizar e Nova Tarefa
- **Quick Filters**: Hoje, Semana, Atrasadas, Todas (do MinhaManha)
- **Stats Cards**: Urgentes, Importantes, Rotina, Total Pendentes (do MinhaManha)
- **Tarefas agrupadas**: por prioridade em secoes colapsaveis (Urgente/Importante/Rotina do MinhaManha)
- **Agenda embutida**: abaixo das tarefas, com sub-abas Dia/Semana/Mes
- **Usar `useMinhaManha` como base** (ja filtra por usuario e categoriza), com filtros adicionais da Central

### 2. Criar `EmbeddedAgenda.tsx`

Wrapper com 3 sub-abas:
- Recebe tarefas como prop (mesma fonte de dados)
- Controla navegacao de datas internamente
- Abas: Dia | Semana | Mes

### 3. Criar `AgendaDayView.tsx`

- Timeline vertical com slots de hora (08:00 ate 22:00)
- Tarefas posicionadas por `horario_inicio` ou `horario_limite`
- Tarefas sem horario em secao "Dia inteiro" no topo
- Cores por prioridade

### 4. Criar `AgendaWeekView.tsx`

- Grid 7 colunas (Seg-Dom) com linhas de hora
- Navegacao semana anterior/proxima
- Tarefas como blocos coloridos nos slots

### 5. Criar `AgendaMonthView.tsx`

- Extrair logica de calendario mensal do `AgendaPage.tsx`
- Manter DnD (drag-and-drop) com DroppableCalendarDay
- Reutilizar DraggableTaskCard existente

### 6. Atualizar Sidebar (`ModernAdminSidebar.tsx`)

Linha 134: mudar href de `buildPath('minha-manha')` para `buildPath('tarefas')`
- "Central de Tarefas" aponta para `/tarefas`
- Remover link separado "Agenda" (linha 160-164) -- a agenda agora esta embutida na Central

### 7. Atualizar Rotas (`SuperAdminRoutes.tsx`)

- Rota `/tarefas` renderiza a pagina unificada (CentralTarefasPage refatorada)
- Rota `/minha-manha` redireciona para `/tarefas` (Navigate)
- Rota `/agenda` redireciona para `/tarefas` (Navigate)
- Nao quebra links existentes

### 8. Sincronizacao de Dados

- A pagina unificada usa `useMinhaManha` (que ja busca da tabela `tasks` e categoriza)
- Todas as mutacoes (criar, editar, concluir, arrastar) invalidam as mesmas query keys
- A agenda embutida recebe as tasks filtradas como prop -- zero duplicacao de queries

## Detalhes Tecnicos

**Arquivos novos (4):**
- `src/pages/admin/tarefas/components/EmbeddedAgenda.tsx`
- `src/pages/admin/tarefas/components/AgendaDayView.tsx`
- `src/pages/admin/tarefas/components/AgendaWeekView.tsx`
- `src/pages/admin/tarefas/components/AgendaMonthView.tsx`

**Arquivos editados (3):**
- `src/pages/admin/tarefas/CentralTarefasPage.tsx` -- refatorar como pagina unificada
- `src/components/admin/layout/ModernAdminSidebar.tsx` -- corrigir link + remover Agenda separada
- `src/routes/SuperAdminRoutes.tsx` -- adicionar redirects

**Arquivos NAO alterados:**
- CreateTaskModal, EditTaskModal, BuildingSelector, TaskCard, TaskDetailDrawer -- intactos
- AgendaPage.tsx -- mantido como fallback (redirect aponta para /tarefas)
- Nenhum outro componente de UI existente

**Abordagem de timeline (Dia/Semana):**
- Slots de 1 hora (08:00-22:00)
- Tarefas com `horario_inicio` posicionadas no slot exato
- Tarefas com apenas `horario_limite` aparecem no slot do limite
- Tarefas sem horario ficam em area "Dia inteiro"
- Cores: vermelho (emergencia/alta), amarelo (media), verde (baixa)

