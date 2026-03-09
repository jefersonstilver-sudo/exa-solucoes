

# Fix: Busca de Propostas quebrada + Design do Sheet

## Problema raiz

A query de `searchProposals` retorna **erro 400** em toda busca porque seleciona `total_amount` — coluna que **não existe** na tabela `proposals`. O erro é silenciosamente ignorado (sem log), retornando array vazio sempre.

Erro do PostgREST: `"column proposals.total_amount does not exist"`

## Correções

### 1. `src/hooks/useAdminCreateOrder.ts` — `searchProposals` (linha 99)

Remover `total_amount` do SELECT. A coluna correta para valor é `cash_total_value` (que já está no SELECT). Também adicionar `error` handling com console.log para debug futuro.

```typescript
.select('id, number, client_name, client_company_name, client_email, client_phone, status, tipo_produto, duration_months, fidel_monthly_value, cash_total_value, selected_buildings')
```

### 2. `src/components/admin/orders/create/ClientSearchSection.tsx` — referência a `total_amount` (linha 186)

Remover fallback para `p.total_amount` no cálculo de valor:
```typescript
const valor = p.cash_total_value || 0;
```

### 3. `src/components/admin/orders/create/AdminCreateOrderDialog.tsx` — Design do Sheet

Aumentar largura do Sheet de `sm:max-w-xl` para `sm:max-w-2xl` para que o conteúdo não fique cortado.

| Arquivo | Ação |
|---------|------|
| `useAdminCreateOrder.ts` | Remover `total_amount` do SELECT |
| `ClientSearchSection.tsx` | Remover fallback `p.total_amount` |
| `AdminCreateOrderDialog.tsx` | Ampliar Sheet para `sm:max-w-2xl` |

