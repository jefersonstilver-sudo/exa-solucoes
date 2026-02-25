

# Unificar Contatos + Corrigir Layout do CreateTaskModal

## Problemas Identificados

1. **Contatos externos (ex: Joao) nao aparecem** -- A secao "Contatos com WhatsApp registrado" (linha 1237-1278) so busca da tabela `users`. Contatos manuais de `exa_alerts_directors` nao sao listados.
2. **Modal muito estreito** -- `sm:max-w-[550px]` (linha 1347) limita o modal a 550px, ficando apertado com tantos campos.
3. **Fundo transparente/bugado** -- O DialogContent herda estilos de glassmorphism que causam transparencia indesejada.

## Solucao

### Arquivo unico: `src/components/admin/agenda/CreateTaskModal.tsx`

### 1. Nova query para contatos de alerta
Adicionar um `useQuery` para buscar contatos ativos de `exa_alerts_directors`:
```text
const { data: alertContacts = [] } = useQuery({
  queryKey: ['agenda-alert-contacts'],
  queryFn: async () => {
    const { data } = await supabase
      .from('exa_alerts_directors')
      .select('id, nome, telefone, ativo')
      .eq('ativo', true)
      .order('nome');
    return data || [];
  }
});
```

### 2. Lista unificada de contatos selecionaveis
Criar um array combinado que junta admins com telefone + contatos de alerta, deduplicando por telefone. Cada item tera um `compositeId` (ex: `admin:userId` ou `alert:alertId`) para distinguir a origem.

O state `selectedNotifyContacts` passa a armazenar esses IDs compostos. A inicializacao do criador tambem usa o formato composto.

### 3. UI categorizada na secao "Contatos com WhatsApp"
Dividir em dois grupos visuais:
- **Equipe** (admins com telefone) -- com badge azul "Admin"
- **Contatos Externos** (da tabela `exa_alerts_directors`) -- com badge verde "Externo"

### 4. Ajuste no payload de notificacao
No `onSuccess`, mapear os IDs compostos de volta para `{nome, telefone}` usando o array unificado, garantindo que tanto admins quanto contatos externos sejam notificados.

### 5. Modal mais largo
Alterar `sm:max-w-[550px]` para `sm:max-w-[700px]` no DialogContent.

### 6. Fundo solido
Adicionar `bg-background` explicito ao DialogContent para evitar transparencia:
```text
<DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-background">
```

## O que NAO muda
- Nenhum outro componente, modal ou pagina e alterado
- O edge function `task-notify-created` permanece igual (ja recebe `specific_contacts` como `{nome, telefone}`)
- O `ManageAlertContactsModal` permanece igual
- O `EditTaskModal` nao e alterado nesta tarefa
- Toda a logica de formulario, responsaveis, departamentos, etc. permanece intacta

