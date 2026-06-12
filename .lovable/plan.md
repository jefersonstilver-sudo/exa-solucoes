## Diagnóstico

O problema principal é que o alerta offline aparece como lista numerada, não como botão nativo. A função de envio (`zapi-send-message`) converte qualquer `buttons` em texto numerado por segurança. Porém o webhook (`zapi-webhook`) só trata resposta nativa de botão para alerta de painel; quando você digita `3`, a mensagem entra como texto normal e o próprio agente `exa_alert` é ignorado como “notification-only”. Resultado: não pausa e não envia confirmação.

Também encontrei inconsistências que deixam o fluxo frágil:
- O envio não inclui `deviceId` no ID do botão, mas o webhook espera formato `buttonId:deviceId`.
- O handler de botão em `zapi-webhook` busca colunas/campos incorretos (`sent_at`, `recipients`) enquanto a tabela usa `created_at` e `destinatarios_notificados`.
- A lógica de pausa existe, mas está dividida entre `zapi-webhook` e `zapi-button-webhook`, com comportamentos diferentes.

## Plano de correção definitiva

1. **Criar um handler único para respostas de alerta offline**
   - Centralizar em `zapi-webhook` a interpretação de:
     - resposta digitada: `1`, `2`, `3`
     - texto equivalente: “visualizei”, “interromper”, “verificando”
     - botão nativo, se vier pelo WhatsApp
   - Processar isso antes do bloqueio `EXA Alert: ignoring inbound`.

2. **Mapear corretamente as opções do alerta**
   - `1` / “Já estou verificando”: registrar confirmação sem parar alertas.
   - `2` / “Visualizei”: registrar confirmação e pausar temporariamente, mantendo a regra atual de 3 horas.
   - `3` / “Interromper Notificações”: registrar confirmação e gravar `devices.metadata.notifications_paused_until = 'indefinite'` até o painel voltar online.

3. **Amarrar cada resposta ao painel correto**
   - No envio do alerta em `monitor-panels`, persistir um contexto por telefone com o último alerta enviado: `device_id`, nome do painel, ocorrência, número do aviso e opções disponíveis.
   - Incluir `deviceId`/ocorrência no payload de botão quando houver botão nativo.
   - Se não houver contexto, fazer fallback pelo último registro de `panel_offline_alerts_history` daquele telefone usando `created_at` e `destinatarios_notificados`.

4. **Enviar confirmação clara no WhatsApp**
   - Após clicar/digitar `3`, responder algo como:
     - “Notificações interrompidas para Riverside 2.”
     - “Você não receberá novos avisos deste painel enquanto ele permanecer offline.”
     - “Os alertas voltam automaticamente quando ele ficar online.”
   - Se não encontrar painel/contexto, avisar que a opção não pôde ser vinculada em vez de falhar silenciosamente.

5. **Corrigir os botões reais com fallback seguro**
   - Manter a resposta por número funcionando sempre, pois é a parte mais confiável.
   - Tentar envio com botões nativos somente pelo provedor/API que estiver estável para a instância de notificações.
   - Se o provedor retornar erro ou o WhatsApp renderizar mal, manter automaticamente a lista numerada como fallback, sem quebrar o atendimento.

6. **Ajustar logs e auditoria**
   - Registrar todas as ações em `panel_offline_alert_confirmations` com `button_label`, telefone, nome, painel, ocorrência e raw webhook.
   - Registrar também no histórico quando a opção `3` interromper alertas.
   - Remover dependência de UUID hardcoded do botão “Interromper Notificações”.

7. **Validação final**
   - Simular alerta offline para um painel.
   - Responder `3` no WhatsApp.
   - Confirmar que:
     - metadata do device recebeu `notifications_paused_until: 'indefinite'`;
     - confirmação foi salva;
     - mensagem de confirmação voltou no WhatsApp;
     - o próximo ciclo do `monitor-panels` não envia novo alerta do mesmo painel;
     - quando o painel voltar online, o pause é limpo automaticamente, preservando o comportamento atual.