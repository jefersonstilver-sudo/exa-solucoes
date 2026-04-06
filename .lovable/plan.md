

# Plano: Correção do Fluxo Master + Badge na Lista de Pedidos

## Problema 1: Vídeo Master não segue pipeline completo

Quando um pedido Master recebe um upload, o vídeo é salvo com `approval_status: 'approved'` mas com `selected_for_display: false` e `is_active: false`. Isso significa que o vídeo fica "aprovado" mas **nunca entra em exibição** — ele não passa pelo `setBaseVideo` que é o responsável por ativá-lo, sincronizar com a API externa (AWS) e colocá-lo nos painéis.

**Correção**: Após o upsert no `pedido_videos`, se o pedido é Master, verificar quantos vídeos ativos existem. Se for o primeiro (ou único) vídeo aprovado, chamar automaticamente o `setBaseVideo` para ativá-lo — exatamente como acontece no fluxo manual quando o admin aprova e o anunciante clica em "Definir como principal".

### Arquivo: `src/services/videoUploadService.ts`
- Após o upsert bem-sucedido (linha ~291), adicionar lógica condicional:
  - Se `approvalStatus === 'approved'` (Master):
    - Buscar o `id` do `pedido_videos` recém-criado
    - Verificar se já existe outro vídeo com `is_base_video: true` no pedido
    - Se NÃO existe base video → chamar `setBaseVideo(pedidoVideoId)` do `videoBaseService`
    - Isso automaticamente: marca como base, seleciona para exibição, ativa, e sincroniza com API externa
  - Se JÁ existe base video → apenas deixar como aprovado (comportamento normal — anunciante escolhe manualmente)

## Problema 2: Badge MASTER ausente na lista de pedidos

O componente `EnhancedOrderCard` (card de cada pedido na lista admin) não recebe nem exibe `is_master`. O tipo `OrderOrAttempt` não tem o campo.

### Arquivos afetados:

1. **`src/types/ordersAndAttempts.ts`**
   - Adicionar `is_master?: boolean` à interface `OrderOrAttempt`

2. **`src/hooks/useOrdersAndAttempts.ts`** (ou equivalente que faz a query)
   - Incluir `is_master` no SELECT da query de pedidos

3. **`src/components/admin/orders/components/EnhancedOrderCard.tsx`**
   - Após o badge de status (linha ~185), adicionar badge MASTER dourado com ícone Crown quando `item.is_master === true`
   - Mesmo visual do `ProfessionalOrderReport`: gradiente amber/yellow, texto amber-950, ícone Crown

## O que NÃO será alterado
- Fluxo de aprovação manual existente
- `setBaseVideo` / `videoBaseService` (apenas chamado, não modificado)
- `ProfessionalOrderReport` (já tem badge MASTER funcionando)
- UI do cliente/anunciante
- Edge Functions existentes

