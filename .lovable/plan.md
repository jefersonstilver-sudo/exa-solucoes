Auditoria concluída. O problema não é um único detalhe visual: há uma combinação de falhas no cortador mobile, no contrato de sucesso do upload e na estratégia de cache/versionamento.

Diagnóstico principal

1. Cortador de vídeo no iPhone
- O modal usa altura fixa `100dvh`, com preview, botão de play separado, timeline e rodapé. Em Safari/iPhone a barra do navegador e safe areas mudam a altura real durante a interação, causando corte/desalinhamento.
- O botão de play secundário fica entre a área escura do preview e a timeline branca; no print ele aparece parcialmente “engolido” pela transição de containers.
- A geração de thumbnails usa o mesmo `<video>` do preview, fazendo múltiplos seeks sequenciais. Em iPhone isso pode travar, pular frames ou deixar a prévia pouco fluida.
- O corte via `MediaRecorder + canvas.captureStream()` não é confiável no iOS. Quando o browser gera WebM/fallback, o código salva metadados de corte, mas a sincronização externa/AWS baixa e envia o arquivo completo, sem aplicar o corte. Isso pode produzir a sensação de “cortei, mas não foi realmente cortado”.

2. Upload com falso sucesso
- `uploadVideoToStorage()` simula progresso: 10%, 20%, 80%, 95%, 100%. A API atual do Supabase `.upload()` usada aqui não fornece progresso real. Por isso a barra pode “piscar” rápido mesmo em arquivo grande.
- `useOrderVideoManagement.uploadVideo()` abre o popup de sucesso sempre após `baseHook.handleUpload(...)`, sem verificar `result.success === true`.
- `useVideoManagement.handleUpload()` captura erro, mostra toast, mas não relança nem retorna falha explícita em todos os caminhos. Isso permite o pai interpretar erro como sucesso.
- `VideoSlotUpload.handleDirectUpload()` mostra “Upload concluído!” após o `await onUpload(...)`, mesmo se o fluxo interno retornou `{ success: false }` ou `undefined`.
- O email de confirmação busca “pedido mais recente do usuário”, não necessariamente o pedido atual. Isso é perigoso e deve ser corrigido para usar o `orderId` correto.

3. Cache e homepage desatualizada
- `public/_headers` não define `Cache-Control`; só contém headers de segurança. Na publicação, o HTML e rotas podem ser cacheados pelo navegador/CDN.
- `index.html` tenta substituir `__BUILD_ID__`, mas o plugin usa `replace`, substituindo apenas a primeira ocorrência. A segunda ocorrência pode continuar literal, prejudicando o check pré-load em Safari.
- `useVideoConfig()` mantém `staleTime: 5 minutos`; a homepage pode exibir vídeo antigo durante esse período.
- URLs de vídeo vindas do Storage são reutilizadas sem parâmetro de versão (`updated_at`/timestamp). Mesmo com nova URL no banco, o browser pode manter mídia em cache.
- Uploads em Storage usam `cacheControl: '3600'`, aceitável para assets estáveis, mas ruim para mídia crítica que o cliente espera ver atualizada imediatamente.

Plano de correção estrutural

1. Corrigir o layout do cortador mobile
- Atualizar `src/components/video-trimmer/VideoTrimmerModal.tsx` para layout iPhone-first:
  - container com `height: 100svh/100dvh` + fallback seguro;
  - header fixo com safe-area top;
  - preview com altura `clamp(...)` para não invadir timeline;
  - timeline e ações em área própria, sem sobreposição;
  - rodapé sticky com `env(safe-area-inset-bottom)`;
  - remover ou reposicionar o botão play secundário que hoje fica desalinhado; manter play central dentro do vídeo e/ou barra de controle alinhada.
- Ajustar `TrimmerTimeline.tsx` para touch mais estável no iPhone:
  - handles maiores, sem overflow visual;
  - `touch-action` adequado somente na timeline;
  - reduzir alturas e margens em telas de 390px;
  - evitar que a timeline “empurre” o player.

2. Tornar o corte confiável no iOS
- Atualizar `useVideoTrimmer.ts` para separar preview e extração de frames:
  - não usar o mesmo elemento de vídeo para gerar thumbnails e controlar playback;
  - reduzir thumbnails no mobile/iOS para evitar travamento;
  - tratar `video.play()` com `await/catch` e estado de erro claro.
- Para iOS/Safari, evitar vender “corte real” quando o browser não consegue gerar MP4 confiável:
  - se o ambiente não suportar MP4 via MediaRecorder, bloquear com mensagem clara ou preparar fallback seguro;
  - não retornar arquivo original como se estivesse cortado sem garantir que o backend/AWS aplica o corte.
- Preferência estrutural: se for necessário manter corte real em iPhone, adicionar uma Edge Function de processamento/normalização de vídeo ou uma etapa backend compatível. Sem isso, o client-side no Safari continuará frágil.

3. Implementar upload real com progresso real
- Substituir o upload direto `.upload()` em `videoStorageService.ts` por upload TUS/resumível usando `tus-js-client`, que já está no projeto e é obrigatório pela memória do projeto para vídeos.
- Exibir progresso real baseado nos bytes enviados:
  - `bytesUploaded / bytesTotal`;
  - progresso não deve chegar a 100% antes de confirmar Storage + banco;
  - reservar etapas finais para “salvando registro” e “validando envio”.
- Usar um caminho único de upload para pedido mobile e confirmação, evitando duplicação entre `useSimpleVideoUpload` e `useVideoManagement` quando possível.

4. Bloquear falso positivo de sucesso
- Alterar `useVideoManagement.handleUpload()` para:
  - retornar sempre `{ success: true/false, error?: string }`;
  - relançar erros críticos quando necessário;
  - nunca apagar o progresso antes da UI registrar resultado final.
- Alterar `useOrderVideoManagement.uploadVideo()` para abrir `VideoActivationSuccessPopup` somente se `result?.success === true`.
- Alterar `VideoSlotUpload.handleDirectUpload()` para:
  - só mostrar “Upload concluído” se o resultado for sucesso real;
  - se falhar, manter arquivo e título selecionados para o usuário tentar novamente;
  - remover o toast branco/vazio e exibir erro legível no próprio card/modal.
- Validar após o upload:
  - Storage retornou path público válido;
  - linha em `videos` foi criada;
  - linha em `pedido_videos` foi criada/atualizada no slot correto;
  - `loadVideoSlots(orderId)` confirma que o slot contém o novo `video_id`.
- Corrigir envio de email para usar o `orderId` atual, não o pedido mais recente do usuário.

5. Melhorar UX do progresso e estado de erro
- No card do slot, enquanto upload estiver em andamento:
  - bloquear novo envio no mesmo slot;
  - mostrar nome do arquivo, MB enviados/total e percentual real;
  - mostrar etapa atual: “Enviando”, “Salvando no banco”, “Validando”, “Concluído”.
- Em falha:
  - mostrar mensagem persistente no card;
  - não abrir popup de sucesso;
  - não limpar seleção automaticamente;
  - permitir tentar novamente.

6. Cache/versionamento para abrir sempre atualizado
- Atualizar `public/_headers`:
  - `Cache-Control: no-store` para `/`, `/index.html` e rotas HTML;
  - cache longo e imutável somente para `/assets/*` com hash;
  - no-cache para manifesto/Service Worker se existirem.
- Corrigir `vite.config.ts` para usar substituição global (`replaceAll`) em todos os `__BUILD_ID__` do HTML.
- Ajustar `index.html` para não criar reload loops e para checar versão de forma consistente no Safari.
- Ajustar `useForceCacheClear.ts` para:
  - evitar limpar caches agressivamente a cada mount se não houver mudança de versão;
  - limpar e recarregar somente quando a versão remota divergir.
- Ajustar `useVideoConfig.ts`:
  - reduzir/remover `staleTime` para homepage;
  - incluir `updated_at` no select;
  - acrescentar cache-busting nas URLs de `video_principal_url` e `video_secundario_url` com base em `updated_at`.
- Para vídeos da homepage/landing, usar `preload="metadata"` e URL versionada para impedir vídeo antigo.

7. Corrigir Edge Functions relacionadas antes de deploy
- Há Edge Functions ainda importando `https://esm.sh/@supabase/supabase-js@2`, por exemplo `sync-buildings-external-api`. Isso já causou timeout de bundle em outra função.
- Padronizar imports para versão pinada conforme regra do projeto, por exemplo `npm:@supabase/supabase-js@2.49.4` ou versão exata aprovada.
- Garantir `corsHeaders` padrão estrito nas funções alteradas.

Arquivos principais que serão alterados

- `src/components/video-trimmer/VideoTrimmerModal.tsx`
- `src/components/video-trimmer/TrimmerTimeline.tsx`
- `src/components/video-trimmer/useVideoTrimmer.ts`
- `src/components/video-management/VideoSlotUpload.tsx`
- `src/hooks/useVideoManagement.tsx`
- `src/hooks/useOrderVideoManagement.tsx`
- `src/services/videoStorageService.ts`
- `src/services/videoUploadService.ts`
- `src/components/video-management/VideoActivationSuccessPopup.tsx` ou seus gatilhos de abertura
- `src/hooks/useVideoConfig.ts`
- `src/components/exa/sindico/VideoPrincipalSection.tsx`
- `src/components/exa/sindico/VideoSecundarioSection.tsx`
- `src/hooks/useForceCacheClear.ts`
- `vite.config.ts`
- `public/_headers`
- Possivelmente Edge Functions de sync de vídeo se o corte/normalização backend for necessário

Critério de aceite

- No iPhone 390px, o modal de corte abre sem elementos sobrepostos, com play alinhado e timeline utilizável.
- O botão “Cortar e Usar” não retorna arquivo original como “cortado” sem garantia real.
- Upload mostra progresso real por bytes e não pula falsamente para sucesso.
- Popup “Vídeo Enviado” só aparece após Storage + banco + slot confirmados.
- Falha de upload aparece como erro claro e não limpa o arquivo selecionado.
- Homepage carrega vídeo atualizado sem depender de limpar cache manualmente.
- HTML/rotas não ficam presas em cache antigo no iPhone.

Observação importante

A correção será focada apenas no fluxo descrito: corte/upload de vídeo mobile e cache/versionamento. Não vou alterar UI, workflow ou funcionalidades não relacionadas.

<lov-actions>
  <lov-open-history>View History</lov-open-history>
</lov-actions>

<lov-actions>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>