

# Implementar Lead, Propostas e Recorrencia no CreateTaskModal

## Diagnostico: O que esta faltando

Apos analise completa do arquivo `CreateTaskModal.tsx` (695 linhas), confirmei que:

1. **Busca de Lead** - NAO EXISTE. O campo `cliente_id` existe na tabela `tasks` mas nunca e preenchido no modal.
2. **Multi-select de Propostas** - NAO EXISTE. A tabela `task_propostas` (N:N) ja foi criada no banco mas nao ha nenhum codigo no modal para usa-la.
3. **Recorrencia** - NAO EXISTE. A tabela `task_rotinas` existe com campos `frequencia`, `dias_semana`, `dia_mes`, mas o modal nao tem toggle nem opcoes de recorrencia.

Toda a infraestrutura de banco esta pronta (tabelas `contacts`, `proposals`, `task_propostas`, `task_rotinas`, campo `cliente_id` em `tasks`). Falta apenas o codigo frontend.

---

## O que sera implementado

### 1. Busca de Lead/Contato (autocomplete)

Aparece quando `tipoEvento === 'reuniao'`, logo abaixo do "Tipo de Reuniao":

- Input com icone de busca
- Ao digitar 2+ caracteres, busca na tabela `contacts` por `nome`, `empresa` ou `telefone` (debounce 300ms, limite 8 resultados)
- Dropdown mostrando: nome, empresa, temperatura (badge colorido)
- Ao selecionar: exibe badge com nome + empresa e botao X para remover
- Ao remover lead: limpa propostas selecionadas tambem
- Campo OPCIONAL - pode criar reuniao sem lead

**Dados disponiveis na tabela `contacts`:**
- `id`, `nome`, `sobrenome`, `empresa`, `telefone`, `email`, `temperatura`

### 2. Multi-select de Propostas

Aparece abaixo do campo de lead quando `tipoEvento === 'reuniao'`:

- Quando lead selecionado: busca automatica na tabela `proposals` filtrando por `client_phone` (match com telefone do lead) ou `client_name` (match com nome do lead)
- Lista de checkboxes com cada proposta encontrada
- Cada item mostra: numero (ex: EXA-2026-8549), status (badge), valor mensal (R$ formatado)
- Pode selecionar 1, 2 ou quantas quiser
- Sem lead selecionado: mensagem "Selecione um lead para ver propostas vinculadas"
- Campo OPCIONAL - pode ter lead sem propostas

**Dados disponiveis na tabela `proposals`:**
- `id`, `number`, `client_name`, `client_phone`, `status`, `fidel_monthly_value`, `duration_months`

### 3. Toggle de Recorrencia

Aparece para TODOS os tipos de evento, antes da descricao:

- Switch "Tarefa recorrente" (on/off)
- Quando ativado, mostra select de frequencia: Diaria, Semanal, Mensal
- Informativo de que tarefas recorrentes serao geradas automaticamente

---

## Detalhes Tecnicos

### Arquivo modificado
`src/components/admin/agenda/CreateTaskModal.tsx`

### Novos estados

```text
searchLead (string) - texto digitado na busca
selectedLead (objeto ou null) - lead selecionado {id, nome, empresa, telefone}
leadResults (array) - resultados da busca
showLeadDropdown (boolean) - controlar visibilidade do dropdown
leadPropostas (array) - propostas encontradas para o lead
selectedPropostas (string[]) - IDs das propostas selecionadas
isRecorrente (boolean) - toggle de recorrencia
frequenciaRecorrencia (string) - 'diaria' | 'semanal' | 'mensal'
```

### Logica de busca de leads (useEffect com debounce)

Quando `searchLead` tem 2+ caracteres e `tipoEvento === 'reuniao'`:
- Query: `supabase.from('contacts').select('id, nome, sobrenome, empresa, telefone, email, temperatura').or('nome.ilike.%termo%,empresa.ilike.%termo%,telefone.ilike.%termo%').limit(8)`
- Debounce 300ms via setTimeout

### Logica de busca de propostas (useEffect)

Quando `selectedLead` muda e tem valor:
- Query: `supabase.from('proposals').select('id, number, status, fidel_monthly_value, client_name, duration_months').or('client_phone.eq.lead.telefone,client_name.ilike.%lead.nome%').order('created_at', { ascending: false })`

### Mutacao atualizada

1. Trocar `.insert({...})` por `.insert({...}).select('id').single()` para obter o ID da task
2. Incluir `cliente_id: selectedLead?.id || null` no insert
3. Apos criar task, inserir em `task_propostas`:

```text
if (selectedPropostas.length > 0) {
  await supabase.from('task_propostas').insert(
    selectedPropostas.map(pid => ({ task_id: taskId, proposta_id: pid }))
  );
}
```

### Reset do formulario

Adicionar limpeza: `setSelectedLead(null)`, `setSelectedPropostas([])`, `setSearchLead('')`, `setLeadResults([])`, `setLeadPropostas([])`, `setIsRecorrente(false)`, `setFrequenciaRecorrencia('semanal')`.

### Posicao dos novos campos no formulario

```text
1. Tipo de Evento (ja existe)
2. Subtipo de Reuniao (ja existe, condicional)
3. >>> NOVO: Busca de Lead (condicional: tipoEvento === 'reuniao')
4. >>> NOVO: Multi-select Propostas (condicional: tipoEvento === 'reuniao')
5. Titulo (ja existe)
6. Data/Hora (ja existe)
7. Prioridade (ja existe)
8. Responsaveis (ja existe)
9. Alertas WhatsApp (ja existe)
10. >>> NOVO: Toggle Recorrencia (todos os tipos)
11. Descricao (ja existe)
12. Botoes (ja existe)
```

### Nenhum outro arquivo sera modificado

Apenas `CreateTaskModal.tsx` sera alterado. Todas as demais paginas (Minha Manha, Central de Tarefas, Agenda) continuam funcionando normalmente.

