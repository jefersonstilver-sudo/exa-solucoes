

# Corrigir Lista de Contatos WhatsApp - Tornar Selecionavel

## Problema
A lista de contatos com WhatsApp no CreateTaskModal mostra todos os admins com telefone como itens estaticos (nao clicaveis). O usuario nao consegue adicionar ou remover contatos da notificacao. Todos aparecem "travados".

## Solucao
Transformar a lista em checkboxes interativos onde:
- O **criador da tarefa** vem pre-selecionado (mas pode ser desmarcado)
- Os demais contatos podem ser livremente marcados/desmarcados
- Um indicador visual "(Criador)" aparece ao lado do usuario logado

## Alteracoes

### Arquivo: `src/components/admin/agenda/CreateTaskModal.tsx`

1. **Novo estado** `selectedNotifyContacts` (array de IDs) - inicializado com o ID do usuario logado (criador)

2. **Substituir a lista estatica** (linhas 1184-1192) por checkboxes clicaveis:
   - Cada admin com telefone vira uma linha com Checkbox
   - Criador marcado por padrao + badge "(Criador)"  
   - Clique alterna entre selecionado/nao selecionado

3. **Passar os contatos selecionados** na chamada ao `task-notify-created` para que apenas os escolhidos recebam a notificacao

