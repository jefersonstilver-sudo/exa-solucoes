

# Fix: Pedido manual nao sendo criado + atualização na tela

## Diagnóstico

Analisei os logs e o banco. A conta do Mauricio (`gadm@rafainchurrascaria.com.br`) **foi criada com sucesso** (user `da2eae6b`), mas **nenhum pedido novo foi inserido** no banco (apenas 2 pedidos antigos existem).

### Causa raiz: CORS no `admin-update-user`

A edge function `admin-update-user` tem CORS incompleto — falta os headers `x-supabase-client-platform*` que o client SDK envia:

```
// admin-update-user (INCOMPLETO):
'authorization, x-client-info, apikey, content-type'

// create-client-account (CORRETO):  
'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, ...'
```

Isso causa falha silenciosa no `checkAccountStatus` durante o `selectProposal`. Embora o código tenha try-catch, a chamada pode estar causando um erro que impede o fluxo completo de submissão.

Adicionalmente, o `submitOrder` não verifica se o pedido foi realmente inserido e o `queryClient.invalidateQueries` pode não estar atingindo todas as queries usadas na tela de pedidos.

## Correções

### 1. `admin-update-user/index.ts` — Corrigir CORS headers
Adicionar os headers x-supabase-* que faltam, alinhando com `create-client-account`.

### 2. `useAdminCreateOrder.ts` — Melhorar error handling + invalidar mais queries
- Adicionar `console.log` em cada etapa do `submitOrder` para rastreamento
- Invalidar TODAS as queries de pedidos usadas nos diferentes componentes da tela:
  - `orders`, `orders-attempts-refactored`, `enhanced-orders`, `real-orders`

### 3. `AdminCreateOrderDialog.tsx` — Forçar refetch após sucesso
Chamar `onSuccess` que deve triggar um refetch explícito nos dados da tela.

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/admin-update-user/index.ts` | Corrigir CORS headers |
| `src/hooks/useAdminCreateOrder.ts` | Debug logs + invalidar mais queries |
| `src/components/admin/orders/create/AdminCreateOrderDialog.tsx` | Sem mudança necessária |

