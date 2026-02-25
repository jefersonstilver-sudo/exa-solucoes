

# Incluir TODOS os campos preenchidos nas notificacoes WhatsApp

## Problema
A mensagem WhatsApp enviada pelo `task-notify-created` nao inclui todos os campos preenchidos da tarefa. Campos como **link da reuniao**, **prioridade**, **lead/contato vinculado**, **propostas vinculadas** e **horario de inicio** sao ignorados, resultando em notificacoes incompletas.

Alem disso, o envio de **lembrete** (handleSendReminder no EditTaskModal) nao envia `responsaveis_nomes`, mesmo que a notificacao inicial envie.

## Campos que faltam hoje

| Campo | Existe no form? | Enviado ao Edge Function? | Exibido na mensagem? |
|-------|-----------------|--------------------------|---------------------|
| link_reuniao | Sim | Nao | Nao |
| prioridade | Sim | Nao | Nao |
| horario_inicio | Sim | Parcial (como fallback) | Parcial |
| Lead/Contato (nome, empresa, telefone) | Sim | Nao | Nao |
| Propostas vinculadas | Sim | Nao | Nao |
| responsaveis_nomes (no lembrete) | Sim | Nao | Nao |

## Solucao

### 1. Edge Function `task-notify-created/index.ts`

**Aceitar novos campos no payload:**
- `link_reuniao` - Link do Google Meet/Zoom/Teams
- `prioridade` - Prioridade da tarefa (alta, media, baixa, urgente)
- `horario_inicio` - Horario de inicio separado
- `lead_nome` - Nome do lead/contato vinculado
- `lead_empresa` - Empresa do lead
- `lead_telefone` - Telefone do lead
- `propostas_info` - Array com numeros/status das propostas vinculadas

**Atualizar `buildRichMessage` para incluir:**
```text
// Horario de inicio e fim separados
"🕐 Inicio: 09:00 | Limite: 10:00"

// Link da reuniao
"🔗 Link: https://meet.google.com/abc-xyz"

// Prioridade (quando alta ou urgente)
"🔴 Prioridade: URGENTE"

// Lead/Contato vinculado
"🤝 Contato: Joao Silva - Empresa XYZ"
"📱 Tel: (45) 99999-9999"

// Propostas
"📄 Propostas: #1234 (Aprovada), #5678 (Em analise)"
```

### 2. Frontend - `EditTaskModal.tsx`

**Na notificacao ao salvar (onSuccess, linhas 463-480):**
Adicionar os campos que faltam no body:
- `link_reuniao: linkReuniao || null`
- `prioridade: prioridade || null`
- `horario_inicio: horarioInicio || null`
- `lead_nome`, `lead_empresa`, `lead_telefone` extraidos do `selectedLead`
- `propostas_info` extraido do `selectedPropostas` + `leadPropostas`

**No handleSendReminder (linhas 560-576):**
Adicionar os mesmos campos que faltam, incluindo `responsaveis_nomes` que ja e enviado na notificacao inicial mas esta ausente no lembrete.

### 3. Frontend - `CreateTaskModal.tsx`

**Na notificacao ao criar (linhas 501-518):**
Adicionar os mesmos campos extras no body:
- `link_reuniao: linkReuniao || null`
- `prioridade: prioridade || null`
- `horario_inicio: horarioInicio || null`
- `lead_nome`, `lead_empresa`, `lead_telefone` do `selectedLead`
- `propostas_info` do `selectedPropostas` + `leadPropostas`

## O que NAO muda
- Nenhum outro componente, modal ou pagina
- A estrutura do banco de dados permanece igual
- Os outros edge functions permanecem iguais
- A UI dos modais permanece identica
- A logica de selecao de contatos permanece igual
