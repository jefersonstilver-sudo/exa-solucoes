

# Ordenacao por Ultima Atualizacao + Painel de Atividades Recentes

## Problema Atual

1. A lista de contatos ordena por `created_at` por padrao, mas nao mostra **quando** cada contato foi atualizado. Contatos recentemente modificados ficam enterrados na lista.
2. A opcao `updated_at` nao existe no seletor de ordenacao (so tem `created_at`, `last_contact_at`, `pontuacao_atual`, `nome`).
3. Nao existe nenhum painel de atividades/notas recentes visivel para toda a equipe na pagina principal de contatos.

## Solucao

### 1. Adicionar ordenacao por `updated_at` e tornar padrao

**Arquivo: `src/pages/admin/contatos/ContatosPage.tsx`**

- Mudar o estado inicial de `orderBy` de `'created_at'` para `'updated_at'`
- Isso garante que contatos recem-atualizados ou recem-criados sempre aparecem no topo

**Arquivo: `src/components/contatos/listagem/ContatosTable.tsx`** (apenas na ordenacao local)

- Remover o sort local que coloca duplicados primeiro (linha 89-93), pois ele sobrescreve a ordenacao do banco e confunde o usuario

### 2. Adicionar opcao "Ultima Atualizacao" no seletor de ordenacao

**Arquivo: `src/pages/admin/contatos/ContatosPage.tsx`**

- Adicionar `<SelectItem value="updated_at">Ultima Atualizacao</SelectItem>` no seletor existente (ao lado de "Data Criacao", "Ultima Atividade", etc.)

### 3. Mostrar coluna "Atualizado ha" na tabela

**Arquivo: `src/components/contatos/listagem/ContatosTable.tsx`**

- Renomear a coluna "Ultima Atividade" para mostrar `updated_at` como informacao principal (com `formatDistanceToNow` -- ex: "ha 2 horas", "ha 3 dias")
- No tooltip, mostrar a data/hora completa do `updated_at`
- Abaixo, em texto menor, mostrar `last_interaction_at` se existir (para manter a info de ultima interacao)

### 4. Painel de "Atividades Recentes" na pagina principal

**Arquivo: `src/pages/admin/contatos/ContatosPage.tsx`**

Adicionar um card compacto entre os Stats Cards e o KanbanHeader, mostrando as ultimas 5 atividades do sistema de contatos, buscando da tabela `user_activity_logs` com `entity_type = 'contact'`. Cada item mostra:

- Acao realizada (criou, atualizou, excluiu)
- Nome do contato afetado
- Quem fez (email do usuario)
- Quanto tempo atras

O card tera titulo "Atividades Recentes" com icone de relogio, layout compacto em lista, e sera colapsavel para nao ocupar muito espaco.

## Detalhes Tecnicos

### Arquivo 1: `src/pages/admin/contatos/ContatosPage.tsx`

1. Mudar linha 28: `useState<ContatosOrderBy>('created_at')` para `useState<ContatosOrderBy>('updated_at')`
2. Adicionar `SelectItem` com value `updated_at` e label "Ultima Atualizacao" no Select de ordenacao
3. Adicionar componente `RecentActivityPanel` que:
   - Faz query: `supabase.from('user_activity_logs').select('*').eq('entity_type', 'contact').order('created_at', { ascending: false }).limit(5)`
   - Renderiza em Card colapsavel com Collapsible do Radix
   - Cada item: icone da acao + descricao + tempo relativo

### Arquivo 2: `src/components/contatos/listagem/ContatosTable.tsx`

1. Remover sort local de duplicados (linhas 89-93) que sobrescreve a ordenacao do banco
2. Alterar coluna "Ultima Atividade" para mostrar `updated_at` como dado principal com `formatDistanceToNow`
3. Tooltip mostra data/hora completa
4. Se `last_interaction_at` existir, mostrar como texto secundario abaixo

### Arquivo 3: `src/types/contatos.ts`

- O tipo `ContatosOrderBy` ja inclui `'updated_at'` (linha 629), entao nao precisa alterar

### Nenhuma alteracao no banco de dados

Os campos `updated_at`, `user_activity_logs` e `contact_notes` ja existem. Apenas a UI precisa ser atualizada.

