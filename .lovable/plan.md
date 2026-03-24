

# Plano: Corrigir nome_pedido e video em exibicao no admin

## Diagnostico com dados reais

### Problema 1: nome_pedido nao aparece na lista
**Causa**: `useOrdersWithAttemptsRefactored.ts` linha 71-93 mapeia os campos de `get_pedidos_com_clientes` mas **nao inclui `nome_pedido`**. O campo existe na RPC, no tipo `OrderOrAttempt`, e no banco - mas nao e mapeado no ponto onde os dados sao formatados.

### Problema 2: video errado mostrado como "EM EXIBICAO"
**Dados do banco (pedido GRUPO KAMMER / fac11754)**:
- `selected_for_display=true` aponta para VIDEO 1 KAMMER (4a83b3c2)
- RPC `get_current_display_video` retorna VIDEO 2 KAMMER (418f4adc) - agendamento ativo

O `ProfessionalOrderReport` (linha 875) usa `video.selected_for_display` para decidir quem esta "EM EXIBICAO". Isso esta errado - a RPC e a fonte da verdade (considera agendamentos).

### Problema 3: ActiveVideosColumn nao encontra videos
O hook `useActiveVideosForAllOrders` filtra por `is_active=true AND selected_for_display=true`. Pedido 3c0ac976: o video que a RPC diz estar exibindo (f9f29c8e / ar condicionado) tem `is_active=false`. Entao a coluna nao o encontra.

### Problema 4: MinimalOrderCard sem preview nem nome
O componente compacto (usado na view padrao) nao exibe `nome_pedido` nem tem qualquer preview de video.

---

## Alteracoes

### 1. Adicionar nome_pedido ao mapeamento de dados
**Arquivo**: `src/hooks/useOrdersWithAttemptsRefactored.ts`

Na funcao `fetchData`, linha 93, adicionar `nome_pedido: pedido.nome_pedido` ao objeto formatado. O campo ja vem da RPC e ja existe no tipo.

### 2. Exibir nome_pedido no MinimalOrderCard
**Arquivo**: `src/components/admin/orders/components/MinimalOrderCard.tsx`

Na area do ID (linhas 72-74): se `item.nome_pedido` existe, mostrar o nome em bold como identificador principal e o `#XXXXXXXX` como subtitulo discreto.

### 3. Adicionar mini preview de video no MinimalOrderCard
**Arquivo**: `src/components/admin/orders/components/MinimalOrderCard.tsx`

- Importar `useOrderCurrentVideoData`
- Para pedidos com status `ativo` ou `video_aprovado`, renderizar um mini `<video autoPlay muted loop playsInline>` de ~80px width antes do bloco de ID/nome
- Se nao tem video, mostrar icone estatico

### 4. Corrigir indicacao de "EM EXIBICAO" no ProfessionalOrderReport
**Arquivo**: `src/components/admin/orders/ProfessionalOrderReport.tsx`

- Importar `useCurrentVideoDisplay`
- Chamar a RPC com o `order.id` para obter o `video_id` real em exibicao
- Substituir a logica `video.selected_for_display` pela comparacao `video.video_data?.id === currentVideoId` para determinar quem recebe o badge "EM EXIBICAO AGORA"
- Isso afeta as linhas 875 e 948-957

### 5. Corrigir ActiveVideosColumn para usar RPC
**Arquivo**: `src/components/admin/orders/ActiveVideosColumn.tsx`

O componente ja importa e usa `useOrderCurrentVideoData` (linha 42) para o mini player. Porem, a lista de videos abaixo (linhas 185-241) vem de `useActiveVideosForAllOrders` que filtra por `selected_for_display + is_active` - inconsistente.

Solucao: se `videoData` da RPC existe mas `orderVideos` (do hook antigo) esta vazio, exibir o video da RPC como unico item ativo. Isso garante que mesmo quando `is_active=false` no banco, o video retornado pela RPC apareca.

### 6. Exibir nome_pedido no OrderMobileCard
**Arquivo**: `src/components/admin/orders/OrderMobileCard.tsx`

Na linha 145 (`#{order.id.substring(0, 8)}`): se `order.nome_pedido` existe, mostrar como titulo principal antes do ID.

### 7. Exibir nome_pedido no EnhancedOrderCard
**Arquivo**: `src/components/admin/orders/components/EnhancedOrderCard.tsx`

Na linha 180 (CardTitle): se `item.nome_pedido` existe, usar como titulo ao inves de "Pedido #XXXXXXXX".

---

## Arquivos alterados

1. `src/hooks/useOrdersWithAttemptsRefactored.ts` - adicionar nome_pedido ao mapeamento
2. `src/components/admin/orders/components/MinimalOrderCard.tsx` - nome + mini preview
3. `src/components/admin/orders/ProfessionalOrderReport.tsx` - usar RPC para "EM EXIBICAO"
4. `src/components/admin/orders/ActiveVideosColumn.tsx` - fallback para RPC
5. `src/components/admin/orders/OrderMobileCard.tsx` - nome_pedido
6. `src/components/admin/orders/components/EnhancedOrderCard.tsx` - nome_pedido

## Ordem de implementacao

1. Fix mapeamento nome_pedido (resolve problema em todos os cards de uma vez)
2. Fix logica de video em exibicao (ProfessionalOrderReport + ActiveVideosColumn)
3. Mini preview no MinimalOrderCard
4. Nome nos cards mobile e enhanced

