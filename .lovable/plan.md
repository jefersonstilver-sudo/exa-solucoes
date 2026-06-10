
# Botões interativos via Evolution API

## Contexto
Hoje o shim `zapi-send-message` só usa `/message/sendText`. Por isso `monitor-panels`, `task-notify-created` e similares enviam um texto com "Responda com o número da opção: 1./2./3.". O usuário quer **botões clicáveis** no WhatsApp, como antes.

A Evolution API (Baileys) expõe:
- `POST /message/sendButtons/{instance}` — até 3 botões reply rápidos.
- `POST /message/sendList/{instance}` — lista interativa (até 10 opções, mais confiável em Android moderno).

Importante: botões Baileys funcionam de forma intermitente em contas pessoais. Vamos enviar **botões nativos como tentativa principal** e, se a Evolution retornar erro/timeout, **cair automaticamente** para o texto numerado atual (sem perder alerta).

## Mudanças

### 1) `supabase/functions/zapi-send-message/index.ts`
- Aceitar novos campos opcionais no body:
  - `buttons?: Array<{ id: string; label: string }>` (1–3 itens) — botões reply.
  - `list?: { title: string; buttonText: string; sections: Array<{ title?: string; rows: Array<{ id: string; title: string; description?: string }> }> }` — lista interativa.
  - `footer?: string`, `title?: string` (cabeçalho/rodapé opcionais).
- Quando `useEvolution` e `buttons` (ou `list`) presentes:
  - Não dividir mensagem (`skipSplit` forçado).
  - Tentar `POST /message/sendButtons/{instance}` (ou `/message/sendList`) com payload no formato Evolution v2:
    ```json
    {
      "number": "5545...",
      "title": "...", "description": "<message>", "footer": "...",
      "buttons": [{ "type": "reply", "displayText": "Já estou verificando", "id": "ack" }, ...]
    }
    ```
  - Se a chamada falhar (HTTP ≠ 2xx ou exceção), **fallback automático**: enviar `/message/sendText` com a mensagem já contendo a lista numerada (comportamento atual).
- Logar em `evolution_logs.metadata.send_mode = 'buttons' | 'list' | 'text_fallback'` para auditoria.
- Quando `agentKey !== 'exa_alert'` (Z-API legado) e `buttons` vier, ignorar com warning e enviar texto (Z-API tem outro formato, fora do escopo agora).

### 2) `supabase/functions/monitor-panels/index.ts`
- Em `sendWhatsApp(..., withButtons=true, ...)`:
  - Em vez de montar `finalMessage` com "1. 2. 3.", invocar o shim com:
    ```ts
    supabase.functions.invoke('zapi-send-message', {
      body: {
        agentKey: 'exa_alert',
        phone, message, skipSplit: true,
        buttons: confirmButtons.slice(0, 3).map((b, i) => ({
          id: b.action_key ?? `opt_${i+1}`,
          label: `${b.emoji ?? ''} ${b.label}`.trim(),
        })),
        footer: 'Toque em um botão para responder',
      }
    });
    ```
- Manter `confirmButtons` lidos de `panel_offline_alert_buttons` (sem mudança de schema).
- Handler de resposta (webhook Evolution) já funciona porque o usuário também pode digitar o texto do botão — não muda recepção.

### 3) `supabase/functions/task-notify-created/index.ts` e `task-notify-change/index.ts`
- Adicionar `buttons` na chamada do shim para confirmação de compromisso:
  ```ts
  buttons: [
    { id: 'task_confirm', label: '✅ Confirmar' },
    { id: 'task_reschedule', label: '🔄 Remarcar' },
    { id: 'task_cancel', label: '❌ Cancelar' },
  ]
  ```
- O texto da mensagem permanece igual (descrição do compromisso). Botões só são adicionados quando há telefone destinatário válido.

### 4) `task-notify-cancelled` / lembrete pós-evento
- Sem botões (mensagens informativas). Sem mudança.

## Não-mudanças
- Sem migrações de banco.
- Sem alterações de UI (XAlerts, CRM Evolution, Agenda).
- Sem mudanças em Z-API legado.
- Recebimento/parser de respostas continua igual (webhook Evolution já normaliza `buttonsResponseMessage` para texto).

## Validação
1. `supabase--deploy_edge_functions` para `zapi-send-message`, `monitor-panels`, `task-notify-created`, `task-notify-change`.
2. Disparar alerta de painel offline (modo teste) — verificar no WhatsApp se vêm botões clicáveis. Se o número não suportar, deve cair no texto numerado.
3. Criar um agendamento na Agenda — verificar mensagem de confirmação com botões Confirmar/Remarcar/Cancelar.
4. Conferir `evolution_logs.metadata.send_mode` para confirmar qual caminho foi usado.

Aprovar para eu implementar?
