

# Plano: Melhorar notificação de reagendamento com informações completas

## Problema
A notificação WhatsApp de alteração de tarefa (imagem enviada) tem vários problemas:
1. **Horário antigo com formato inconsistente** — mostra `23:39:00 → 23:45` (um com segundos, outro sem)
2. **Sem data completa** — não mostra a data (dia/mês/ano), só o horário
3. **Sem descrição** — mesmo quando existe
4. **Sem local/link** — mesmo quando preenchido
5. **Horário antigo não fica "riscado"** — não fica claro o que mudou

## Solução

### Arquivo: `supabase/functions/task-notify-change/index.ts`

Reformular a mensagem de notificação de alteração:

1. **Buscar dados completos da tarefa** no banco (descricao, local_evento, link_reuniao, data_prevista, horario_inicio) — atualmente só recebe o que o caller envia
2. **Formatar horários consistentemente** — sempre `HH:MM` (cortar segundos com `.slice(0,5)`)
3. **Mostrar data SEMPRE** — mesmo que só o horário tenha mudado, exibir a data completa do evento
4. **Usar formato visual claro** para mudanças: `~~antigo~~ → novo` (WhatsApp suporta tachado com `~`)
5. **Incluir descrição, local e link** quando existirem

**Mensagem reformulada:**
```
🔄 *Compromisso reagendado*

*teste alarme*

📅 Data: 13/04/2026
🕐 Horário: ~23:39~ → *23:45*
👤 Alterado por: Jefferson Silver

📍 Endereço tal
🔗 https://meet.google.com/xxx
📝 Descrição do evento

⚠️ Por favor, atualize sua agenda.
```

### Arquivo: `src/components/admin/agenda/EditTaskModal.tsx`

Enviar campos adicionais no body da chamada `task-notify-change`:
- `descricao`
- `local_evento`
- `link_reuniao`

### Arquivo: `supabase/functions/task-follow-up-response/index.ts`

Melhorar as mensagens de reagendamento via WhatsApp (linhas 262-283):
- Buscar `descricao`, `local_evento`, `link_reuniao` no select da task (linha 119)
- Incluir esses campos nas mensagens de confirmação de reagendamento
- Formatar horários sem segundos

### O que NÃO muda
- UI do sistema, modal de edição, calendário
- Outras notificações (criação, lembretes) já foram corrigidas anteriormente

