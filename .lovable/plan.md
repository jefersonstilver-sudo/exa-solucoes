

# Aplicar Conversão MOV→MP4 no Hook de Gestão de Vídeos

## Problema
A conversão MOV→MP4 foi implementada apenas no `useSimpleVideoUpload.ts` (tela de confirmação de pedido). O hook `useVideoManagement.tsx` (usado na tela de gestão de vídeos em `src/pages/advertiser/OrderDetails.tsx`) **não aplica a conversão**, fazendo com que vídeos de iPhone continuem sendo enviados como `.mov` para a API externa.

O vídeo "Kkk" foi enviado por esse fluxo, confirmado pelo formato `video/quicktime` e URL `IMG_6642.mov` no storage.

## Solução

### Arquivo: `src/hooks/useVideoManagement.tsx`

Na função `handleUpload`, adicionar a mesma lógica de conversão já usada no `useSimpleVideoUpload`:

1. Importar `needsConversion` e `convertMovToMp4` de `videoConversionService`
2. Antes de chamar `uploadVideo()`, verificar se o arquivo precisa de conversão
3. Se sim, converter usando `convertMovToMp4()` e usar o arquivo convertido no upload
4. Adicionar um estado `converting` e progresso de conversão para que a UI possa exibir feedback

### Arquivo: `src/pages/advertiser/OrderDetails.tsx`

Verificar se a UI de upload nessa página precisa exibir estado de conversão (barra de progresso "Convertendo..."). Se o componente de upload já suporta callbacks de status, conectar o estado de conversão.

### Escopo
- Apenas adicionar conversão no fluxo de upload existente
- Nenhuma mudança na UI existente além do feedback de conversão
- Nenhuma mudança em banco de dados

