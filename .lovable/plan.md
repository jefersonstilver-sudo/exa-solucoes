

# Auditoria Completa: `tipo_produto` (Vertical vs Horizontal)

## Problemas Encontrados

### 1. `useUserOrdersAndAttempts.ts` -- Campo `tipo_produto` AUSENTE (CONFIRMADO)
- **Arquivo**: `src/hooks/useUserOrdersAndAttempts.ts`
- **Problema**: A interface `UserCompleteOrder` (linha 17-42) **não tem** `tipo_produto`. O mapeamento (linhas 178-197) **não inclui** `tipo_produto`. O `select('*')` traz do banco, mas o campo é descartado no mapeamento manual.
- **Impacto**: O `AdvertiserOrderCard` recebe `item.tipo_produto = undefined` → badge sempre mostra "Horizontal" (fallback).
- **Correção**: Adicionar `tipo_produto?: string` na interface (linha 31) e `tipo_produto: order.tipo_produto || 'horizontal'` no mapeamento (linha 196).

### 2. `VideoSlotGrid.tsx` -- `tipoProduto` NÃO é repassado ao `VideoSlotCard`
- **Arquivo**: `src/components/video-management/VideoSlotGrid.tsx`
- **Problema**: O `VideoSlotGrid` recebe `tipoProduto` como prop (linha 50), mas **nunca** o repassa para o `VideoSlotCard` (linhas 214-230). O `VideoSlotCard` também **não aceita** essa prop na interface (linhas 44-60).
- **Impacto**: O `VideoSlotCard` e seus filhos (`VideoSlotUpload`) não sabem se o pedido é vertical ou horizontal. Porém, a validação real ocorre no `useVideoManagement.tsx` → `videoUploadService.ts` que **já recebe** `tipoProduto` corretamente via `handleUpload`. Portanto, a validação de upload funciona. Contudo, a UI do slot card não exibe informações visuais específicas do tipo (ex: ícone vertical/horizontal por slot).

### 3. `videoSlotService.ts` -- Slots fixos em 10 (OK para ambos)
- **Arquivo**: `src/services/videoSlotService.ts` (linha 89)
- **Status**: Gera 10 slots para todos os pedidos. Conforme `useVideoSpecifications.ts`, ambos os tipos têm `maxVideosPorPedido: 10`. **OK, sem problema.**

### 4. `videoStorageService.ts` -- Validação de orientação e duração (OK)
- **Arquivo**: `src/services/videoStorageService.ts`
- **Status**: Já implementa validação dinâmica por tipo:
  - Horizontal: máx 10s, orientação horizontal
  - Vertical: máx 15s, orientação vertical
- **OK, funcionando corretamente.**

### 5. `videoUploadService.ts` -- Recebe `tipoProduto` (OK)
- **Arquivo**: `src/services/videoUploadService.ts` (linha 23, 103)
- **Status**: Já recebe `tipoProduto` e converte para `'horizontal' | 'vertical'` corretamente na linha 103. **OK.**

### 6. `useVideoManagement.tsx` -- Passa `tipoProduto` para upload (OK)
- **Arquivo**: `src/hooks/useVideoManagement.tsx` (linha 16, 64)
- **Status**: Recebe `tipoProduto` via props e passa para `uploadVideo()`. **OK.**

### 7. `useOrderVideoManagement.tsx` -- Busca `tipo_produto` do banco (OK)
- **Arquivo**: `src/hooks/useOrderVideoManagement.tsx` (linhas 52-63, 305)
- **Status**: Busca `tipo_produto` da tabela `pedidos` e expõe como `tipoProduto`. **OK.**

### 8. `VideoManagementCard.tsx` -- Usa `tipoProduto` para specs (OK)
- **Arquivo**: `src/components/order/VideoManagementCard.tsx` (linhas 49-58)
- **Status**: Determina `isVertical`, busca specs dinâmicas, exibe labels corretas. **OK.**

### 9. `OrderDetails.tsx` (advertiser) -- Passa `tipoProduto` ao card (OK)
- **Arquivo**: `src/pages/advertiser/OrderDetails.tsx` (linha 566)
- **Status**: `tipoProduto={tipoProduto}` passado para `VideoManagementCard`. **OK.**

## Resumo dos Problemas Reais

| # | Arquivo | Problema | Severidade |
|---|---------|----------|------------|
| 1 | `useUserOrdersAndAttempts.ts` | `tipo_produto` não incluído na interface nem no mapeamento → badge no card de listagem sempre mostra "Horizontal" | **Alta** |
| 2 | `VideoSlotGrid.tsx` | `tipoProduto` recebido mas não repassado ao `VideoSlotCard` (cosmético, validação funciona via outro caminho) | **Baixa** |

## Plano de Correção

### Arquivo 1: `src/hooks/useUserOrdersAndAttempts.ts`
1. Adicionar `tipo_produto?: string;` à interface `UserCompleteOrder` (após linha 31)
2. Adicionar `tipo_produto: order.tipo_produto || 'horizontal',` no mapeamento (após linha 196)

### Arquivo 2: `src/components/video-management/VideoSlotGrid.tsx` (opcional, melhoria de consistência)
- Repassar `tipoProduto` ao `VideoSlotCard` para que futuramente o card possa exibir indicadores visuais do tipo de produto.

