## Problema

Na página `/super_admin/pedidos` → "Novo Pedido", a lista de Prédios não mostra todos os prédios que aparecem na loja pública. Hoje só carrega `ativo` + `interno`, deixando de fora os `instalacao` (6 prédios atualmente no banco).

A loja pública exibe: **ativo + instalacao + interno**, então a tela de criação de pedido precisa espelhar isso.

## Causa raiz

`src/components/admin/orders/create/OrderConfigSection.tsx` (linha 120):

```ts
.in('status', ['ativo', 'interno'])
```

Falta o status `'instalacao'`.

Confirmado via consulta ao banco: existem 12 ativo, 6 instalacao, 4 interno → total 22. A tela atual só mostra 16.

## Mudança

**Arquivo único:** `src/components/admin/orders/create/OrderConfigSection.tsx`

1. Atualizar o filtro do fetch para incluir os três status:
   ```ts
   .in('status', ['ativo', 'instalacao', 'interno'])
   ```

2. Ajustar a ordenação para: **ativos primeiro → em instalação no meio → internos no final** (ordem alfabética dentro de cada grupo). Internos continuam por último conforme já fazia.

3. Adicionar um pequeno badge "Instalação" (cor âmbar/discreto, mesmo padrão visual do badge "Interno" já existente) ao lado do nome do prédio para o admin identificar facilmente que aquele prédio ainda está em fase de instalação. Sem alterar nenhum outro layout, espaçamento ou comportamento.

## Fora de escopo (não vou tocar)

- Nada na loja pública.
- Nada no `BuildingManagementDialog` (modal de adicionar prédios em pedido existente) — que também filtra por `['ativo','interno']` — a menos que você confirme que quer o mesmo ajuste lá.
- Nenhum outro componente, fluxo ou UI.

## Validação

- Abrir Novo Pedido e conferir que aparecem os 22 prédios (ativos + instalação + internos), com os badges corretos e a ordem ativo → instalação → interno.
