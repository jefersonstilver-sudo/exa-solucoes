## Diagnóstico confirmado

O problema atual não é mais envio pela Z-API. O envio já está saindo pela Evolution, mas as respostas não estão sendo processadas.

Pontos encontrados:

- O alerta do print saiu pela Evolution como texto numerado, não como botão nativo.
- A mensagem ainda mostra o rodapé antigo: “Toque em um botão para responder”. Isso está errado para o novo modo por número.
- Quando você responde `3`, não existe hoje um handler de texto para alertas de painel offline.
- O handler atual só sabe bloquear notificações quando chega resposta de botão nativo, mas agora os botões foram transformados em texto numerado.
- O webhook existente é legado (`zapi-webhook`) e espera formato Z-API. A Evolution envia outro formato (`event`, `instance`, `data.key.remoteJid`, `data.message.conversation`, etc.). Mesmo que a Evolution chame esse endpoint, ele não entende corretamente a mensagem.
- Não encontrei logs recentes de entrada no webhook quando você respondeu `3`, então também precisamos garantir o webhook inbound da instância Evolution de notificações.

## Plano de correção

### 1. Criar/ajustar entrada inbound da Evolution

Implementar um endpoint específico para receber eventos da Evolution, entendendo o formato real:

```text
Evolution messages.upsert
→ extrair telefone do data.key.remoteJid
→ ignorar fromMe=true
→ extrair texto de data.message.conversation / extendedTextMessage.text
→ processar respostas 1, 2, 3
```

Esse endpoint vai ser focado nas notificações EXA Alerts, sem alterar tela, CRM ou outros fluxos.

### 2. Processar `1`, `2`, `3` para alerta de painel offline

Adicionar lógica de texto para o alerta offline:

- `1` = registrar “Já estou verificando”
- `2` = registrar “Visualizei” e pausar alertas por 3 horas, mantendo a lógica que já existia no handler de botão
- `3` = registrar “Interromper Notificações” e bloquear notificações daquele painel específico até ele voltar online

A identificação do painel será feita pelo alerta mais recente enviado para aquele telefone em `panel_offline_alerts_history.destinatarios_notificados`, assim a resposta `3` será vinculada ao Royal Legacy 3 no caso do print.

### 3. Enviar confirmação de volta pela Evolution

Após processar a resposta, enviar uma mensagem de confirmação visível pelo mesmo roteador atual de notificações (`zapi-send-message`, que hoje é o shim que envia via Evolution para `exa_alert`).

Exemplo esperado para `3`:

```text
🛑 Notificações interrompidas

📍 Royal Legacy 3
✅ Você não receberá mais alertas deste painel enquanto ele estiver offline.
🔔 Os alertas voltam automaticamente quando o painel ficar online novamente.
```

### 4. Remover texto enganoso “toque em botão”

No envio do `monitor-panels`, trocar o rodapé para algo compatível com texto:

```text
Responda com 1, 2 ou 3
```

E garantir que `zapi-send-message` não acrescente instruções conflitantes.

### 5. Corrigir referência dos botões no monitoramento

Hoje o `monitor-panels` tenta usar `btn.action_key`, mas a tabela real `panel_offline_alert_buttons` não tem essa coluna. Vou ajustar para usar o `id` real do botão, mantendo compatibilidade com o handler antigo e evitando mapeamentos quebrados.

### 6. Garantir webhook da instância Evolution

Depois do endpoint existir, configurar/testar a instância Evolution de notificações (`is_notifications=true`) para enviar eventos `messages.upsert` para o endpoint correto.

Isso não muda a interface; é só a conexão de entrada da API.

### 7. Validação

Validar com um teste controlado:

- enviar/responder um alerta offline de teste
- responder `1` e confirmar que grava confirmação e responde no WhatsApp
- responder `2` e confirmar pausa temporária
- responder `3` e confirmar que grava `notifications_paused_until = indefinite` no painel correto
- confirmar que novos ciclos do `monitor-panels` não enviam mais alerta para esse painel enquanto ele estiver offline

## Arquivos previstos

- `supabase/functions/evolution-webhook/index.ts` ou extensão segura do webhook existente
- `supabase/functions/monitor-panels/index.ts`
- possivelmente `supabase/functions/zapi-send-message/index.ts` apenas para ajustar rodapé/instrução conflitante

Sem alterações de UI.