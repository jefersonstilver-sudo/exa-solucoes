## Problema

O Evolution/Baileys `sendButtons` **retorna 200 OK** (log confirma `✅ sendButtons OK`), mas o WhatsApp do destinatário exibe **"Aguardando mensagem. Essa ação pode levar alguns instantes"** e nunca decodifica. Isso é uma limitação conhecida do Baileys: o WhatsApp moderno (multi-device) descartou suporte a `buttonsMessage` legado — a mensagem chega cifrada mas o cliente não consegue renderizar, ficando travada como "aguardando".

Ou seja, **botões nativos via Evolution não vão funcionar de forma confiável**, independente do que ajustemos no payload. É por isso que só o lembrete (texto puro, agendado) chegou — ele não usa botões.

## Solução

Voltar para o formato **texto numerado** (que já funcionou nos alertas de painel antes), mas mantendo a UX clara com emojis e instrução de resposta. O `monitor-panels` já tinha esse formato funcionando antes da última iteração.

### Alterações em `supabase/functions/zapi-send-message/index.ts`
- **Desativar** o branch `sendButtons` por padrão (Evolution/Baileys quebra a renderização).
- Quando o caller passar `buttons`, automaticamente converter para texto numerado e enviar via `sendText` normal:
  ```
  {mensagem original}
  
  *Responda com o número da opção:*
  1. ✅ Confirmar
  2. 🔄 Remarcar
  3. ❌ Cancelar
  ```
- Manter `send_mode: 'text_numbered'` no `evolution_logs.metadata` para auditoria.
- Manter um flag opcional `forceNativeButtons: true` no body caso queiramos re-testar no futuro (desativado por padrão).

### Sem mudanças em callers
- `task-notify-created`, `task-notify-change`, `monitor-panels` continuam mandando `buttons: [...]` — o shim cuida da conversão. Nenhuma mudança nesses arquivos.

### Validação
1. Deploy `zapi-send-message`.
2. Usuário cria nova tarefa → deve chegar 1 mensagem texto com cabeçalho da tarefa + lista numerada de confirmação (sem "Aguardando mensagem").
3. Conferir `evolution_logs.metadata.send_mode = 'text_numbered'`.

## Por que não tentar outra coisa primeiro
- Já testamos payload Baileys nativo (`type: reply`, `displayText`, `id`) — entregou 200 mas o cliente não renderiza.
- `sendList` (interactive list) tem o mesmo problema no Baileys atual.
- Botões só funcionam via WhatsApp Cloud API oficial (Meta), que exigiria outra integração — fora do escopo desta correção.

Texto numerado já é a solução que o sistema usava e funcionava (vide screenshot do "11º AVISO" que chegou e o usuário respondeu "3").