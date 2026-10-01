# Validação somente leitura do teste real Asaas de R$ 0,01

## Evidência obtida até 01/10/2026, 02:50 UTC
- Os logs recentes de `asaas-webhook` mostram apenas inicializações (02:40:50, 02:41:52 e 02:45:23 UTC) e encerramentos (até 02:48:43 UTC). Não mostram recebimento, resposta HTTP ou erro do teste.
- A consulta aos registros de requisições das Edge Functions entre 02:00 e 03:00 UTC não retornou chamadas; a consulta complementar aos registros de gateway para `asaas-webhook` também não retornou resultados. Assim, não há HTTP 200/400/401/403/404/500 verificável para esta transação.
- `public.webhook_logs` tem 96 registros no total; o mais recente foi criado em 11/01/2026 às 00:50:52 UTC. Não há registro com `provider='asaas'`, inclusive após a publicação recente. Portanto, não há `event_type`, horário do evento, ID nem valor de R$ 0,01 persistido para identificar; tampouco há evidência de retries ou deduplicação deste teste.
- O código atual retorna `400 {"error":"Invalid event identity"}` na validação de `id`/`event` do payload, antes da gravação; retorna `400 {"error":"Invalid payment event"}` para `PAYMENT_*` sem `payment.id`; e retorna `503 {"error":"Persistence unavailable"}` quando não consegue persistir. Não há evidência de que qualquer desses caminhos tenha ocorrido no novo teste.

## Próxima verificação, sem alterações
1. Consultar novamente os registros após a janela de ingestão de logs e confirmar no histórico de entregas do webhook EXA-PAGAMENTOS-2.0 no Asaas se o evento de R$ 0,01 foi selecionado e enviado, com horário, tipo e resposta HTTP.
2. Se houver entrega, correlacionar o horário e o ID `evt_*` (sem dados pessoais ou segredo) aos logs de requisição e à linha única em `public.webhook_logs`; se houver erro, usar a resposta exata da entrega para localizar o ponto correspondente no código.
3. Não enviar eventos, reenviar tentativas nem modificar código, banco, cobranças, pagamentos, pedidos, status ou dashboard.
