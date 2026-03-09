

# Fix: Busca de Propostas não retorna resultados

## Problema raiz

Linha 101 de `useAdminCreateOrder.ts`:
```typescript
.in('status', ['accepted', 'sent', 'draft'])
```

Os status reais no banco são: `visualizando` (39), `visualizada` (11), `rascunho` (7), `enviada` (6), `atualizada` (2), `expirada` (1). Nenhum match — zero resultados sempre.

## Correções

### 1. `src/hooks/useAdminCreateOrder.ts` (linha 101)
Trocar filtro de status para valores reais do banco:
```typescript
.in('status', ['enviada', 'rascunho', 'visualizada', 'visualizando', 'atualizada'])
```
Exclui apenas `expirada` (não faz sentido criar pedido de proposta expirada).

### 2. `src/components/admin/orders/create/ClientSearchSection.tsx` (linhas 131-138)
Atualizar `getStatusLabel` para mapear os status em português:
- `enviada` → azul "Enviada"
- `rascunho` → âmbar "Rascunho"
- `visualizada` → azul claro "Visualizada"
- `visualizando` → verde "Visualizando"
- `atualizada` → azul "Atualizada"

2 arquivos, 2 edições simples.

