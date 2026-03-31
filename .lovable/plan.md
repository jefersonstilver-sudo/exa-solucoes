

# Plano: Botão de Sininho + Resumo Diário de Tarefas via WhatsApp

## O que será construído

Um botão com ícone de sino (Bell) na página de tarefas que abre um modal para configurar **notificações de resumo diário**. Nesse modal, o usuário pode:
- Selecionar contatos existentes da tabela `exa_alerts_directors`
- Adicionar números manuais
- Definir um ou mais horários de envio
- Cada contato selecionado recebe diariamente um resumo completo de todas as tarefas do dia

## Arquitetura

```text
┌─────────────────────────┐
│  CentralTarefasPage     │
│  🔔 (botão sininho)     │──► DailySummaryConfigModal
│                         │     ├── Lista de horários (add/remove)
│                         │     ├── Contatos do exa_alerts_directors (checkbox)
│                         │     └── Adicionar número manual
└─────────────────────────┘

┌─────────────────────────┐
│  exa_alerts_config      │  config_key = 'agenda_resumo_diario'
│  config_value = {       │  config_value = JSON com horários e contatos
│    ativo: true,         │
│    horarios: ["08:00",  │
│               "18:00"], │
│    contatos: [          │
│      { id, nome, tel }, │  ← do exa_alerts_directors
│      { nome, tel },     │  ← manual
│    ]                    │
│  }                      │
└─────────────────────────┘

┌─────────────────────────┐
│  task-reminder-scheduler│  (cron a cada 2min)
│  Nova seção:            │
│  - Lê config 'agenda_  │
│    resumo_diario'       │
│  - Se horário bate,     │
│    busca todas as tasks │
│    do dia e envia resumo│
│    formatado via Z-API  │
└─────────────────────────┘
```

## Mudanças

### 1. Novo componente: `src/pages/admin/tarefas/components/DailySummaryConfigModal.tsx`
- Modal (Dialog desktop / Drawer mobile) com:
  - Toggle ativo/inativo
  - Lista de horários configurados com botão de adicionar/remover
  - Lista de contatos ativos do `exa_alerts_directors` com checkboxes para selecionar
  - Campo para adicionar número manual (nome + telefone)
  - Salva tudo em `exa_alerts_config` com `config_key = 'agenda_resumo_diario'`

### 2. Alterar: `src/pages/admin/tarefas/CentralTarefasPage.tsx`
- Adicionar botão de sino (Bell) ao lado do botão de engrenagem (Settings)
- Abrir o `DailySummaryConfigModal` ao clicar
- Visível para `super_admin` (mesmo controle do botão de engrenagem existente)

### 3. Alterar: `supabase/functions/task-reminder-scheduler/index.ts`
- Adicionar nova seção no início do fluxo (antes dos lembretes individuais):
  1. Ler config `agenda_resumo_diario` do `exa_alerts_config`
  2. Se ativo e algum horário bate (±2min tolerância), buscar todas as tasks do dia
  3. Montar mensagem de resumo formatada com todas as tarefas (título, horário, tipo, local, link)
  4. Enviar via Z-API para cada contato configurado
  5. Registrar em `task_alert_logs` com `alert_type = 'resumo_diario'` para evitar duplicatas

### Formato da mensagem de resumo
```
📋 *Resumo do dia — Segunda-feira, 31/03/2026*

Você tem *5 compromissos* hoje:

1️⃣ *09:00* — Reunião com cliente
   📍 Sala 3
   🔗 https://meet.google.com/xxx

2️⃣ *10:30* — Revisão de contrato
   📝 Verificar cláusulas pendentes

3️⃣ *14:00* — Entrega de relatório
   ⚡ Prioridade: Alta

4️⃣ *16:00* — Call com fornecedor
   🔗 https://zoom.us/xxx

5️⃣ *18:00* — Fechamento financeiro

Bom dia! 🚀
```

### O que NÃO muda
- Nenhuma UI, funcionalidade ou workflow existente
- Modal de notificações existente (engrenagem) permanece igual
- Outras edge functions não são alteradas

