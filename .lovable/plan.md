Diagnóstico confirmado

O erro atual não é apenas visual. O upload chega no Supabase Storage, o registro também pode chegar na tabela `videos`, mas o sistema falha ao vincular o vídeo ao slot do pedido em `pedido_videos`. Por isso o frontend retorna `Falha no upload do vídeo` e o usuário vê que “a API recebeu”, mas o pedido não aceita o envio.

Principais achados:

1. O pedido atual da tela é `55570ca6-a8c7-44b3-8a1b-656f3002874b`.
   - `status`: `ativo`
   - `tipo_produto`: `horizontal`
   - `client_id`: `6b744524-f60c-4d12-bd2c-8df65600361e`
   - slots preenchidos atualmente: 1, 2 e 3.

2. O banco ainda tem uma constraint antiga:
   - `pedido_videos_slot_position_check`
   - regra atual: `slot_position >= 1 AND slot_position <= 4`

3. O frontend foi preparado para até 10 slots:
   - `videoUploadService.ts` aceita `slotPosition` até 10.
   - `videoSlotService.ts` monta até 10 slots.
   - memória do projeto: máximo 10 slots por pedido.

4. A configuração do produto horizontal no banco ainda está em 4:
   - `produtos_exa.codigo = 'horizontal'`
   - `max_videos_por_pedido = 4`

5. No print, o usuário está tentando enviar no Slot 5.
   - Esse slot não é aceito pela constraint do banco.
   - Resultado: o arquivo sobe para Storage, mas o vínculo em `pedido_videos` falha.
   - A mensagem genérica no frontend esconde a causa real.

6. Existe também risco de lixo operacional:
   - quando Storage e `videos` são criados, mas `pedido_videos` falha, ficam objetos e registros órfãos.

7. O módulo de corte mobile continua frágil porque usa Canvas + MediaRecorder no navegador.
   - Em iPhone/Safari isso é instável, especialmente para MP4/MOV.
   - O fallback atual pode devolver o arquivo original ou um MP4/codec inconsistente, criando sensação de corte corrompido.
   - A timeline gera miniaturas e faz seeks em sequência no mesmo `<video>`, o que costuma travar em iOS.

Plano de correção estrutural

Etapa 1 — Corrigir limite real de slots no banco

Criar migração para alinhar banco e frontend:

- Remover/recriar `pedido_videos_slot_position_check` para aceitar `1..10`.
- Atualizar `produtos_exa.max_videos_por_pedido` do produto `horizontal` para 10, mantendo `vertical_premium` conforme regra atual.
- Não alterar fluxos não relacionados.

Resultado esperado:

- Slot 5 até Slot 10 deixam de falhar no banco.
- O frontend para de mostrar slot que o banco rejeita.

Etapa 2 — Tornar o upload transacional do ponto de vista do usuário

Refatorar `src/services/videoUploadService.ts` para:

- Detectar explicitamente erro de constraint de slot e mostrar mensagem correta, em vez de “Falha no upload do vídeo”.
- Se o upload para Storage ou insert em `videos` já tiver acontecido, mas o upsert em `pedido_videos` falhar:
  - remover o arquivo recém-enviado do Storage quando possível;
  - evitar deixar registro `videos` órfão quando possível;
  - retornar erro claro para o usuário.
- Preservar o comportamento atual de pedidos master, aprovação automática e seleção de base.

Resultado esperado:

- Nada de “a API recebeu mas o sistema não aceitou” sem explicação.
- Menos objetos órfãos no Supabase.
- Erros reais aparecem com causa rastreável.

Etapa 3 — Melhorar validação antes de enviar arquivo grande

Antes do upload para Storage, validar:

- se `slotPosition` está dentro do limite real permitido para o pedido/produto;
- se o pedido está liberado para upload;
- se o slot existe ou pode ser criado.

Resultado esperado:

- O sistema bloqueia erro estrutural antes de gastar banda subindo vídeo.
- No mobile, evita o usuário esperar upload para só depois receber erro.

Etapa 4 — Refatorar o cortador mobile sem quebrar desktop

Ajustar `src/components/video-trimmer/useVideoTrimmer.ts` e `VideoTrimmerModal.tsx` com estratégia específica para iPhone/Safari:

- Detectar iOS/Safari.
- Em iOS, priorizar seleção de trecho por metadados (`trim_start_seconds`, `trim_end_seconds`) em vez de reencodar com MediaRecorder/Canvas no browser.
- Evitar geração pesada de muitas thumbnails no iPhone; usar timeline leve quando necessário.
- Garantir que o botão de play fique centralizado e não capture/atrapalhe gestos da timeline.
- Garantir layout com `100svh`, safe-area e área de ação sempre visível.

Importante: essa etapa não cria processamento backend FFmpeg ainda; ela estabiliza o fluxo mobile atual sem fingir que o iPhone reencodou perfeitamente. O arquivo enviado poderá carregar metadados de corte para que o sistema saiba qual trecho deve valer.

Etapa 5 — Melhorar feedback de upload no frontend

Em `VideoSlotUpload.tsx`, `useVideoManagement.tsx` e `useOrderVideoManagement.tsx`:

- Propagar a mensagem real retornada pelo serviço.
- Não trocar erro específico por `Falha no upload do vídeo`.
- Manter o arquivo e título selecionados após falha para o usuário tentar novamente.
- Mostrar erro amigável quando o problema for slot/limite/banco.

Etapa 6 — Verificação no Supabase após correção

Depois da implementação, verificar:

- `storage.objects` no bucket `videos`, para confirmar o arquivo criado.
- `public.videos`, para confirmar o registro do vídeo.
- `public.pedido_videos`, para confirmar vínculo com o pedido e slot correto.
- Produto `horizontal` com `max_videos_por_pedido = 10`.
- Constraint `pedido_videos_slot_position_check` aceitando até 10.

Onde estão os vídeos no Supabase hoje

Bucket:

```text
Supabase Storage > bucket: videos
```

Para o pedido atual, usuário `6b744524-f60c-4d12-bd2c-8df65600361e`, os arquivos atuais estão em:

```text
videos/6b744524-f60c-4d12-bd2c-8df65600361e/1776194933543_Digital_Globe_Logo_Animation.mp4
videos/6b744524-f60c-4d12-bd2c-8df65600361e/1775827866998_IMG_8546.mov
videos/6b744524-f60c-4d12-bd2c-8df65600361e/1775763999793_IMG_6664.mov
```

Tabelas envolvidas:

```text
public.videos          -> registro do arquivo de vídeo
public.pedido_videos   -> vínculo do vídeo com pedido + slot
storage.objects        -> objeto físico no bucket videos
public.produtos_exa    -> limite de slots por produto
```

Mudanças fora do escopo

Não vou alterar layout geral do portal, fluxo comercial, aprovação de vídeos, regras de contrato, campanhas, agenda ou páginas públicas. A intervenção será limitada ao upload de vídeo, slot do pedido, validação Supabase e modal de corte mobile.