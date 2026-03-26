

# Plano: Notificar novos contatos e botao de lembrete individual

## Problema

Quando um novo contato e adicionado a tarefa (na lista "Contatos WhatsApp"), ele nao aparece na secao "Confirmacoes" porque essa secao so mostra contatos que ja possuem registro em `task_read_receipts`. O usuario espera que:

1. Contatos selecionados mas ainda nao notificados aparecam na secao de Confirmacoes com status "Pendente" e um botao para enviar notificacao individual
2. Ao salvar com "Notificar ao salvar" ativado, os novos contatos recebam a notificacao normalmente (isso ja funciona, mas o toggle pode estar desligado)

## Mudancas

### `src/components/admin/agenda/EditTaskModal.tsx`

Na secao "Confirmacoes" (linha ~1122), apos listar os receipts existentes, adicionar uma sub-secao que:

1. **Cruza** `selectedNotifyContacts` (contatos selecionados na lista WhatsApp) com os `receipts` existentes para identificar contatos que foram selecionados mas **ainda nao foram notificados** (sem entrada em `task_read_receipts`)
2. **Renderiza** esses contatos pendentes com:
   - Icone de relogio cinza (status "Nao notificado")
   - Nome do contato
   - Botao `Send` individual que chama `handleSendReminder` passando apenas aquele contato
   - Label "Nao notificado" em cinza
3. **Separador visual** entre receipts existentes e contatos pendentes (label "Aguardando envio")

### Logica do botao individual

O botao de envio individual usara a funcao `handleSendReminder` ja existente (linha 637), passando um array com apenas o `compositeId` do contato. A funcao ja suporta receber `contactIds` como parametro e resolve os telefones via `allSelectableContacts`.

### Contatos que ja tem receipt

Esses ja possuem o botao de reenvio (RefreshCw, linha 1177) — nenhuma mudanca necessaria.

## Arquivos editados

1. `src/components/admin/agenda/EditTaskModal.tsx` — Adicionar sub-secao de contatos pendentes na area de Confirmacoes com botao de envio individual

