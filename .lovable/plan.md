
# Seletor de Destinatarios no Enviar Lembrete + Contatos do Compromisso

## O Problema
1. O botao "Enviar Lembrete" envia para todos os contatos selecionados sem perguntar -- nao permite escolher para quem enviar naquele momento
2. A secao "Contatos WhatsApp" mostra TODOS os admins do sistema, em vez de mostrar os responsaveis daquele compromisso especifico

## Solucao

### Mudanca 1: Popover de selecao no "Enviar Lembrete"
Ao clicar em "Enviar Lembrete", em vez de disparar imediatamente, abre um pequeno Popover com:
- Lista dos responsaveis deste compromisso (com checkbox)
- Botao "Selecionar Todos" / "Desmarcar Todos"
- Botao "Enviar" que dispara apenas para os selecionados
- Contagem de selecionados (ex: "2 de 4 selecionados")

### Mudanca 2: Contatos WhatsApp mostra responsaveis do compromisso
A secao "Contatos WhatsApp" (usada para "Notificar ao salvar") passa a mostrar:
- **Primeiro**: Os responsaveis atribuidos a ESTE compromisso (vindos de `task_responsaveis`) -- marcados com badge "Responsavel"
- **Depois**: Os demais admins com telefone (como opcao adicional, em secao separada "Outros contatos")

### Arquivo unico modificado
- `src/components/admin/agenda/EditTaskModal.tsx`

### Detalhes tecnicos

**Popover no botao Enviar Lembrete:**
```text
- Novo state: reminderPopoverOpen (boolean)
- Novo state: selectedReminderContacts (string[]) -- IDs dos contatos para o lembrete
- O Popover usa o componente Popover do Radix ja importado no projeto
- Lista filtra adminUsers que tem telefone + sao responsaveis do task
- Botao "Enviar" dentro do Popover chama handleSendReminder com os contatos selecionados
```

**Contatos WhatsApp contextualizados:**
```text
- Extrair responsaveis_ids do task (via task_responsaveis)
- Dividir a lista em 2 grupos:
  1. Responsaveis deste compromisso (adminUsers cujo ID esta em task_responsaveis)
  2. Outros admins com telefone
- Mostrar badge visual "Responsavel" nos que sao do compromisso
```

**Impacto:** Apenas mudancas visuais/UX no EditTaskModal. Nenhum outro componente, workflow ou funcionalidade e afetado.
