## Diagnóstico confirmado

Do I know what the issue is? Sim.

O problema não é a instância Evolution estar desconectada. Ela está conectada. O problema é que a migração ficou parcial e alguns fluxos ainda estão usando regras antigas da Z-API ou enviando telefone em formato incompatível com a Evolution.

### Causas encontradas

1. **Confirmação de agenda falhou por telefone sem DDI**
   - O log real de `zapi-send-message` mostra a confirmação do agendamento tentando enviar para `45998090000`.
   - A Evolution respondeu `exists:false` porque esperava `5545998090000`.
   - O lembrete chegou porque outro fluxo já estava usando telefone com `55`, mas a confirmação de criação não estava.

2. **Validação de WhatsApp/cadastro/2FA ainda chama Z-API direto**
   - `send-user-whatsapp-code` ainda busca `agents.zapi_config` e chama `https://api.z-api.io/.../send-text` diretamente.
   - `send-exa-verification-code` também chama Z-API direto.
   - Isso afeta: conta nova, validação de telefone, troca de WhatsApp, 2FA e validações internas antigas.

3. **Alguns fluxos de agenda ainda têm fallback invertido**
   - `task-notify-change` e `task-notify-cancelled` ainda preferem Z-API quando existe `zapi_config` no agente `exa_alert`.
   - Como o agente ainda tem configuração antiga no banco, esses fluxos continuam bypassando Evolution.

4. **Alertas importantes ainda não passaram pelo roteador Evolution**
   - Foram encontrados envios diretos para Z-API em funções como:
     - painéis offline (`monitor-panels`)
     - propostas (`notify-proposal-event`, `check-expired-proposals`, `send-proposal-whatsapp`)
     - escalonamentos (`notify-escalation`, `resend-escalation`)
     - alertas comerciais/financeiros/vendedores
     - cortesia/códigos/relatórios
   - Nem todos precisam ser migrados da mesma forma, porque Sofia/Eduardo/CRM legado ainda podem depender de Z-API. O foco será migrar tudo que usa `agentKey/key = exa_alert`.

## Plano de correção

### 1. Blindar o roteador central `zapi-send-message`

- Adicionar normalização obrigatória de telefone no próprio edge function:
  - `45998090000` → `5545998090000`
  - `+55...` → `55...`
  - números já internacionais válidos permanecem como estão
  - evitar erro com DDDs brasileiros que parecem código internacional, como `54`, `55` ou `56`, tratando primeiro números locais de 10/11 dígitos como Brasil.
- Usar essa normalização para Evolution e Z-API legado.
- Melhorar o log de falha para sempre registrar o telefone original e o telefone normalizado.
- Manter deduplicação, split de mensagem, registro em `evolution_logs` e persistência no CRM.

### 2. Corrigir confirmação de agenda

- Ajustar `task-notify-created` para enviar sempre o telefone normalizado via `zapi-send-message`.
- Garantir que `task_read_receipts` use o mesmo número normalizado.
- Validar com o caso real que falhou: telefone `45998090000` precisa sair como `5545998090000`.

### 3. Migrar validação de WhatsApp/cadastro/2FA para Evolution

- Em `send-user-whatsapp-code`:
  - preservar rate limit
  - preservar criação do código em `exa_alerts_verification_codes`
  - substituir chamada direta Z-API por chamada ao `zapi-send-message` com `agentKey: 'exa_alert'`
  - preservar respostas esperadas pelo frontend.
- Em `send-exa-verification-code`:
  - manter rate limit e gravação do código
  - substituir Z-API direto por `zapi-send-message`
  - manter compatibilidade com telas antigas de EXA Alerts/2FA.
- Não alterar `verify-user-whatsapp-code`, pois ele só valida código no banco e não envia WhatsApp.

### 4. Remover bypass de Z-API nos fluxos de agenda

- Em `task-notify-change` e `task-notify-cancelled`, remover a preferência por fetch direto Z-API.
- Enviar sempre por `zapi-send-message` quando for `exa_alert`.
- Preservar textos, recipients e logs existentes.

### 5. Migrar alertas automáticos críticos do EXA Alert

- Substituir chamadas diretas Z-API por `zapi-send-message` em funções de alerta do `exa_alert`, começando por:
  - `monitor-panels` para painéis offline
  - `notify-proposal-event` para propostas enviadas/visualizadas/aceitas/expiradas
  - funções de vendedor/pagamento/proposta aceita
  - alertas comerciais diários
  - currículo recebido
  - cortesia e relatórios automáticos que usam `exa_alert`
- Não mexer em funções cujo objetivo é administrar ou importar histórico da Z-API legado, como `fetch-zapi-history`, `sync-whatsapp-chats`, `zapi-import-history`, `configure-zapi-webhook`, `check-zapi-status`, salvo se forem usadas diretamente pelo EXA Alert de notificações.

### 6. Tratar botões e painéis offline sem perder funcionalidade

- Para mensagens com botões, adicionar suporte no roteador central para Evolution usando endpoint Evolution:
  - `/message/sendButtons/{instance}`
- Converter botões antigos da Z-API (`buttonActions`) para o formato Evolution (`buttons`).
- Para painéis offline, preservar:
  - mensagem do painel offline
  - botões de confirmação
  - IDs usados para rastrear quem confirmou
  - histórico em `panel_offline_alerts_history`
- Se a Evolution responder que o envio de botão não é suportado por aquela instância, fallback controlado para texto com opções numeradas, sem perder o alerta.

### 7. Migrar mídia quando usada pelo EXA Alert

- Atualizar `zapi-send-media` para também rotear `agentKey: 'exa_alert'` pela Evolution:
  - `/message/sendMedia/{instance}`
  - payload com `number`, `mediatype`, `media`, `caption`, `fileName` quando aplicável.
- Manter Z-API legado para Sofia/Eduardo/CRM que ainda dependem dela.

### 8. Auditoria final 0–100%

- Rodar nova busca por chamadas diretas `api.z-api.io`.
- Classificar cada uso restante como:
  - **mantido propositalmente**: Z-API legado Sofia/Eduardo/importação/webhook/status
  - **migrado**: qualquer envio operacional do `exa_alert`
- Adicionar comentários curtos apenas onde necessário para evitar regressão.

### 9. Deploy e validação

- Deploy das edge functions alteradas.
- Validar com testes reais controlados:
  - envio simples via `zapi-send-message` para número sem `55`
  - confirmação de agenda criada
  - código de cadastro/validação WhatsApp
  - código 2FA
  - alerta de painel offline em modo teste, se disponível
- Conferir `evolution_logs` depois dos testes para garantir `status = sent` e provider Evolution.

## O que não será alterado

- Não vou mexer na UI, layout ou fluxo visual.
- Não vou remover Z-API de Sofia/Eduardo/CRM legado onde ainda for necessário.
- Não vou alterar regras de negócio de agenda, propostas, painéis ou cadastro; apenas o transporte WhatsApp e normalização de telefone.

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>