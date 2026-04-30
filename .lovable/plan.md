## Problema

Em `/super_admin/pedidos` → Novo Pedido, o campo "Valor Total (R$)" só aceita um valor único (à vista, tipo PIX). Como o lançamento financeiro está sendo feito manualmente e existem clientes com pagamento mensal (fidelidade), o admin precisa poder informar:

- Modalidade de cobrança: **À vista** ou **Mensal**
- Quando for **Mensal**: digitar o **valor por mês**, e o sistema calcula automaticamente o **valor total** = `valor mensal × plano (meses)`

O resto do fluxo (ativação manual do pedido, criação do registro) permanece exatamente igual.

## Mudança (mínima e localizada)

### 1. `src/hooks/useAdminCreateOrder.ts`
Adicionar 2 campos no `AdminOrderFormData` (sem quebrar nada existente):

- `tipoCobranca: 'avista' | 'mensal'` (default `'avista'`)
- `valorMensal: number` (default `0`, usado só quando `tipoCobranca === 'mensal'`)

`valorTotal` continua sendo a fonte de verdade que vai pro banco (`pedidos.valor_total`). Quando `tipoCobranca === 'mensal'`, o `valorTotal` é derivado automaticamente de `valorMensal × planoMeses`.

Nada muda na lógica de submit — `valor_total` e `metodo_pagamento` continuam sendo gravados como hoje.

### 2. `src/components/admin/orders/create/OrderConfigSection.tsx`
No grid da linha 281 (Valor / Método / Status), substituir o bloco "Valor Total" por uma UI condicional:

- Novo seletor pequeno **"Tipo de Cobrança"**: `À Vista` | `Mensal (Fidelidade)`
- Se **À Vista** (comportamento atual): campo único `Valor Total (R$)`
- Se **Mensal**: campo `Valor Mensal (R$)` + linha discreta abaixo mostrando `Total: R$ X (valor × N meses)` calculado em tempo real (read-only, vai pro `valorTotal`)

`useEffect` recalcula `valorTotal` automaticamente quando `valorMensal` ou `planoMeses` mudam (no modo mensal).

### 3. `src/components/admin/orders/create/OrderSummary.tsx`
Acrescentar uma linha no resumo: **"Cobrança"** mostrando `À Vista` ou `Mensal — R$ X/mês × N meses`. A linha "Valor" continua mostrando o total final.

## Fora de escopo

- Nenhuma mudança no schema do banco (usa colunas existentes `valor_total` e `metodo_pagamento`).
- Nenhuma mudança no fluxo de checkout público, edge functions, gateway de pagamento, ou no `BuildingManagementDialog`.
- Sem alterar layout/espaçamento dos outros campos. Só o bloco do "Valor" muda.
- Não toca em nenhuma outra UI, comportamento ou workflow.

## Validação

1. Abrir Novo Pedido → selecionar "À Vista" → comportamento idêntico ao atual.
2. Selecionar "Mensal", digitar `R$ 500`, plano `6 meses` → resumo mostra `R$ 3.000` total e `R$ 500/mês × 6`.
3. Mudar plano para `12 meses` com mesmo valor mensal → total atualiza para `R$ 6.000` automaticamente.
4. Confirmar pedido → registro criado normalmente em `pedidos` com `valor_total` correto.
