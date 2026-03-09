

# Fix definitivo: `[object Object]` nos prédios + layout + submissão

## Diagnóstico real

Consultei o banco de dados. Cada item de `selected_buildings` é um objeto rico:
```json
{ "building_id": "aefe8faa-...", "building_name": "Bella Vita", "bairro": "Centro", ... }
```

O código atual em `ClientSearchSection.tsx` faz `b?.building_id` para extrair o ID — isso deveria funcionar. **Mas o problema é que `updateField('listaPredios', buildings)` está sendo chamado, e o React pode não ter atualizado o state antes de `OrderConfigSection` renderizar.** Além disso, há uma **segunda fonte do problema**: a linha 135 usa `listaPredios.includes(b.id)` para comparar, e se `listaPredios` contém objetos residuais de renderizações anteriores, o `.includes()` falha silenciosamente.

**Solução definitiva**: sanitizar em TRÊS pontos — extração, renderização e submissão.

## Correções

### 1. `ClientSearchSection.tsx` — Sanitização reforçada + debug log

Adicionar `console.log` para verificar exatamente o que está sendo extraído, e fazer `filter(Boolean)` para remover strings vazias:

```typescript
// Na selectProposal, após extrair buildings:
buildings = proposal.selected_buildings.map((b: any) => {
  if (typeof b === 'string') return b;
  return b?.building_id || b?.id || null;
}).filter((id): id is string => typeof id === 'string' && id.length > 0);

console.log('🏢 Buildings extraídos:', buildings);
```

### 2. `OrderConfigSection.tsx` — Sanitizar na renderização + layout em coluna

**Sanitizar**: Criar uma função helper no topo do componente que converte qualquer entrada em string UUID limpa:

```typescript
const sanitizeId = (rawId: any): string | null => {
  if (typeof rawId === 'string' && rawId.length > 10) return rawId;
  if (typeof rawId === 'object' && rawId !== null) {
    return rawId.building_id || rawId.id || null;
  }
  return null;
};

const cleanBuildingIds = formData.listaPredios
  .map(sanitizeId)
  .filter((id): id is string => id !== null);
```

**Layout**: Trocar chips horizontais por lista vertical limpa com nome do prédio + botão remover:

```text
┌──────────────────────────────────┐
│ 🏢 Bella Vita - Centro      [x] │
│ 🏢 Royal Legacy - Vila Y.   [x] │
│ 🏢 Saint Peter - Centro     [x] │
│ ...                              │
└──────────────────────────────────┘
```

### 3. `useAdminCreateOrder.ts` — Sanitizar `listaPredios` antes de inserir no banco

Na função `submitOrder`, antes do `insert`, limpar o array:

```typescript
const cleanListaPredios = formData.listaPredios
  .map((id: any) => typeof id === 'string' ? id : id?.building_id || id?.id)
  .filter((id): id is string => typeof id === 'string' && id.length > 10);
```

E usar `cleanListaPredios` no insert em vez de `formData.listaPredios`.

### 4. `OrderConfigSection.tsx` — Sincronizar lista suja → lista limpa

Se `cleanBuildingIds.length !== formData.listaPredios.length`, chamar `updateField('listaPredios', cleanBuildingIds)` via `useEffect` para corrigir o state automaticamente na primeira renderização.

| Arquivo | Mudança |
|---------|---------|
| `ClientSearchSection.tsx` | Sanitização reforçada com filter + debug log |
| `OrderConfigSection.tsx` | Helper sanitizeId + layout vertical + useEffect auto-fix |
| `useAdminCreateOrder.ts` | Sanitizar listaPredios antes do insert |

