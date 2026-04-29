Auditoria concluída. O problema não é mais o limite de 10 slots: essa parte está correta no banco.

Diagnóstico principal

1. O erro atual vem do fluxo de corte + revalidação
- No replay, o vídeo foi cortado no modal e virou `wizard_trimmed.mp4`.
- Em mobile/iOS/Safari, o trimmer não recodifica o arquivo; ele retorna o arquivo original com metadados internos `_trimStart` e `_trimEnd`.
- Depois disso, `uploadVideoService.ts` chama `validateVideoFile()` de novo no arquivo físico.
- Como o arquivo físico continua com a duração original, a validação volta a reprovar o vídeo por duração.
- Esse erro não chega corretamente até a tela, então a UI mostra apenas: `Falha no upload do vídeo`.

Fluxo quebrado atual:
```text
Seleciona vídeo longo
  -> abre trimmer
  -> iPhone/Safari retorna arquivo original + metadados de corte
  -> upload revalida arquivo original
  -> reprova duração novamente
  -> erro genérico na tela
```

2. Os metadados de corte ainda não são aplicados de ponta a ponta
- O banco já tem `videos.trim_start_seconds` e `videos.trim_end_seconds`.
- O upload salva esses campos quando eles existem.
- Porém a API externa `upload-video-to-external-api` baixa e envia o arquivo inteiro do Supabase Storage.
- Ou seja: mesmo quando o upload passa, o corte metadata-only não corta fisicamente o vídeo antes de enviar para os dispositivos.
- Isso explica o comportamento estrutural: no mobile tenta “cortar”, mas o sistema ainda pode tratar o vídeo como original em fases posteriores.

3. O banco/Storage para esse pedido específico está consistente
Pedido atual: `55570ca6-a8c7-44b3-8a1b-656f3002874b`
- `status`: `ativo`
- `tipo_produto`: `horizontal`
- `is_master`: `true`
- `max_videos_por_pedido`: `10`
- Constraint atual: `pedido_videos_slot_position_check` permite `1..10`
- Bucket `videos`: existe, público, limite 100MB.
- Slots atuais do pedido: 1, 2 e 3 preenchidos. Slot 4 estava vazio no momento da auditoria.

4. Há também um risco no TUS mobile
O upload usa TUS primeiro e fallback padrão depois. Isso é correto, mas no iOS precisa ser mais conservador:
- chunk atual: 6MB
- timeout/retry pouco específico
- erro final pode ser engolido pelo wrapper e virar mensagem genérica

5. O modal mobile ainda tem fragilidade de layout
O modal foi ajustado com `100svh`, mas continua com preview/timeline/actions disputando altura em iPhone. O problema visual relatado tem duas causas prováveis:
- geração de thumbnails ainda faz seeks múltiplos no mesmo `<video>`, pesado no Safari;
- layout usa uma timeline complexa com zoom/drag que é excessiva para mobile.

Plano de correção estrutural

1. Corrigir a validação pós-trimmer
- Detectar quando o arquivo tem `_trimStart` e `_trimEnd`.
- Nesses casos, validar a duração efetiva do corte, não a duração física do arquivo original.
- Exemplo: se o original tem 30s, mas `_trimStart=5` e `_trimEnd=15`, a duração efetiva deve ser 10s.
- Salvar `duracao` no banco como duração efetiva do trecho, não como duração original.

2. Separar estratégia por plataforma
- iOS/Safari/mobile: usar modo “seleção de trecho” metadata-only, sem tentar recodificar no browser.
- Desktop/Chrome: pode continuar recodificando, mas com fallback explícito para metadata-only quando gerar WebM ou falhar.
- A tela deve informar claramente quando será usado “Trecho selecionado: 10s” em vez de “arquivo cortado fisicamente”.

3. Aplicar o corte antes de enviar à API externa
- Atualizar `supabase/functions/upload-video-to-external-api/index.ts` para ler `trim_start_seconds` e `trim_end_seconds`.
- Se houver corte metadata-only, criar um arquivo final MP4 cortado antes do envio aos dispositivos.
- Como Edge Function não deve depender de recorte pesado se não houver FFmpeg garantido, há duas opções técnicas:
  - Opção A: chamar um endpoint/serviço de processamento de vídeo já existente/externo antes do envio;
  - Opção B: bloquear metadata-only para envio externo até haver corte físico e orientar o usuário a enviar vídeo já dentro da duração.
- Minha recomendação: implementar agora a correção segura de upload e salvar metadados corretamente, e na função externa pelo menos bloquear envio de vídeo metadata-only sem corte físico com mensagem técnica clara, para não mandar original errado aos painéis.

4. Melhorar mensagens de erro no frontend
- `useOrderVideoManagement.tsx` não deve transformar tudo em `Falha no upload do vídeo`.
- Propagar o erro real: duração, permissão, Storage, RLS, slot, TUS, validação ou API externa.
- Isso evita falsa auditoria no futuro.

5. Refatorar o trimmer mobile para UX estável no iPhone
- Criar um layout mobile específico, mais simples:
```text
Header fixo
Preview com altura limitada
Controles de play centralizados
Slider nativo para escolher início
Resumo: 0:05 até 0:15 / 10s
Botões fixos no rodapé com safe-area
```
- Remover zoom da timeline em mobile.
- Reduzir thumbnails em iOS ou usar placeholder/frames mínimos.
- Garantir botões com 44px+ e alinhamento central.

6. Hardening do upload TUS
- Reduzir chunk em mobile para 1–2MB.
- Usar erro específico quando TUS falhar e fallback padrão também falhar.
- Não tentar upload se a validação efetiva já sabe que o vídeo não será aceito.

7. Correção de cache dos painéis/dispositivos
- O app já remove service workers e caches da aplicação, mas o cache de vídeo em IndexedDB (`exa_video_cache`) pode continuar servindo blobs antigos por `videoId`.
- Atualizar o cache para invalidar também quando a `video_url` mudar, não apenas quando o `videoId` existe.
- Isso evita painéis/dispositivos mostrarem vídeo desatualizado.

Arquivos a alterar após aprovação

- `src/services/videoUploadService.ts`
- `src/services/videoStorageService.ts`
- `src/hooks/useOrderVideoManagement.tsx`
- `src/hooks/useVideoManagement.tsx`
- `src/components/video-trimmer/useVideoTrimmer.ts`
- `src/components/video-trimmer/VideoTrimmerModal.tsx`
- `src/components/video-trimmer/TrimmerTimeline.tsx`
- `src/utils/videoCache.ts`
- `supabase/functions/upload-video-to-external-api/index.ts`

Links úteis para conferência no Supabase

<lov-actions>
<lov-link url="https://supabase.com/dashboard/project/aakenoljsycyrcrchgxj/storage/buckets">Supabase Storage</lov-link>
<lov-link url="https://supabase.com/dashboard/project/aakenoljsycyrcrchgxj/functions/upload-video-to-external-api/logs">Logs da função de envio externo</lov-link>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>