## Análise final antes de implementar

### O que está acontecendo

1. **Ainda existe registro real de envio nativo com botão**
   - Em `evolution_logs`, encontrei uma mensagem recente da tarefa `teste 5` com:
     - `provider = evolution`
     - `send_mode = buttons`
     - horário: `2026-06-10 15:22:52 UTC`
   - Esse é exatamente o tipo de envio que gera no celular: `Aguardando mensagem. Essa ação pode levar alguns instantes.`

2. **A mensagem mais nova da tarefa `teste 8` já saiu como texto numerado**
   - Em `evolution_logs`, a tarefa `teste 8` saiu com:
     - `send_mode = text_numbered`
     - texto normal com `1. Confirmar`, `2. Remarcar`, `3. Cancelar`
   - Então parte da correção anterior funcionou, mas ainda há mensagens antigas/nativas já entregues no WhatsApp que continuarão aparecendo como “aguardando”. Essas mensagens não podem ser corrigidas depois de enviadas.

3. **Ainda há caminhos no código que enviam botões nativos fora do roteador corrigido**
   - `process-schedule-intent` ainda usa `send-button-list` em várias etapas do agendamento por WhatsApp.
   - `notify-escalation` ainda envia `send-button-actions` como “bônus” depois do texto.
   - `resend-escalation` também envia `send-button-actions` como “bônus”.
   - `check-expired-proposals` ainda tenta `send-button-list` antes de cair para texto.
   - Esses pontos podem continuar criando mensagens quebradas no mobile.

4. **O roteador `zapi-send-message` ainda mantém uma porta para botão nativo**
   - Existe `forceNativeButtons: true`.
   - Não encontrei chamadas atuais usando esse flag, mas por segurança ele deve ser removido/desativado de vez para produção.

5. **O problema da resposta `1/2/3` é outro, separado da renderização**
   - A mensagem pede para responder `1/2/3`, mas a tabela `task_notification_queue` está vazia.
   - `task-follow-up-response` só processa resposta se existir uma notificação ativa nessa tabela.
   - `task-notify-created` envia a mensagem e grava `task_read_receipts`, mas não cria a fila de resposta.
   - Resultado: o usuário responde `1`, mas o sistema não tem contexto ativo para saber qual tarefa confirmar/remarcar/cancelar.

## Plano de correção

### 1. Bloquear botões nativos definitivamente
- Remover/desativar o caminho `sendButtons` de `zapi-send-message`, inclusive `forceNativeButtons`.
- Toda mensagem com `buttons` deve sempre virar texto numerado.
- Ajustar o texto final para não dizer “toque em um botão”, e sim “responda com o número”.

### 2. Remover envios diretos de botão dos fluxos restantes
- Em `process-schedule-intent`, trocar `send-button-list` por texto numerado.
- Em `notify-escalation`, remover o envio “bônus” de `send-button-actions`; manter somente o texto com instruções `OK`, `ATENDI`, `DEPOIS`.
- Em `resend-escalation`, remover o envio “bônus” de `send-button-actions`.
- Em `check-expired-proposals`, trocar `send-button-list` por texto com opções escritas.

### 3. Corrigir fila de respostas da tarefa criada
- Em `task-notify-created`, após envio da “Nova Tarefa agendada”, criar/atualizar uma linha em `task_notification_queue` para o `task_id`.
- Isso permitirá que `1`, `2`, `3`, `SIM`, `NAO`, data, horário e justificativa tenham contexto.

### 4. Melhorar a identificação da tarefa pela resposta
- Em `task-follow-up-response`, procurar primeiro o telefone em `task_read_receipts.contact_phone`.
- Usar o `task_id` do receipt mais recente para localizar a fila correta.
- Só depois cair no fallback por usuário/criador.

### 5. Garantir resposta sempre visível
- Se a pessoa responder `1/2/3` e não houver tarefa pendente, o sistema deve enviar uma mensagem explicando que não encontrou tarefa ativa para aquele número.
- Se encontrar, deve responder imediatamente com a próxima etapa: confirmar, pedir data ou pedir justificativa.

### 6. Validar com teste real
- Criar tarefa nova.
- Confirmar que não aparece mais “Aguardando mensagem”.
- Responder `1` e verificar retorno imediato.
- Responder `SIM` e verificar confirmação/comprovante.
- Testar também `2` e `3` em nova tarefa.