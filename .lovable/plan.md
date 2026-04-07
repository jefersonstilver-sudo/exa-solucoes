

# Fix: Notificação de Reagendamento com Horários Completos

## Problema
Quando um compromisso é alterado (ex: horário limite muda de 18:00 para 19:00), a notificação mostra apenas o campo que mudou ("⏰ Limite: 18:00 → 19:00"), sem mostrar o horário de início. Isso confunde os destinatários, que não sabem o horário completo da reunião.

## Solução
Alterar a Edge Function `task-notify-change` para **sempre** exibir o bloco completo de horários (início e fim), independente de qual campo mudou, e destacar visualmente o que foi alterado.

### Formato atual (confuso):
```
📅 Data: Terça-feira, 07/04/2026
⏰ Limite: 18:00 → 19:00
```

### Formato novo (claro):
```
📅 Data: Terça-feira, 07/04/2026
🕐 Início: 17:00
⏰ Término: ~18:00~ → *19:00*
```

Ou se só o início mudou:
```
📅 Data: Terça-feira, 07/04/2026
🕐 Início: ~17:00~ → *17:30*
⏰ Término: 19:00
```

## Alteração Técnica

### Arquivo: `supabase/functions/task-notify-change/index.ts`

**Linhas 126-135** — Substituir a lógica que mostra apenas os campos alterados por uma lógica que:

1. Sempre mostra **ambos** os horários (início e término)
2. Usa strikethrough + bold apenas no campo que foi alterado
3. Busca os valores atuais do banco (`taskData.horario_inicio`, `taskData.horario_limite`) como fallback para exibir o horário que não mudou
4. Renomear "Limite" para "Término" para clareza

Lógica resumida:
- Se `horario_inicio` mudou → mostrar `🕐 Início: ~antigo~ → *novo*` + `⏰ Término: valor_atual`
- Se `horario_limite` mudou → mostrar `🕐 Início: valor_atual` + `⏰ Término: ~antigo~ → *novo*`
- Se ambos mudaram → ambos com strikethrough
- Se nenhum mudou mas existem valores → mostrar ambos fixos

