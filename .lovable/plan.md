

# Plano: Card maior, agrupamento por email e exibicao de paineis

## O que sera feito

### 1. Aumentar o MinimalOrderCard
**Arquivo**: `src/components/admin/orders/components/MinimalOrderCard.tsx`

O card atual usa `p-3` e layout horizontal comprimido. Mudancas:
- Padding maior (`p-4`)
- Preview de video maior (`w-28` ao inves de `w-20`)
- Nome do pedido com fonte maior (`text-base font-bold`)
- Separacao visual com grid/rows mais espacados
- Informacoes de cliente com mais destaque

### 2. Mostrar numeros dos paineis para super_admin
**Arquivo**: `src/components/admin/orders/components/MinimalOrderCard.tsx`

- Receber prop `isSuperAdmin` (ja disponivel no pai `OrdersTabsRefactored`)
- Quando `isSuperAdmin === true`, exibir `lista_paineis` como badges com os IDs truncados (primeiros 8 chars) ao lado da contagem
- Isso inclui paineis de predios ativos da loja publica E internos (todos que estao em `lista_paineis`)

### 3. Agrupamento por email/conta do cliente
**Arquivo**: `src/components/admin/orders/OrdersTabsRefactored.tsx`

- Adicionar opcao de agrupamento no header (ao lado do SortSelector): botao toggle "Agrupar por cliente"
- Quando ativado, os pedidos sao agrupados por `client_email`
- Cada grupo renderiza um header com: nome do cliente, email, quantidade de pedidos
- Dentro do grupo, os cards aparecem normalmente (MinimalOrderCard ou EnhancedOrderCard)
- Collapsible por grupo (aberto por padrao)

## Arquivos alterados

1. `src/components/admin/orders/components/MinimalOrderCard.tsx` - card maior + paineis para super_admin
2. `src/components/admin/orders/OrdersTabsRefactored.tsx` - logica de agrupamento por email + passar `isSuperAdmin` ao MinimalOrderCard

