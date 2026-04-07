

# Fix: Envio Manual de Lembrete para Contatos Pendentes

## Problema Raiz

Na função `handleSendReminder` (linha 660-682 do `EditTaskModal.tsx`), quando já existem receipts (contatos já notificados), o código entra no branch `eventRegisteredContacts.length > 0` e tenta buscar o contato pelo ID do receipt. Mas os contatos pendentes ("Aguardando envio") passam um `compositeId` (ex: `alert:xxx`), que nunca será encontrado na lista de `eventRegisteredContacts` (que usa IDs de receipt). Resultado: `selectedPhones` fica vazio e a mensagem "Selecione ao menos um contato" aparece.

## Solução

### Arquivo: `src/components/admin/agenda/EditTaskModal.tsx`

**Alteração na função `handleSendReminder` (linhas 660-676):**

Modificar a lógica para verificar **ambas** as listas. Se o ID passado não for encontrado em `eventRegisteredContacts`, buscar em `allSelectableContacts` como fallback:

```
const idsToSend = contactIds || selectedReminderContacts;

// Try matching in event receipts first
let selectedPhones = eventRegisteredContacts
  .filter(c => idsToSend.includes(c.id))
  .map(c => ({ nome: c.name, telefone: c.phone }));

// Fallback: also check allSelectableContacts for pending contacts (compositeId)
if (selectedPhones.length === 0 || selectedPhones.length < idsToSend.length) {
  const fromSelectable = allSelectableContacts
    .filter(c => idsToSend.includes(c.compositeId))
    .map(c => ({ nome: c.nome, telefone: c.telefone }));
  
  // Merge without duplicates by phone
  const existingPhones = new Set(selectedPhones.map(p => p.telefone.replace(/\D/g, '')));
  for (const sp of fromSelectable) {
    if (!existingPhones.has(sp.telefone.replace(/\D/g, ''))) {
      selectedPhones.push(sp);
    }
  }
}
```

Isso garante que:
- Contatos já notificados (com receipt) continuam funcionando pelo ID do receipt
- Contatos pendentes ("Aguardando envio") são encontrados pelo `compositeId` no fallback
- O botão de envio individual (ícone de avião) para cada contato pendente funciona corretamente
- O botão "Enviar Lembrete" geral com popover de seleção também funciona para ambos os tipos

