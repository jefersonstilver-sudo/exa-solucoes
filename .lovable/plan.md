## Objetivo

Substituir o campo `ativo` por `master` em TODOS os payloads enviados para a API externa AWS. Endpoints (URLs) ficam como estão por enquanto — foco somente no payload de envio.

## Regras

- Primeiro vídeo de um pedido → `master: true`
- Demais vídeos do mesmo pedido → `master: false`
- Apenas UM master por pedido a qualquer momento
- Nenhuma mudança em UI, fluxo de upload, agendamento interno ou lógica do site

## Arquivos a modificar

1. **`supabase/functions/upload-video-to-external-api/index.ts`**
   - Renomear variável `activeFlag` → `masterFlag` (mantendo a lógica atual de "primeiro slot ativo do pedido = master:true").
   - No body do POST para a API externa: trocar `ativo: activeFlag` por `master: masterFlag`.
   - Atualizar logs e comentários (ativo → master).
   - Manter persistência interna (`is_active`, `selected_for_display`) intacta — só muda o nome do campo enviado.

2. **`supabase/functions/sync-video-status-to-aws/index.ts`**
   - Nas duas chamadas `PATCH ${EXTERNAL_API_BASE}/ativo/batch`:
     - URL permanece (definirmos depois conforme combinado)
     - Body: `{ ativo: true }` → `{ master: true }` (ativar selecionado)
     - Body: `{ ativo: false }` → `{ master: false }` (desativar os demais)
   - Atualizar logs.

3. **`supabase/functions/audit-sync-all-active-orders/index.ts`**
   - Verificar se algum payload de reconciliação envia `ativo` e trocar por `master`.

4. **`src/services/videoApprovalWebhookService.ts`** e **`src/services/webhookProgramacaoService.ts`**
   - Onde houver `ativo:` no payload do webhook AWS → trocar por `master:`.
   - Manter `programacao`, `isPlus`, `QRLocale`, `id_pedido`, `titulo`, `data_ini`, `data_fim`, `redirecionamento` como estão (já alinhados com o novo contrato).

5. **`src/services/videoBaseService.ts`**
   - Atualizar logs (`Video ativo:` → `Video master:`) se houver envio para AWS.

## O que NÃO muda

- URLs/endpoints AWS (`/ativo/batch` continua até decisão posterior)
- Banco Supabase: colunas `is_active`, `selected_for_display`, `is_master` (essa última é de pedido, não de vídeo)
- Polling/agendamento interno do site
- Qualquer UI

## Validação

- Lint dos edge functions modificados
- Smoke test: chamar `upload-video-to-external-api` em pedido de teste e confirmar payload com `master:true` no primeiro vídeo
- Verificar logs de `sync-video-status-to-aws` ao trocar principal: `master:true` no novo, `master:false` nos demais