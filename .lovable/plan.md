

# Diagnóstico e Correção: Dados Voltando para Versão Anterior

## Problema Identificado

Após análise detalhada do banco de dados e código, identifiquei **duas causas principais**:

### Causa 1: Cache do React Query não invalidado

A query que carrega a proposta para edição usa a chave `['proposal-for-edit', editProposalId]`, mas quando você salva um rascunho ou edita a proposta:

```typescript
// Linha 1896 - Apenas invalida 'proposals', NÃO a query de edição específica
queryClient.invalidateQueries({ queryKey: ['proposals'] });
```

Resultado: Ao navegar de volta para editar, o React Query pode retornar dados em cache desatualizados.

### Causa 2: Sugestões de Autocomplete sobrescrevem dados

Quando você digita nos campos do cliente (Nome, Empresa, Email), o sistema de autocomplete busca no histórico e **quando você clica em uma sugestão**, ele preenche TODOS os campos com os dados daquela sugestão:

```typescript
// Linha 2191-2202 - onSelectSuggestion sobrescreve todos os campos
onSelectSuggestion={entry => {
  const meta = entry.metadata || {};
  setClientData(prev => ({
    ...prev,
    firstName: meta.firstName || prev.firstName,  // PODE SOBRESCREVER!
    lastName: meta.lastName || prev.lastName,
    companyName: entry.field_value,               // SOBRESCREVE!
    document: meta.cnpj || prev.document,
    email: meta.email || prev.email,
    phone: meta.phone || prev.phone,
    // ...
  }));
}}
```

**Evidência no banco de dados:**
- Histórico de autocomplete tem "Atacado Games" com frequência 6
- Histórico de autocomplete tem "ATACADO CONNECT" com frequência 2
- Quando você digita "Luana" ou "Atacado", a sugestão mais usada (Atacado Games) aparece primeiro

## Solução Completa

### Correção 1: Invalidar cache da query de edição após salvamento

**Arquivo:** `src/pages/admin/proposals/NovaPropostaPage.tsx`

Adicionar invalidação da query específica de edição:

```typescript
// Após salvar (rascunho ou publicar)
queryClient.invalidateQueries({ queryKey: ['proposals'] });
queryClient.invalidateQueries({ queryKey: ['proposal-for-edit', editProposalId] });
```

### Correção 2: Forçar refetch ao abrir página de edição

Adicionar `staleTime: 0` e `refetchOnMount: 'always'` na query de edição:

```typescript
const { data: existingProposal, isLoading: isLoadingProposal } = useQuery({
  queryKey: ['proposal-for-edit', editProposalId],
  queryFn: async () => { /* ... */ },
  enabled: isEditMode,
  staleTime: 0,              // Sempre considerar dados como "stale"
  refetchOnMount: 'always',  // Sempre buscar ao montar componente
});
```

### Correção 3: Desabilitar autocomplete em modo de edição

Quando em modo de edição com `dataLoaded = true`, as sugestões de autocomplete não devem sobrescrever os campos:

```typescript
// Modificar o onSelectSuggestion para respeitar modo de edição
onSelectSuggestion={entry => {
  // NÃO sobrescrever dados em modo de edição
  if (isEditMode && dataLoaded) {
    // Apenas preencher o campo atual, sem tocar nos outros
    setClientData(prev => ({
      ...prev,
      companyName: entry.field_value
    }));
    return;
  }
  // Comportamento normal para nova proposta
  const meta = entry.metadata || {};
  setClientData(prev => ({ ... }));
}}
```

## Arquivos a Modificar

| Arquivo | Mudança | Impacto |
|---------|---------|---------|
| `NovaPropostaPage.tsx` | Adicionar invalidação de cache após salvar | Cache sempre atualizado |
| `NovaPropostaPage.tsx` | Adicionar `staleTime: 0` e `refetchOnMount` na query | Sempre busca dados frescos |
| `NovaPropostaPage.tsx` | Modificar `onSelectSuggestion` para modo edição | Evita sobrescrita acidental |

## Resultado Esperado

1. **Ao salvar** - Cache é invalidado, próxima edição terá dados atualizados
2. **Ao abrir edição** - Sempre busca dados frescos do banco
3. **Em modo edição** - Autocomplete não sobrescreve dados carregados

## Detalhes Técnicos

### Mudança 1: Linhas ~1745-1760 (após sucesso do mutation)

Adicionar após `queryClient.invalidateQueries({ queryKey: ['proposals'] })`:

```typescript
// Invalidar cache específico da proposta editada
if (editProposalId) {
  queryClient.invalidateQueries({ queryKey: ['proposal-for-edit', editProposalId] });
}
```

### Mudança 2: Linhas ~1893-1897 (handleSaveDraft)

Adicionar após invalidar `['proposals']`:

```typescript
// Invalidar cache da proposta em edição
if (editProposalId) {
  queryClient.invalidateQueries({ queryKey: ['proposal-for-edit', editProposalId] });
}
```

### Mudança 3: Linhas ~480-493 (query de edição)

Adicionar parâmetros de cache:

```typescript
const { data: existingProposal, isLoading: isLoadingProposal } = useQuery({
  queryKey: ['proposal-for-edit', editProposalId],
  queryFn: async () => { /* ... */ },
  enabled: isEditMode,
  staleTime: 0,
  refetchOnMount: 'always',
  gcTime: 0,  // Não manter em cache quando componente desmonta
});
```

### Mudança 4: Linhas ~2164-2175, ~2191-2202, ~2262-2273 (onSelectSuggestion)

Modificar cada `onSelectSuggestion` para verificar modo edição:

```typescript
onSelectSuggestion={entry => {
  if (isEditMode && dataLoaded) {
    // Em modo edição, apenas atualizar o campo específico
    setClientData(prev => ({
      ...prev,
      [fieldBeingEdited]: entry.field_value
    }));
    return;
  }
  // Comportamento padrão para nova proposta
  const meta = entry.metadata || {};
  // ... resto do código
}}
```

