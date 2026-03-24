

# Plano: Nome do Pedido em Destaque

## Situacao atual
- O campo `nome_pedido` existe no banco e no tipo `OrderDetails`
- O componente `OrderNameEdit` existe e funciona (usa RPC `set_pedido_nome`), mas **nunca e renderizado** na pagina de detalhes
- O card na listagem (`AdvertiserOrderCard`) ja exibe `nome_pedido` quando existe, mas sem destaque visual claro
- O header da pagina de detalhes mostra apenas "Detalhes do Pedido" + codigo truncado

## Alteracoes

### 1. Integrar OrderNameEdit no header da pagina de detalhes
**Arquivo**: `src/pages/advertiser/OrderDetails.tsx`

- Substituir o header estatico (linhas 500-503) por um header que:
  - Se `nome_pedido` existe: exibe o nome grande e em destaque, com o codigo `#3c0ac976` pequeno abaixo como subtitulo
  - Se nao existe: exibe "Detalhes do Pedido" com botao inline para adicionar nome
- Renderizar `<OrderNameEdit>` logo abaixo do titulo, permitindo edicao inline
- Ao salvar, atualizar o state local para refletir imediatamente

### 2. Melhorar destaque do nome na listagem de pedidos
**Arquivo**: `src/components/advertiser/orders/AdvertiserOrderCard.tsx`

- Quando `nome_pedido` existe:
  - Nome em fonte maior e bold como titulo principal do card
  - Codigo `#XXXXXXXX` vira badge/tag discreta ao lado
- Quando nao existe: manter comportamento atual (Campanha #XXXXXXXX)

### 3. Limpar import nao utilizado
**Arquivo**: `src/pages/advertiser/OrderDetails.tsx`
- O import de `OrderNameEdit` ja existe mas nao e usado — agora sera usado

## Resultado esperado
- Na pagina de detalhes: nome do pedido em destaque no topo, editavel inline
- Na listagem: nome do pedido como titulo principal do card, codigo como detalhe secundario
- Facilita gestao por areas, predios e grupos como o usuario precisa

## Arquivos alterados
1. `src/pages/advertiser/OrderDetails.tsx` — header com nome editavel
2. `src/components/advertiser/orders/AdvertiserOrderCard.tsx` — destaque visual do nome

