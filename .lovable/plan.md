

# Corrigir slots de vídeo vertical (layout, player e quantidade)

## Problemas encontrados

1. **Grid sempre 2 colunas** (`VideoSlotGrid.tsx` linha 212): `grid grid-cols-2` independente do tipo de produto. Para vertical, deveria ser layout diferente (cards mais altos, aspect ratio vertical).

2. **Player sempre horizontal** (`VideoSlotCard.tsx` linha 435): `aspect-video` (16:9) hardcoded. Para vídeo vertical deveria ser `aspect-[9/16]`.

3. **Sempre 10 slots** (`videoSlotService.ts` linha 89): Cria 10 slots fixos. Mas o banco diz `max_videos_por_pedido: 1` para vertical_premium e `4` para horizontal. Deveria respeitar o valor do banco.

4. **`tipoProduto` não chega ao `VideoSlotCard`**: O `VideoSlotGrid` recebe `tipoProduto` mas não passa ao `VideoSlotCard`, que por sua vez não passa ao `VideoSlotUpload`.

5. **Instrução hardcoded "até 10 vídeos"** (`VideoManagementCard.tsx` linha 129): Sempre diz "até 10 vídeos" mesmo que o produto permita apenas 1.

## Plano de correção

### 1. `VideoSlotGrid.tsx`
- Passar `tipoProduto` ao `VideoSlotCard`
- Grid condicional: vertical usa `grid-cols-1 sm:grid-cols-2`, horizontal mantém `grid-cols-2`

### 2. `VideoSlotCard.tsx`
- Aceitar prop `tipoProduto?: string`
- Desktop player: usar `aspect-[9/16]` quando vertical, `aspect-video` quando horizontal
- Passar `tipoProduto` ao `VideoSlotUpload`

### 3. `VideoSlotUpload.tsx`
- Aceitar `tipoProduto` para exibir instrução correta ("vídeo vertical" vs "vídeo horizontal")

### 4. `videoSlotService.ts`
- Receber `maxSlots` como parâmetro (default 10)
- Usar `maxSlots` em vez de `10` fixo na criação dos slots

### 5. `useOrderVideoManagement.tsx` / caller do slot service
- Buscar `max_videos_por_pedido` do `produtos_exa` e passar ao slot service

### 6. `VideoManagementCard.tsx`
- Usar `max_videos_por_pedido` dinâmico na instrução em vez de "10"

| Arquivo | Mudança |
|---------|---------|
| `VideoSlotGrid.tsx` | Grid condicional + passar `tipoProduto` |
| `VideoSlotCard.tsx` | Aspect ratio condicional + aceitar `tipoProduto` |
| `VideoSlotUpload.tsx` | Aceitar e exibir tipo de vídeo esperado |
| `videoSlotService.ts` | Respeitar `maxSlots` dinâmico |
| `useOrderVideoManagement.tsx` | Buscar e passar `max_videos_por_pedido` |
| `VideoManagementCard.tsx` | Instrução dinâmica de quantidade |

