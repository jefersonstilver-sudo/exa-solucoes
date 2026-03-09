

# Fix: Erro `id.slice is not a function` + UX ao selecionar proposta

## Problema

Quando uma proposta é selecionada, `selected_buildings` pode conter objetos em vez de strings. Ao popular `listaPredios` com esses objetos, `OrderConfigSection.tsx` linha 118 chama `id.slice(0, 8)` num objeto, causando o crash.

## Correções

### 1. `OrderConfigSection.tsx` — Proteger contra id não-string

Linha 118: adicionar `String(id).slice(0, 8)` como fallback seguro, e filtrar `listaPredios` para garantir que só contenha strings.

```typescript
{formData.listaPredios.map(id => {
  const idStr = typeof id === 'string' ? id : String(id);
  const b = buildings.find(x => x.id === idStr);
  return (
    <span key={idStr} ...>
      {b?.codigo_predio || b?.nome?.slice(0, 15) || idStr.slice(0, 8)}
      <button onClick={() => toggleBuilding(idStr)}>...</button>
    </span>
  );
})}
```

### 2. `ClientSearchSection.tsx` — Garantir que buildings parseados são strings

Na função `handleSelectProposal` (linhas 82-97), ao parsear `selected_buildings`, extrair o `id` se for objeto:

```typescript
if (Array.isArray(proposal.selected_buildings)) {
  buildings = proposal.selected_buildings.map(b => 
    typeof b === 'string' ? b : b?.id || String(b)
  );
}
```

### 3. `ClientSearchSection.tsx` — Feedback visual ao selecionar proposta

Após selecionar uma proposta, mostrar um breve indicador de sucesso (toast ou highlight) para que o usuário saiba que os campos foram preenchidos. Usar `toast.success('Proposta carregada com sucesso')` do sonner.

| Arquivo | Mudança |
|---------|---------|
| `OrderConfigSection.tsx` | Proteger `id.slice` contra valores não-string |
| `ClientSearchSection.tsx` | Normalizar buildings para strings + feedback visual |

