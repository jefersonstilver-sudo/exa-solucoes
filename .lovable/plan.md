

# Bug: Barra "Enviando... 0%" fica presa após upload concluído

## Causa raiz

Em `useVideoManagement.tsx` linha 78, após o upload finalizar, o progresso é resetado para `0`:
```ts
setUploadProgress(prev => ({ ...prev, [slotPosition]: 0 }));
```

Porém em `VideoSlotCard.tsx` linha 377, a condição para mostrar a barra é:
```ts
{currentProgress !== undefined && ...}
```

O valor `0` **não é** `undefined`, então a barra permanece visível para sempre mostrando "Enviando... 0%".

## Correção

**`src/hooks/useVideoManagement.tsx`** (linha 78): Em vez de setar `0`, remover a chave do objeto para que `uploadProgress[slotPosition]` retorne `undefined`:

```ts
setUploadProgress(prev => {
  const next = { ...prev };
  delete next[slotPosition];
  return next;
});
```

Mesma correção no bloco `catch` se houver, para garantir que em caso de erro a barra também desapareça.

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useVideoManagement.tsx` | Remover chave do `uploadProgress` em vez de setar `0` no `finally` |

