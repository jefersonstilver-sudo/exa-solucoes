
Diagnóstico confirmado

- O pedido `96a25761...` está com `is_master = true` no banco.
- A Edge Function `toggle-pedido-master` funcionou: os logs confirmam a ativação do MASTER.
- O badge não aparece em todos os cards porque hoje ele só existe no `EnhancedOrderCard`. A tela admin usa principalmente `MinimalOrderCard` e no mobile usa `OrderMobileCard`, ambos sem badge.
- Na área do anunciante, o hook `useUserOrdersAndAttempts.ts` não propaga `is_master` para o card, e `AdvertiserOrderCard.tsx` também não renderiza esse badge.
- O problema do upload é real: no mesmo pedido existe um vídeo novo salvo como `pending`, mesmo com o pedido marcado como master.
- O preview do vídeo em exibição parece estar saudável neste momento: os logs mostram a RPC `get_current_display_video` retornando o vídeo atual e o replay mostra o player iniciando. Então eu não mudaria essa parte agora para não mexer em fluxo que já parece correto.

Plano de correção

1. Corrigir a propagação do campo `is_master`
- `src/hooks/useUserOrdersAndAttempts.ts`
  - adicionar `is_master` no tipo `UserCompleteOrder`;
  - mapear `order.is_master` em `processedOrders`.

2. Exibir o badge MASTER em todos os cards certos
- `src/components/advertiser/orders/AdvertiserOrderCard.tsx`: adicionar badge dourado MASTER ao lado dos badges de produto/status.
- `src/components/admin/orders/components/MinimalOrderCard.tsx`: adicionar o mesmo badge.
- `src/components/admin/orders/OrderMobileCard.tsx`: adicionar o mesmo badge no card mobile.
- `EnhancedOrderCard.tsx` já está certo, então só manter.

3. Tornar a autoaprovação master realmente confiável
- `src/services/videoUploadService.ts`
  - reforçar a leitura de `pedidos.is_master`;
  - após o upsert, validar o estado salvo em `pedido_videos`;
  - se o pedido for master e o slot vier `pending`, corrigir explicitamente para `approved`;
  - manter a regra de fluxo normal:
    - se não existe vídeo base, chamar `setBaseVideo`;
    - se já existe vídeo base, deixar o novo vídeo apenas aprovado, sem trocar automaticamente o vídeo em exibição.
- Hardening direto do bug: adicionar uma salvaguarda no banco para que vídeo de pedido master não consiga persistir como `pending`, mesmo se outro caminho de upload passar fora do fluxo esperado.

4. Corrigir a mensagem errada depois do upload
- Hoje o popup de sucesso sempre fala como se o vídeo tivesse ido para aprovação manual.
- `src/hooks/useOrderVideoManagement.tsx` + `src/components/video-management/VideoActivationSuccessPopup.tsx`
  - passar o resultado real do upload;
  - para pedido master mostrar “aprovado automaticamente”;
  - se ele também virar base/ativo, mostrar que já entrou em exibição;
  - para pedido normal, manter o texto atual de análise/aprovação.

5. Validação final
- Admin: conferir badge MASTER no modo minimal, detailed e mobile.
- Anunciante: conferir badge MASTER no card da campanha.
- Upload em pedido master com base já existente: novo vídeo deve ficar `approved` imediatamente e não mostrar mensagem de aprovação manual.
- Upload em pedido master sem base: deve seguir o fluxo completo e entrar em exibição.
- Upload em pedido não-master: deve continuar exigindo aprovação normalmente.

Arquivos principais

- `src/hooks/useUserOrdersAndAttempts.ts`
- `src/components/advertiser/orders/AdvertiserOrderCard.tsx`
- `src/components/admin/orders/components/MinimalOrderCard.tsx`
- `src/components/admin/orders/OrderMobileCard.tsx`
- `src/services/videoUploadService.ts`
- `src/hooks/useOrderVideoManagement.tsx`
- `src/components/video-management/VideoActivationSuccessPopup.tsx`
- migração SQL pequena para blindar a regra master no banco
