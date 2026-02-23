
# Contato, Propostas e Predios para Todos os Tipos de Evento

## Resumo

Tornar os campos **Lead/Contato**, **Propostas Vinculadas** e um novo seletor de **Predio** disponíveis para **todos** os tipos de evento (nao apenas "Reuniao"). Alem disso, adicionar um campo de selecao de predio que lista todos os predios da base interna (online e offline).

## O que muda

### 1. Nova coluna no banco: `building_id` na tabela `tasks`

A tabela `tasks` atualmente nao tem campo para vincular a um predio. Sera adicionada uma coluna `building_id` (uuid, nullable) com foreign key para a tabela `buildings`.

```text
ALTER TABLE tasks ADD COLUMN building_id uuid REFERENCES buildings(id);
```

### 2. CreateTaskModal.tsx - 3 alteracoes

**2.1 Remover restricao `tipoEvento === 'reuniao'` do debounce de busca de lead (linha 163)**
- Remover a condicao `|| tipoEvento !== 'reuniao'` para que a busca de contatos funcione em qualquer tipo de evento.

**2.2 Remover wrappers condicionais das secoes Lead e Propostas (linhas 575 e 639)**
- A secao "Lead / Contato" (linha 575) deixa de ser condicional a `tipoEvento === 'reuniao'` e passa a aparecer sempre.
- A secao "Propostas Vinculadas" (linha 639) tambem deixa de ser condicional.

**2.3 Adicionar novo seletor de Predio**
- Novo estado: `selectedBuildingId` e `buildingSearchTerm`
- Query para buscar todos os predios da tabela `buildings` (sem filtro de status, incluindo online e offline)
- Campo com busca/autocomplete mostrando nome e bairro do predio
- Salvar `building_id` no insert da task (linha 316)
- Resetar no `resetForm()`

### 3. EditTaskModal.tsx - Adicionar campos de Lead, Propostas e Predio

O EditTaskModal atualmente nao possui os campos Lead, Propostas e Predio. Serao adicionados:
- Estado `selectedBuildingId` inicializado a partir de `task.building_id`
- Seletor de predio com busca (mesmo componente/logica do Create)
- Exibicao do contato vinculado (read-only com opcao de alterar)
- O `building_id` sera incluido no update da mutation (linha 118)

### 4. Nenhuma outra funcionalidade e alterada

- O subtipo de reuniao continua aparecendo apenas para tipo "reuniao"
- Toda a logica existente de filtros, cards, calendario permanece intacta
- Os campos sao opcionais -- nao quebram nenhuma tarefa existente

## Detalhes Tecnicos

**Migracao SQL:**
- `ALTER TABLE tasks ADD COLUMN building_id uuid REFERENCES buildings(id);`
- Policy RLS nao necessaria (tasks ja tem suas policies)

**Arquivos alterados:**
- `src/components/admin/agenda/CreateTaskModal.tsx` -- remover 3 condicionais + adicionar seletor de predio
- `src/components/admin/agenda/EditTaskModal.tsx` -- adicionar seletor de predio + building_id na mutation

**Arquivos novos:** Nenhum

**Query de predios (todos, sem filtro):**
```text
supabase.from('buildings').select('id, nome, bairro, status').order('nome')
```

Isso traz tanto predios online quanto offline da base interna.
