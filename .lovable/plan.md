
# Adicionar Selecao de Lead e Multi-Select de Propostas no CreateTaskModal

## O que sera feito

Quando o tipo de evento for **Reuniao**, o modal exibira dois novos campos logo abaixo do "Tipo de Reuniao":

1. **Busca de Lead/Contato** - Campo de busca com autocomplete que consulta a tabela `contacts` por nome, empresa ou telefone. Ao selecionar, preenche `cliente_id` da task. Pode ser usado sozinho (sem propostas).

2. **Multi-select de Propostas** - Quando um lead estiver selecionado, carrega automaticamente TODAS as propostas desse lead (filtrando por `client_phone` ou `client_name` na tabela `proposals`). O usuario pode selecionar 1, 2 ou mais propostas. Cada proposta selecionada sera salva na tabela `task_propostas` (N:N). Pode ser usado sozinho (sem lead), com busca manual por numero da proposta.

### Regras de uso flexivel:
- Somente lead (sem propostas) - OK
- Somente propostas (sem lead) - OK (busca geral)
- Lead + 1 proposta - OK
- Lead + varias propostas - OK

---

## Detalhes Tecnicos

### Arquivo modificado
`src/components/admin/agenda/CreateTaskModal.tsx`

### Novos estados
```typescript
const [searchLead, setSearchLead] = useState('');
const [selectedLead, setSelectedLead] = useState<{id: string; nome: string; empresa?: string; telefone?: string} | null>(null);
const [leadResults, setLeadResults] = useState([]);
const [selectedPropostas, setSelectedPropostas] = useState<string[]>([]);
```

### Query 1: Busca de leads
Quando `searchLead` tiver 2+ caracteres, buscar na tabela `contacts`:
```sql
SELECT id, nome, sobrenome, empresa, telefone, email, temperatura
FROM contacts
WHERE nome ILIKE '%termo%' OR empresa ILIKE '%termo%' OR telefone ILIKE '%termo%'
LIMIT 8
```
Debounce de 300ms. Exibir como dropdown abaixo do input.

### Query 2: Propostas do lead selecionado
Quando `selectedLead` mudar, buscar propostas:
```sql
SELECT id, number, status, fidel_monthly_value, client_name, duration_months
FROM proposals
WHERE client_phone = lead.telefone OR client_name ILIKE lead.nome
ORDER BY created_at DESC
```

### UI dos novos campos (abaixo do "Tipo de Reuniao")

**Lead:**
- Input com icone de busca
- Dropdown com resultados (nome, empresa, temperatura como badge colorido)
- Ao selecionar: exibir badge com nome + empresa e botao X para remover
- Ao remover lead: limpar propostas selecionadas

**Propostas:**
- Se lead selecionado: lista de checkboxes com propostas encontradas
- Cada item mostra: numero (EXA-2025-XXXX), status (badge), valor mensal (R$)
- Se nao houver lead: mensagem "Selecione um lead para ver propostas vinculadas"
- Pode selecionar 1, 2 ou mais

### Salvamento (mutacao atualizada)

1. Alterar insert para `.insert({...}).select('id').single()` para obter o ID da task criada
2. Setar `cliente_id: selectedLead?.id || null` no insert
3. Apos obter `task.id`, inserir em `task_propostas`:
```typescript
if (selectedPropostas.length > 0) {
  await supabase.from('task_propostas').insert(
    selectedPropostas.map(pid => ({ task_id: taskId, proposta_id: pid }))
  );
}
```

### Reset do form
Adicionar `setSelectedLead(null)`, `setSelectedPropostas([])`, `setSearchLead('')`, `setLeadResults([])`.

### Campos condicionais
Os novos campos so aparecem quando `tipoEvento === 'reuniao'`. Nenhum outro tipo de evento e afetado.

Nenhum outro arquivo sera modificado.
