
Problema real identificado: a API externa até está funcionando, mas nem toda exclusão de vídeo passa por ela.

O que confirmei na auditoria:
1. A edge function `delete-video-from-external-api` está viva e chama o endpoint externo corretamente.
2. Teste manual funcionou para um vídeo vertical com 1 prédio.
3. Também confirmei nos logs da edge function que ela chamou a API externa para outro pedido vertical com vários prédios.
4. Portanto, o problema não é “a edge function não existe” nem “vertical não é suportado”.

Causa raiz encontrada:
- Existem vários fluxos diferentes de exclusão no sistema.
- Alguns fluxos chamam a edge function antes de apagar do banco.
- Outros apagam direto em `pedido_videos` e nunca chamam a API externa.

Arquivos com problema claro:
- `src/components/admin/approvals/VideoAdminActions.tsx`
  - hoje faz `supabase.from('pedido_videos').delete()` direto
- `src/components/admin/approvals/RealRejectedVideosSection.tsx`
  - hoje faz `supabase.from('pedido_videos').delete()` direto
- `src/hooks/useActiveVideosForAllOrders.tsx`
  - hoje faz `supabase.from('pedido_videos').delete()` direto

Arquivos que já chamam a API externa:
- `src/hooks/useVideoManagement.tsx`
- `src/services/videoActionService.ts`
- `src/services/videoExternalDeletionService.ts`

Outro problema importante:
- A edge function atual usa `Promise.all(...)`.
- Se 1 prédio falha com 404/500 no endpoint externo, a função inteira retorna erro 500, mesmo tendo deletado em vários outros prédios.
- Eu confirmei isso nos logs: houve prédios deletados com sucesso e depois a função abortou ao encontrar um prédio com “Pasta não encontrada no S3”.

Plano de correção:
1. Centralizar a exclusão externa
   - Criar/usar um único helper de exclusão de vídeo que sempre:
     - busca `pedido_id`
     - chama `delete-video-from-external-api`
     - só depois remove do banco
   - Todos os pontos de exclusão devem usar esse helper

2. Corrigir todos os fluxos que hoje deletam direto
   - Atualizar:
     - `src/components/admin/approvals/VideoAdminActions.tsx`
     - `src/components/admin/approvals/RealRejectedVideosSection.tsx`
     - `src/hooks/useActiveVideosForAllOrders.tsx`
   - Esses fluxos hoje bypassam completamente a integração externa

3. Tornar a edge function resiliente
   - Ajustar `supabase/functions/delete-video-from-external-api/index.ts`
   - Em vez de falhar tudo com `Promise.all`, retornar resultado por prédio:
     - sucesso
     - falha
   - A função deve responder sucesso parcial quando alguns prédios falharem
   - Isso evita a falsa impressão de que “não chamou nada” quando na verdade chamou parte dos endpoints

4. Melhorar rastreabilidade
   - Padronizar logs no frontend para mostrar:
     - qual fluxo iniciou a exclusão
     - qual `pedido_video_id`, `video_id` e `pedido_id` foram usados
     - retorno da edge function
   - Assim fica fácil validar no próximo teste de deleção

5. Regra final esperada após implementação
   - Qualquer exclusão de vídeo, horizontal ou vertical, em qualquer tela administrativa ou do anunciante:
     - chama a API externa
     - tenta deletar em todos os prédios do pedido
     - não some silenciosamente sem integrar

Detalhe técnico importante:
- Pelo que vi, seu relato “não chegou nada na API” pode acontecer em dois cenários:
  1. o fluxo usado apaga direto no banco sem chamar a edge function
  2. a edge function chama vários prédios, mas aborta ao primeiro erro e a UI só enxerga falha genérica

Arquivos previstos na implementação:
- `src/components/admin/approvals/VideoAdminActions.tsx`
- `src/components/admin/approvals/RealRejectedVideosSection.tsx`
- `src/hooks/useActiveVideosForAllOrders.tsx`
- possivelmente `src/services/videoExternalDeletionService.ts` ou novo helper compartilhado
- `supabase/functions/delete-video-from-external-api/index.ts`
