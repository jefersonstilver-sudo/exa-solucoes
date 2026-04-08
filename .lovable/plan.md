

# Adicionar campo de Link da Reunião e Local com Google Autocomplete no CreateTaskModal

## O que será feito

Dois novos campos visíveis no formulário de criação de tarefa, logo após o seletor de Prédio (linha ~898):

### 1. Campo "Local do Evento" com Google Places Autocomplete
- Usa o componente `AddressAutocomplete` já existente (o mesmo da busca de prédios)
- Ao digitar "Hotel Viale", o Google sugere automaticamente o endereço completo
- Ao selecionar, preenche `localEvento` com o endereço formatado
- Visível para **todos os tipos de evento** (não apenas reunião)
- Ícone `MapPin` no label

### 2. Campo "Link da Reunião"
- Input simples para colar link do Google Meet, Zoom, Teams, etc.
- Visível apenas quando `tipoEvento === 'reuniao'` (faz sentido contextual)
- Ícone `Video` no label
- Placeholder: "https://meet.google.com/..."

## Alterações técnicas

**Arquivo: `src/components/admin/agenda/CreateTaskModal.tsx`**

1. Importar `AddressAutocomplete` de `@/components/ui/address-autocomplete`
2. Após o `BuildingSelector` (linha ~898), adicionar:
   - Bloco "Local do Evento" com `<AddressAutocomplete>` ligado ao state `localEvento` / `setLocalEvento`
   - Bloco "Link da Reunião" (condicional a `tipoEvento === 'reuniao'`) com `<Input>` ligado a `linkReuniao` / `setLinkReuniao`
3. Os states `localEvento` e `linkReuniao` já existem (linhas 139-140) e já são salvos no banco (`local_evento`, `link_reuniao`) — nenhuma mudança no fluxo de persistência

Nenhuma outra funcionalidade ou interface será alterada.

