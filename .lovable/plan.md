

# Corrigir Erro de Salvamento + Adicionar Notificacoes WhatsApp no CreateTaskModal

## Problema Identificado

O erro `invalid input syntax for type uuid: "proposal-d4d59a42-084c-48e4-bacc-391c7f56d6a2"` acontece porque quando um lead vem da tabela `proposals` (e nao de `contacts`), o ID e prefixado com `proposal-` (linha 211: `id: 'proposal-${p.id}'`). Esse valor e passado diretamente para `cliente_id` (linha 353) que espera um UUID valido.

## Alteracoes

### Arquivo: `src/components/admin/agenda/CreateTaskModal.tsx`

**Correcao 1 - Bug do UUID (linha 353)**:
- Antes de salvar, verificar se `selectedLead?.id` comeca com `proposal-`. Se sim, passar `null` para `cliente_id` (pois nao e um contato real, e sim um cliente de proposta).
- Alternativa mais robusta: extrair o UUID real e salvar em um campo separado ou simplesmente ignorar o prefixo.

```typescript
// De:
cliente_id: selectedLead?.id || null,

// Para:
cliente_id: selectedLead?.id && !selectedLead.id.startsWith('proposal-') 
  ? selectedLead.id 
  : null,
```

**Correcao 2 - Adicionar secao de Notificacoes WhatsApp**:
Replicar a mesma secao que ja existe no `EditTaskModal.tsx` (linhas 655-690), incluindo:

- Novos estados: `notifyOnSave` (default `true` para criacao), `autoFollowup` (default `true`), `alertContactsOpen`
- Import de `ManageAlertContactsModal`
- Collapsible "Notificacoes WhatsApp" com:
  - Toggle "Notificar contatos ao salvar"
  - Toggle "Follow-up automatico (1h apos)"
  - Botao "Gerenciar Contatos" que abre o `ManageAlertContactsModal`
  - Exibicao dos contatos admin que ja tem numero de WhatsApp registrado (usando a query de `adminUsers` que ja existe, filtrando por `u.telefone`)
- Ao salvar com sucesso (`onSuccess`), se `notifyOnSave` estiver ativo, invocar `task-notify-created` com os dados da tarefa
- Incluir `notify_on_save` e `auto_followup` nos campos do insert

**Secao de contatos com WhatsApp inline**:
Dentro do collapsible de notificacoes, mostrar uma lista compacta dos usuarios admin que possuem telefone cadastrado, com checkbox para selecionar quais devem receber a notificacao. Isso reutiliza os dados de `adminUsers` ja carregados.

### Nenhum outro arquivo e alterado

A UI existente, filtros, agenda, e demais funcionalidades permanecem intactas.
