# Fase 1 — Inst. "Notificações EXA" + Migração Total Z-API → Evolution

## Objetivo
Criar 1 instância Evolution dedicada exclusivamente às **notificações automáticas** do sistema (painéis offline, 2FA, agendamentos, propostas, etc.), gerenciável tanto pela página **XAlerts** quanto pelo **CRM Evolution**, e desligar 100% do Z-API sem perder nenhuma função.

---

## 1. Banco — flag de inst. de notificação + renomeação de logs

Migration única:
- `ALTER TABLE evolution_instances ADD COLUMN is_notifications boolean NOT NULL DEFAULT false;`
- Índice parcial único: só pode existir 1 inst. com `is_notifications=true`.
- `ALTER TABLE zapi_logs RENAME TO evolution_logs;` (mantém colunas; novo campo opcional `instance_id` text).
- Compatibilidade: criar VIEW `zapi_logs` apontando para `evolution_logs` durante período de transição (depois removida).

---

## 2. XAlerts (`/super_admin/exa-alerts`) — novo card "Canal de Notificações"

Componente novo `NotificationsChannelCard.tsx` adicionado ao topo da página:
- Mostra status da inst. `is_notifications=true` em **tempo real** (badge: 🟢 Conectado / 🟡 QR pendente / 🔴 Desconectado / ⚫ Inexistente).
- Botões:
  - **Criar instância "Notificações EXA"** (se não existir) → cria via `evolution-proxy` (`/instance/create`) e marca `is_notifications=true`.
  - **Ver QR Code** (se status ≠ conectado) → modal com QR fetched de `/instance/connect/{instanceName}` + auto-refresh 30s.
  - **Abrir conversa** → navega para `/super_admin/crm-evolution/conversas/{id}` da inst. (reusa UI já existente).
  - **Reconectar** → força logout + novo QR.
- Atualização realtime via Supabase channel sobre `evolution_instances`.

---

## 3. CRM Evolution (`/super_admin/crm-evolution`) — gestão completa

Em `CollaboratorCard.tsx` (ou novo `InstanceMenu`):
- Ícone status realtime (mesmo padrão da XAlerts).
- Menu de ações (kebab):
  - **Reconectar** → modal com novo QR (gera novo via `/instance/connect`).
  - **Logout** → desloga sem apagar.
  - **Apagar instância** → modal de confirmação dupla com checkbox "Apagar também o histórico de conversas/mensagens deste banco". Executa `/instance/delete` na Evolution + `DELETE` em cascata em `conversations`/`messages`/`evolution_instances` se checkbox marcado, senão só remove da Evolution e da tabela `evolution_instances`.
- Bloqueio: instância com `is_notifications=true` exige confirmação extra ("Esta é a instância de notificações automáticas — apagá-la interrompe alertas") e quando reconectada mantém a flag.

---

## 4. Edge Functions — migração total

### 4.1 Substituições (rename + reescrita interna usando Evolution)
| Z-API atual | Nova função / destino |
|---|---|
| `zapi-send-message` | `evolution-send-message` — mesmo payload `{to, message, agentKey?}`. Resolve inst. por `agentKey`; se `agentKey === "notifications"` ou ausente, usa inst. `is_notifications=true`. |
| `zapi-send-media` | `evolution-send-media` |
| `zapi-webhook` | `evolution-webhook` (recebe `messages.upsert`, `connection.update`, `qrcode.updated`) |
| `zapi-button-webhook` | `evolution-button-webhook` (botões interativos) |
| `configure-zapi-webhook` | `configure-evolution-webhook` (chama `/webhook/set/{instance}` no Evolution) |
| `check-zapi-status` | `check-evolution-status` |
| `monitor-zapi-connections` | `monitor-evolution-connections` |
| `fetch-zapi-history` / `zapi-import-history` | `fetch-evolution-history` / `evolution-import-history` |
| `force-sync-zapi-conversation` | `force-sync-evolution-conversation` |

### 4.2 Shim de compatibilidade
As 45+ funções que chamam `supabase.functions.invoke('zapi-send-message', …)` **não** serão todas reescritas individualmente. Estratégia:
- Reescrever **apenas o corpo** de `zapi-send-message` e `zapi-send-media` para internamente chamar Evolution. Mesmo contrato de entrada/saída.
- Atualizar `exa-messaging-proxy` (ponto central) para usar Evolution diretamente.
- Após validação, busca-e-substitui dos nomes nas demais funções (`zapi-send-message` → `evolution-send-message`) em lote.

### 4.3 Funções a remover ao fim
`zapi-send-message`, `zapi-send-media`, `zapi-webhook`, `zapi-button-webhook`, `configure-zapi-webhook`, `check-zapi-status`, `monitor-zapi-connections`, `fetch-zapi-history`, `zapi-import-history`, `force-sync-zapi-conversation` (após todos os callers migrados).

### 4.4 Funções que devem migrar (mapeadas hoje)
Painéis offline (`monitor-panels`), 2FA (`send-exa-verification-code`, `send-user-whatsapp-code`), agenda (`task-notify-*`, `task-reminder-scheduler`, `task-daily-report`, `task-follow-up-*`, `process-schedule-intent`), propostas (`notify-proposal-event`, `send-proposal-whatsapp`, `check-expired-proposals`, `notify-seller-proposal-accepted`, `notify-seller-payment-confirmed`, `convert-proposal-to-order`, `create-cortesia-proposal`, `request-cortesia-code`), comercial (`daily-commercial-alerts`, `notify-escalation`, `resend-escalation`, `notify-curriculum-received`), CRM (`generate-ai-response`, `conversation-follow-up`, `route-message`, `send-typing-indicator`, `replay-message`, `sync-*`), financeiro (`notify-upcoming-pix`, `monitor-delivery-status`), relatórios (`relatorio-operacional-generate`, `relatorio-var-send`). **Nenhuma perde função** — todas continuam enviando WhatsApp, agora via Evolution.

---

## 5. Frontend — substituir UI Z-API

- `ZAPICredentialsModal.tsx` → `EvolutionCredentialsModal.tsx` (ou removido, pois Evolution gerencia via QR).
- `ZApiDiagnostics.tsx` → `EvolutionDiagnostics.tsx`.
- `MediaInputBar.tsx`, `MessageComposer.tsx`, `ConfigAlertModal.tsx` → trocar `invoke('zapi-send-message')` por `invoke('evolution-send-message')`.
- `ZAPIDisconnectAlert.tsx` → escuta novo `alert_type='evolution_disconnected'` (mantém UX).

---

## 6. Secrets

Reutilizar `EVOLUTION_API_URL` + `EVOLUTION_API_KEY` (já existem). Nenhum secret novo necessário. **Não** apagar `ZAPI_*` ainda — manter até validação completa, deletar ao fim.

---

## 7. Ordem de execução
1. Migration (flag + rename logs + view compat).
2. Edge functions `evolution-send-message`, `evolution-send-media`, `evolution-webhook`, `configure-evolution-webhook`, `check-evolution-status`, `monitor-evolution-connections`.
3. Reescrever internamente `zapi-send-message`/`zapi-send-media` como shim → Evolution (zero downtime).
4. Card XAlerts + gestão CRM Evolution (UI).
5. Migrar nomes de invoke em todas as funções (busca-substituição).
6. Atualizar componentes frontend que invocam zapi-*.
7. Remover funções zapi-* obsoletas + view `zapi_logs` + secrets Z-API.

---

## Risco e mitigação
- **Risco**: 45+ funções dependem do nome `zapi-send-message`. **Mitigação**: shim mantém o nome durante migração; nenhuma função quebra.
- **Risco**: webhook Z-API ainda recebendo callbacks até desligar no painel Z-API. **Mitigação**: `zapi-webhook` permanece ativo até confirmação; depois deletado.
- **Risco**: instância de notificação perder QR após deploy. **Mitigação**: criação inicial manual via XAlerts (1 clique) gera QR; só você escaneia uma vez.

---

## Pré-requisito antes do build
Confirmar: **qual número de WhatsApp** será usado para a inst. "Notificações EXA"? (o número que hoje envia via Z-API ou um novo dedicado?)
