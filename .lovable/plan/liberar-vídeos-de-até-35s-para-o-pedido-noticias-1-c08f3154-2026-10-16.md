# Liberar vídeos de até 35s para o pedido "NOTICIAS 1" (#c08f3154)

## O que muda para você
- Só neste pedido (horizontal, ativo), o cliente poderá enviar vídeos de até **35 segundos**.
- Todos os outros pedidos continuam com o limite atual (10s horizontal / 15s vertical).
- Vídeos acima de 35s nesse pedido abrem o cortador já ajustado para 35s.
- Os textos de requisitos/instruções desse pedido passam a mostrar "máx. 35 segundos".

## Como será feito
1. Banco: adicionar ao pedido um campo opcional "duração máxima personalizada" (vazio = usa o padrão). Preencher 35 só no pedido c08f3154-e0dc-4c39-b8a2-721d8acdde7f. Nada mais é alterado em pedidos.
2. Envio de vídeo: a validação de duração passa a receber o limite do pedido quando ele existir:
   - `videoStorageService.validateVideoFile` aceita um limite opcional (hoje fixo 10/15).
   - `VideoSlotUpload` e `videoUploadService` buscam o limite do pedido e repassam (inclusive para o cortador e para a checagem de trecho cortado).
   - `VideoInstructionsModal` exibe o limite do pedido quando houver.
3. Nenhuma mudança em aprovação, playlist, pagamentos, Asaas ou outros pedidos.

## Detalhes técnicos
- Migração: `ALTER TABLE public.pedidos ADD COLUMN max_video_duration_override integer NULL` com trigger de validação (5–120s) + `UPDATE` só desse id.
- Helper `getOrderMaxDuration(orderId, tipo)` → override ?? padrão.
- Verificar após: pedido retorna 35; outro pedido continua 10.

## Ponto de atenção
A programação dos painéis hoje considera 10s por vídeo horizontal; um vídeo de 35s ocupará mais tempo no ciclo do painel. Se o player externo cortar em 10s, isso precisará ser ajustado do lado do sistema de exibição.
