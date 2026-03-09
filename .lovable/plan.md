

# Fix: Formulário de Novo Pedido - Layout centralizado + Debug busca

## Problemas identificados

1. **Layout**: Usa `Sheet` (painel lateral direito) - o usuário quer um **Dialog centralizado** ocupando quase a tela toda
2. **Busca de propostas**: A query parece correta após o fix anterior, mas falta **error logging** - erros são silenciosamente ignorados (linha 97-104 do hook), impossibilitando debug
3. **Referência residual**: `ClientSearchSection.tsx` linha 79 ainda tem fallback para `proposal.total_amount`

## Correções

### 1. `AdminCreateOrderDialog.tsx` — Trocar Sheet por Dialog centralizado

Substituir `Sheet/SheetContent` por `Dialog/DialogContent` com largura `max-w-6xl` (quase tela inteira), centralizado. Layout interno em **2 colunas**: formulário à esquerda, resumo à direita.

```text
┌─────────────────────────────────────────────────┐
│  Novo Pedido                                    │
├───────────────────────────┬─────────────────────┤
│  1. Cliente               │  Resumo do Pedido   │
│  2. Produto               │  Cliente: ...       │
│  3. Configuração          │  Produto: ...       │
│                           │  Prédios: ...       │
│                           │  Valor: ...         │
├───────────────────────────┴─────────────────────┤
│              [Confirmar Pedido]                  │
└─────────────────────────────────────────────────┘
```

### 2. `useAdminCreateOrder.ts` — Adicionar error logging

Na função `searchProposals`, capturar e logar o erro para identificar falhas:

```typescript
const { data, error } = await supabase.from('proposals')...
if (error) {
  console.error('❌ Erro ao buscar propostas:', error);
  return [];
}
return data || [];
```

### 3. `ClientSearchSection.tsx` — Remover fallback `total_amount`

Linha 79: `proposal.cash_total_value || proposal.total_amount || 0` → `proposal.cash_total_value || 0`

| Arquivo | Mudança |
|---------|---------|
| `AdminCreateOrderDialog.tsx` | Sheet → Dialog centralizado max-w-6xl, layout 2 colunas |
| `useAdminCreateOrder.ts` | Adicionar error logging em searchProposals |
| `ClientSearchSection.tsx` | Remover fallback total_amount |

