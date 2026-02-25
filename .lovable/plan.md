
# Corrigir Popover "Enviar Lembrete" para mostrar contatos do evento

## Problema
O popover "Enviar Lembrete" (linhas 1012-1040 do EditTaskModal.tsx) usa `adminUsersWithPhone` -- que sao apenas os 2 admins com telefone na tabela `users` (Jeferson e Jeniffer). Deveria mostrar os 6 contatos que JA foram notificados neste evento, que estao nos `receipts` (task_read_receipts).

Alem disso, ha um mismatch de IDs: o `handleSendReminder` usa `compositeId` (ex: `admin:xxx`), mas o popover usa `u.id` (raw ID). Entao mesmo selecionando, o envio falha silenciosamente porque nenhum ID bate.

## Solucao

### Arquivo unico: `src/components/admin/agenda/EditTaskModal.tsx`

### 1. Derivar lista de contatos do evento a partir dos receipts
Criar um `useMemo` que extrai contatos unicos dos `receipts` (ja carregados no componente):

```text
const eventRegisteredContacts = useMemo(() => {
  if (!receipts || receipts.length === 0) return [];
  const seen = new Set<string>();
  return receipts
    .filter(r => {
      const phone = r.contact_phone.replace(/\D/g, '');
      if (seen.has(phone)) return false;
      seen.add(phone);
      return true;
    })
    .map(r => ({
      id: r.id,
      phone: r.contact_phone,
      name: r.contact_name || r.contact_phone,
    }));
}, [receipts]);
```

### 2. Atualizar o popover (linhas 986-1051)
- Contador: `selectedReminderContacts.length de eventRegisteredContacts.length`
- "Selecionar Todos": usa `eventRegisteredContacts.map(c => c.id)`
- Lista: itera sobre `eventRegisteredContacts` em vez de `adminUsersWithPhone`
- Cada checkbox usa `c.id` (receipt ID) como chave de selecao

### 3. Atualizar handleOpenReminderPopover (linha 638)
Pre-selecionar todos os contatos do evento:
```text
setSelectedReminderContacts(eventRegisteredContacts.map(c => c.id));
```

### 4. Atualizar handleSendReminder (linhas 522-525)
Em vez de mapear via `allSelectableContacts` com compositeId, mapear diretamente dos `eventRegisteredContacts`:
```text
const selectedPhones = eventRegisteredContacts
  .filter(c => idsToSend.includes(c.id))
  .map(c => ({ nome: c.name, telefone: c.phone }));
```

### 5. Fallback quando nao ha receipts
Se `eventRegisteredContacts` estiver vazio (evento nunca notificado), usar `allSelectableContacts` como fallback para permitir o primeiro envio.

## O que NAO muda
- Nenhum outro componente, modal ou pagina
- A secao "Ao Salvar" com contatos WhatsApp permanece igual
- O edge function `task-notify-created` permanece igual
- O CreateTaskModal permanece igual
- A secao de NOTIFICACOES (monitor de receipts) permanece igual
