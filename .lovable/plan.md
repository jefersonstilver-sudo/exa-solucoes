
# Adicionar botao de engrenagem para editar telefone em cada contato na lista de notificacoes

## Problema
Na lista de NOTIFICACOES dentro do EditTaskModal, os contatos aparecem com status (Enviado, Entregue, Confirmado), mas nao ha como corrigir o numero de telefone diretamente ali. Se um contato nao recebeu a mensagem por numero errado, o usuario precisa ir ate outro lugar para corrigir.

## Solucao
Adicionar um botao de engrenagem (icone `Settings2` ou `Pencil`) em cada linha de receipt na secao de notificacoes. Ao clicar, abre um campo inline para editar o telefone daquele contato, igual ao que ja existe na area de "Contatos de Alerta" (linhas 1323-1365 do EditTaskModal).

## Fluxo do usuario

```text
[Jeniffer Aireliza Benites Belle] [Enviado] [🔄] [⚙️]
                                                   |
                                              clique na ⚙️
                                                   |
                                                   v
[Jeniffer] [(45) 99999-9999  ] [✓] [✗] [🔄]
                                    |
                               salvar ou cancelar
```

## Mudancas tecnicas

### Arquivo: `src/components/admin/agenda/EditTaskModal.tsx`

**1. Novo estado para edicao inline nos receipts:**
- Reutilizar os estados existentes `editingContactId` e `editContactPhone` (ja existem no componente)
- Diferenciar contexto usando um prefixo: `receipt:PHONE` como ID para saber que esta editando um receipt

**2. Nova funcao `handleSaveReceiptPhone`:**
- Recebe o `contact_phone` antigo e o novo telefone
- Busca na tabela `exa_alerts_directors` por telefone correspondente e atualiza
- Busca na tabela `users` por telefone correspondente e atualiza
- Atualiza tambem o `contact_phone` no proprio `task_read_receipts` para manter consistencia
- Invalida queries de receipts e alert-contacts

**3. Atualizar renderizacao dos receipts (linhas 995-1037):**
- Adicionar botao com icone `Pencil` (engrenagem) ao lado do botao de reenvio
- Ao clicar, mostra campo de input inline com o telefone atual, botoes de salvar (Check) e cancelar (X)
- Mesmo visual e comportamento do editor inline que ja existe na area de contatos de alerta

### Logica de identificacao do contato:
- O receipt tem `contact_phone` - usar esse telefone para localizar o contato na tabela `exa_alerts_directors` (campo `telefone`) ou `users` (campo `telefone`)
- Atualizar na tabela de origem + no receipt para refletir imediatamente

## O que NAO muda
- Nenhum outro componente, pagina ou modal
- A logica de criacao/edicao de tarefas permanece igual
- As notificacoes WhatsApp (Edge Function) permanecem iguais
- O popover de "Enviar Lembrete" permanece igual
- A edicao inline existente nos contatos de alerta permanece igual
