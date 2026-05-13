## Diagnóstico

O fluxo foi invertido na última alteração:

- Hoje o botão **Ver** em `/super_admin/pedidos` tenta abrir direto a visão de cliente dentro de um Sheet/iframe.
- O correto é: **Ver** deve abrir a página administrativa do pedido (`/super_admin/pedidos/:id`), como antes.
- Dentro dessa página de detalhe admin, o botão **Acessar/Entrar como cliente** deve abrir a visão do cliente em um modal/painel flutuante, sem trocar para outra página e sem abrir nova aba.
- O botão `AccessAsClientButton` ainda navega para `/anunciante/...`, então precisa ser ajustado para o modal interno quando usado na página de detalhe do pedido.
- A lista de pedidos também tem possível inconsistência porque `OrdersPage` e `OrdersTabsRefactored` carregam dados separadamente; os filtros/contadores do topo podem não bater com os cards renderizados.

## Plano de correção

### 1. Restaurar o botão Ver

Em `src/pages/admin/OrdersPage.tsx`:

- Remover o estado `clientView` da página de lista.
- Remover o `ClientOrderViewSheet` renderizado na lista.
- Alterar `handleViewOrderDetails` para sempre navegar para:

```text
/super_admin/pedidos/:orderId
```

Isso devolve o comportamento anterior: clicar em **Ver** abre a página funcional de detalhe administrativo do pedido.

### 2. Mover a visão de cliente para dentro do detalhe do pedido

Em `src/pages/admin/OrderDetails.tsx`:

- Adicionar estado local para abrir/fechar o painel de visualização como cliente.
- Manter a página de detalhe admin como está.
- No topo, onde já existe `AccessAsClientButton`, trocar o comportamento para abrir o painel flutuante interno.
- O painel usará o `pedidoId`, `client_id` e nome/email do pedido carregado.

Fluxo final:

```text
Pedidos -> Ver -> Detalhe admin do pedido -> Entrar como cliente -> modal interno com visão do cliente
```

### 3. Ajustar o botão Entrar como cliente para não navegar fora quando for modal

Em `src/components/impersonation/AccessAsClientButton.tsx`:

- Adicionar uma prop opcional, por exemplo `onStartInternalView` ou `mode="internal"`.
- Quando essa prop existir, o botão não fará `navigate('/anunciante/...')`.
- Ele apenas chamará o callback para abrir o painel interno.
- Preservar o comportamento atual em outros lugares que ainda dependem do botão navegando, para não quebrar fluxos fora desse problema.

### 4. Reaproveitar e corrigir o painel interno

Em `src/components/impersonation/ClientOrderViewSheet.tsx`:

- Manter o Sheet como modal flutuante interno.
- Garantir que ele receba `pedidoId` e `clientId` vindos da página de detalhe admin.
- Remover/evitar o botão **Abrir em nova aba**, porque o fluxo pedido é “sem abrir nova página”.
- Corrigir o alerta de acessibilidade do Radix adicionando `SheetTitle` e `SheetDescription` ocultos/adequados.
- Manter `start-impersonation` ao abrir e `end-impersonation` ao fechar.

### 5. Corrigir inconsistência da lista de pedidos

Em `src/components/admin/orders/OrdersTabsRefactored.tsx`:

- Fazer o componente aceitar opcionalmente os dados já carregados pela `OrdersPage` (`ordersAndAttempts`, `loading`, `refetch`).
- A `OrdersPage` passará esses dados para evitar duas buscas independentes.
- Isso mantém cards, filtros, contadores e “Ver” trabalhando sobre a mesma lista.

### 6. Status que não aparecem corretamente

Em `src/components/admin/orders/OrdersTabsRefactored.tsx`:

- Incluir status legados usados no banco nos agrupamentos corretos, especialmente:
  - `pago` e `pago_pendente_video` como aguardando vídeo;
  - manter `aguardando_video` também;
  - `ativo` e/ou `video_aprovado` conforme lógica atual.

Isso evita pedidos sumirem de abas por diferença entre status novo e legado.

## Arquivos previstos

- `src/pages/admin/OrdersPage.tsx`
- `src/pages/admin/OrderDetails.tsx`
- `src/components/impersonation/AccessAsClientButton.tsx`
- `src/components/impersonation/ClientOrderViewSheet.tsx`
- `src/components/admin/orders/OrdersTabsRefactored.tsx`

## Resultado esperado

- Na lista de pedidos, clicar **Ver** abre a página de detalhe admin do pedido, como antes.
- Na página de detalhe, clicar **Entrar/Acessar como cliente** abre a visualização do cliente dentro de um modal/painel na mesma tela.
- Nenhuma nova aba e nenhuma navegação direta para `/anunciante` nesse fluxo do pedido.
- A lista passa a usar uma única fonte de dados, reduzindo pedidos duplicados, ausentes ou fora de status.