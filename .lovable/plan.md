

# Plano: Garantir que toda exclusão de vídeo chame a API externa

## Causa raiz identificada

Em `src/hooks/useVideoManagement.tsx`, o `handleRemove` (linha 145-210) faz:
1. Busca `slot` do estado React local (tem `video_id`)
2. Faz um SELECT em `pedido_videos` para obter `pedido_id`
3. Se o SELECT retorna dados, chama a edge function
4. Deleta do banco

O problema: **o `orderId` já está disponível na closure do hook** (passado como prop), mas o código faz uma query extra desnecessária para buscar `pedido_id`. Se essa query falha silenciosamente (RLS, timing, etc.), a edge function é pulada mas o delete do banco funciona normalmente.

Além disso, o hook **não usa o helper centralizado** `deleteVideoWithExternalAPI`, criando divergência.

## Correção

### C-01: Migrar `handleRemove` para usar o helper centralizado
**Arquivo**: `src/hooks/useVideoManagement.tsx`

- Remover a lógica inline de chamada da edge function (linhas 168-195)
- Remover o delete inline do banco (linhas 197-200)
- Substituir por chamada a `deleteVideoWithExternalAPI(slotId, slot.video_id, orderId)` passando os 3 parâmetros diretamente (sem query extra)
- Manter as validações de negócio (is_base_video, último vídeo) antes da chamada

### C-02: Melhorar o helper para logs mais claros
**Arquivo**: `src/services/videoDeleteHelper.ts`

- Adicionar logs identificando qual fluxo chamou
- Log explícito quando `video_id` ou `pedido_id` estão ausentes
- Log explícito do resultado da edge function

### C-03: Limpar videoActionService (código morto)
**Arquivo**: `src/services/videoActionService.ts`

- A função `removeVideo` neste arquivo não é importada em nenhum lugar
- Remover ou atualizar para usar o helper centralizado, evitando confusão futura

## Resultado esperado
- Toda exclusão de vídeo (admin ou anunciante, horizontal ou vertical) passa obrigatoriamente pela edge function `delete-video-from-external-api`
- O `orderId` é passado diretamente, sem depender de query extra que pode falhar
- Um único ponto de código para exclusão: `deleteVideoWithExternalAPI`

## Arquivos alterados
1. `src/hooks/useVideoManagement.tsx` — usar helper centralizado com orderId direto
2. `src/services/videoDeleteHelper.ts` — melhorar logs
3. `src/services/videoActionService.ts` — limpar/atualizar removeVideo

