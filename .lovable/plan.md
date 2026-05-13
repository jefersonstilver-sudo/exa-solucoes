## Auditoria: por que não funcionou

Encontrei 3 problemas principais no fluxo atual:

1. O botão `Ver` ainda navega para `/super_admin/pedidos/:id`, ou seja, troca de página para o detalhe administrativo. Pelo que você pediu, ao clicar em `Ver` no pedido do cliente, o conteúdo do cliente precisa abrir dentro da própria tela atual, sem sair para outra página.
2. O botão de impersonação foi colocado como navegação para `/anunciante/...`; isso ainda troca o contexto inteiro da aplicação e pode cair em rotas/guards/roles do anunciante, causando a tela aparecer como cliente errado ou não carregar dados.
3. Os cards compactos da lista (`MinimalOrderCard`/`EnhancedOrderCard`) não usam `AccessAsClientButton` diretamente no fluxo do `Ver`; então clicar em `Ver o Duquintão` continua usando detalhe admin, não um modo embutido de cliente.

## Plano de correção

### 1. Trocar o modelo de navegação por painel interno
- Criar um modo interno na tela `/super_admin/pedidos`: `clienteEmVisualizacao`.
- Ao clicar em `Ver` em um pedido, em vez de navegar para outra rota, abrir um painel/drawer/modal grande dentro da própria página de pedidos.
- Esse painel mostrará o pedido do cliente e as ações necessárias sem sair da tela do super_admin.

### 2. Usar impersonação apenas como contexto interno do painel
- O painel chamará `start-impersonation` para registrar a sessão e auditoria.
- Em vez de redirecionar para `/anunciante`, ele renderizará o conteúdo do cliente dentro da janela atual.
- Ao fechar o painel, chamar `end-impersonation` e voltar exatamente para a lista de pedidos, mantendo filtros/posição da página.

### 3. Renderizar o detalhe do pedido do anunciante dentro do painel
- Reaproveitar a página/componente do detalhe do pedido do anunciante sempre que possível.
- Passar o `pedidoId` e o `clientId` efetivos para que as queries usem o cliente correto.
- Evitar depender de `auth.uid()` do anunciante; a sessão real continua sendo a do super_admin, mas os filtros do front usam o cliente alvo.

### 4. Corrigir os cards da lista
- `MinimalOrderCard`, `EnhancedOrderCard`, `OrderMobileCard` e a tabela receberão uma nova callback, algo como `onOpenClientView(orderId, clientId)`.
- O botão `Ver` continuará visualmente igual, mas abrirá o painel interno quando estiver na página de pedidos do super_admin.
- O detalhe administrativo continuará disponível apenas onde já existe fluxo específico de admin, sem quebrar outras telas.

### 5. Bloquear mistura de usuários
- O painel exibirá uma faixa clara: “Visualizando como cliente: [nome/email]”.
- Sidebar/menu do anunciante não será usado nesse fluxo interno, evitando mostrar `jefersonstilver@gmail.com` ou avatar do super_admin.
- Dados serão filtrados por `pedidoId` + `clientId` do pedido selecionado.

### 6. Teste funcional
- Testar em `/super_admin/pedidos`:
  - clicar `Ver` no pedido “Duquintão”;
  - confirmar que abre dentro da mesma página, sem mudar para `/anunciante` nem `/super_admin/pedidos/:id`;
  - confirmar que o nome/email exibido é do cliente do pedido;
  - confirmar que vídeos/upload/ações do pedido aparecem para o pedido correto;
  - fechar o painel e confirmar retorno para a lista sem perder contexto.

## Arquivos que devem ser alterados

- `src/pages/admin/OrdersPage.tsx`
- `src/components/admin/orders/OrdersTabsRefactored.tsx`
- `src/components/admin/orders/components/MinimalOrderCard.tsx`
- `src/components/admin/orders/components/EnhancedOrderCard.tsx`
- `src/components/admin/orders/OrderMobileList.tsx` / `OrderMobileCard.tsx`
- `src/components/impersonation/AccessAsClientButton.tsx` ou novo componente específico para painel interno
- possivelmente `src/pages/advertiser/OrderDetails.tsx`, com ajuste mínimo para aceitar contexto embutido sem depender da rota

## Resultado esperado

Clicar em `Ver` no pedido do cliente abre uma visualização de cliente dentro da própria tela de pedidos do super_admin, sem nova aba, sem troca de página e sem conflito visual de roles.