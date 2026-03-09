

# Fix definitivo: `[object Object]` persistente nos prédios

## Causa raiz identificada

O `sanitizeBuildingId` considera válida qualquer string com `length > 10`. Porém, `"[object Object]"` tem 15 caracteres — então passa o filtro como se fosse um UUID válido. O `useEffect` auto-fix também não detecta porque `typeof === 'string'` é true.

Isso significa que uma vez que um objeto vaza para o state como string `"[object Object]"`, **nunca mais é limpo**.

## Correções

### 1. `OrderConfigSection.tsx` — Sanitização com validação de UUID

Reescrever `sanitizeBuildingId` para validar formato UUID:

```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sanitizeBuildingId = (rawId: any): string | null => {
  if (typeof rawId === 'string') {
    return UUID_REGEX.test(rawId) ? rawId : null;
  }
  if (typeof rawId === 'object' && rawId !== null) {
    const extracted = rawId.building_id || rawId.id;
    return typeof extracted === 'string' && UUID_REGEX.test(extracted) ? extracted : null;
  }
  return null;
};
```

Atualizar o `useEffect` auto-fix para detectar IDs que não são UUIDs válidos:

```typescript
useEffect(() => {
  if (formData.listaPredios.length === 0) return;
  const clean = formData.listaPredios
    .map(sanitizeBuildingId)
    .filter((id): id is string => id !== null);
  // Se algum ID foi removido/corrigido, atualizar o state
  if (clean.length !== formData.listaPredios.length || 
      clean.some((id, i) => id !== formData.listaPredios[i])) {
    updateField('listaPredios', clean);
  }
}, [formData.listaPredios]);
```

### 2. `ClientSearchSection.tsx` — Mesma validação UUID na extração

Usar regex UUID no `selectProposal` para garantir que só IDs válidos entram no state:

```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-...-[0-9a-f]{12}$/i;

buildings = rawBuildings
  .map((b: any) => typeof b === 'string' ? b : b?.building_id || b?.id || null)
  .filter((id): id is string => typeof id === 'string' && UUID_REGEX.test(id));
```

### 3. `useAdminCreateOrder.ts` — Mesma limpeza no submit

Linha 231 — aplicar filtro UUID no `lista_predios` antes do insert.

| Arquivo | Mudança |
|---------|---------|
| `OrderConfigSection.tsx` | UUID regex no sanitizer + useEffect melhorado |
| `ClientSearchSection.tsx` | UUID regex no filtro de extração |
| `useAdminCreateOrder.ts` | UUID regex no submit |

