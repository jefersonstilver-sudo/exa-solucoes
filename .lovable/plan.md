

# Fix: Nome duplicado e ícone inconsistente nos recibos de notificação

## Problema

O nome do contato aparece **duas vezes** em cada recibo:
1. Na linha principal (linha 1128): `receipt.contact_name`
2. No label de status (linha 810): `${name} confirmou às ...`

Resultado: "Blenda TRABALHO  Blenda TRABALHO confirmou às 17:23 de 09/03"

## Correção

### `src/components/admin/agenda/EditTaskModal.tsx`

**`getReceiptStatusLabel`** (linha 808-815): Remover o nome do label — já está exibido ao lado. Ficar apenas:
- `read` → `confirmou às 17:23 de 09/03`
- `delivered` → `Entregue`
- `sent` → `Enviado`

Isso resolve tanto a duplicação do nome quanto simplifica a leitura visual.

1 arquivo, 1 linha alterada.

