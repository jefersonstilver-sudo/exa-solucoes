# Diagnóstico somente leitura — teste real do webhook EXA-PAGAMENTOS-2.0

## Evidência observada até 02:41 UTC de 01/10/2026
- Os logs recentes de `asaas-webhook` mostram inicializações e encerramentos da função, mas não registram uma entrega real nem seu código HTTP.
- A consulta aos logs de requisições das funções no período retornou vazia; portanto, não há evidência de HTTP 200, 401, 403, 404 ou 500 **para este teste**. Isso não demonstra que nenhuma requisição ocorreu: a telemetria consultada pode não ter recebido o registro.
- `webhook_logs` permanece com 96 registros históricos, último em 11/01/2026; há **zero** registros do provedor Asaas e nenhum registro criado após o teste no período consultado. Não há evento, ID ou timestamp novos para verificar unicidade ou confirmar recebimento de R$ 1,00.
- O código da função aceita eventos `PAYMENT_*` somente com `payment.id`, exige o header `asaas-access-token` e só responde HTTP 200 após persistir o evento por ID. Isso confirma a regra prevista no código, **não** uma entrega real.

## Conclusão e próxima checagem segura
A movimentação de R$ 1,00 **não tem comprovação ponta a ponta no Supabase até este horário**. Não é possível concluir se foi uma entrada/recebimento, qual evento o Asaas gerou, se esse tipo estava selecionado no webhook, nem confirmar idempotência de uma entrega inexistente no log.

Sem criar outro teste nem alterar dados, conferir no histórico de entregas do webhook EXA-PAGAMENTOS-2.0 no Asaas se a movimentação gerou um evento selecionado, o tipo, a hora UTC e o código HTTP da tentativa. Comparar esse ID/timestamp com `webhook_logs` e com os logs de requisição da função quando a telemetria estiver disponível. Se não existir tentativa no Asaas, verificar se a operação foi um evento de entrada/recebimento coberto pelos eventos selecionados; se existir tentativa com falha, diagnosticar a resposta antes de qualquer correção.

## Limites
Nenhum código, banco, cobrança, pedido, dívida, status financeiro ou dashboard será alterado; nenhum evento artificial será enviado.
