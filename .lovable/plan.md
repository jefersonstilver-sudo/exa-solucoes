## Diagnóstico profundo

O problema não está na tela de tarefas. A tela está lendo corretamente `task_read_receipts`: ela mostra `CONFIRMAÇÕES (0/1)` porque existe um registro para Jeferson, mas ele continua com `status = sent` e `read_at = null`.

O erro está no backend que recebe sua resposta do WhatsApp.

### O que aconteceu no teste do print

- A tarefa `jogo da copa` foi enviada para `5545998090000` e criou corretamente:
  - `task_read_receipts`: Jeferson Encina, status `sent`
  - `task_notification_queue`: tarefa ativa para resposta
- Quando você respondeu `1`, a Evolution entregou o webhook com `remoteJid` em formato `@lid`:
  - `23377809039372@lid`
- O webhook atual transformou isso em telefone `23377809039372`, que não é seu número real de WhatsApp.
- Como a mensagem era `1`, o webhook entrou primeiro no fluxo de alerta de painel offline, não no fluxo de tarefa.
- Como não achou alerta de painel para esse `@lid`, tentou responder para `23377809039372`, e a Evolution recusou:
  - `exists:false, jid:23377809039372@s.whatsapp.net`
- Por isso você não recebeu nenhuma confirmação de volta.
- Como o fluxo de tarefa nem chegou a rodar, o sistema não atualizou `task_read_receipts.status = read`, então a UI ficou `CONFIRMAÇÕES (0/1)`.

## Problemas reais identificados

1. **Evolution `@lid` não está resolvido para telefone real**
   - O webhook usa `data.key.remoteJid` antes de qualquer alternativa.
   - Quando vem `@lid`, isso não serve para enviar resposta nem para buscar recibo.

2. **Ordem errada de roteamento para `1`, `2`, `3`**
   - Hoje `1/2/3` tenta primeiro painel offline.
   - Se não encontra painel, ele retorna e não deixa a tarefa processar a resposta.

3. **Texto “Confirmar” não atualiza a confirmação da UI**
   - A UI considera confirmado somente quando `task_read_receipts.status = read` e `read_at` preenchido.
   - O fluxo atual de tarefa interpreta `1` como início de “concluir tarefa”, pedindo `SIM`, em vez de marcar a confirmação/visualização daquele compromisso.

4. **Respostas de erro estão sendo enviadas para o identificador errado**
   - Quando chega `@lid`, o sistema tenta responder para o LID como se fosse telefone.

## Como `Remarcar` e `Cancelar` devem funcionar

### `1. Confirmar`
- Deve marcar o contato como confirmado/visualizado na tarefa.
- Deve atualizar a UI para `CONFIRMAÇÕES (1/1)`.
- Deve responder no WhatsApp algo como:
  - `✅ Confirmação registrada para 