

# Plano: Campo de Local/Link disponível para todos os tipos de evento

## Problema
Os campos `local_evento` e `link_reuniao` existem no banco e já são enviados nas notificações WhatsApp, mas no modal de edição (EditTaskModal) eles só aparecem condicionalmente:
- `link_reuniao` → só para tipo "reunião"
- `local_evento` → só para tipo "compromisso"

O usuário precisa poder preencher local ou link de reunião em **qualquer tipo de evento**.

## Solução

### Arquivo: `src/components/admin/agenda/EditTaskModal.tsx`

**Substituir os dois campos condicionais** (linhas 1039-1051) por uma seção única sempre visível com dois inputs:

1. **📍 Local / Endereço** — campo `local_evento`, sempre visível, com placeholder "Endereço, sala, Google Maps..."
2. **🔗 Link da reunião** — campo `link_reuniao`, sempre visível, com placeholder "https://meet.google.com/..."

Layout: dois campos empilhados em uma seção "Local & Link", compactos (h-9), visíveis para todos os tipos de evento.

### Arquivo: `supabase/functions/zapi-webhook/index.ts`

Nas duas mensagens de recibo de confirmação (linhas ~358 e ~741), adicionar `link_reuniao` ao `select` e incluir na mensagem:
```
if (taskData?.link_reuniao) receiptMsg += `🔗 ${taskData.link_reuniao}\n`;
```

### O que já funciona (NÃO muda)
- `task-notify-created` — já envia local_evento e link_reuniao
- `task-reminder-scheduler` — já envia ambos
- Nenhuma outra UI, funcionalidade ou tabela é alterada

