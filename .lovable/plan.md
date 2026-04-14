

# Checkbox "Escritório Indexa" no Local do Evento

## O que será feito

Adicionar um checkbox destacado abaixo do campo "Local do Evento" em ambos os modais (criar e editar tarefa). Quando marcado, preenche automaticamente o local com "Escritório Indexa" e garante que o link fixo `https://maps.app.goo.gl/g5zDXfK66siRq6W76` seja enviado nas notificações WhatsApp. Visível em **todos os tipos de evento** (não apenas reunião).

## Arquivos a modificar

### 1. `src/components/admin/agenda/CreateTaskModal.tsx`
- Adicionar estado `isIndexa` (boolean, default false)
- Abaixo do `AddressAutocomplete`, inserir checkbox estilizado com label em destaque:
  - Checkbox + "📍 Local no Escritório Indexa" com fundo highlight (`bg-primary/10 border border-primary/30 rounded-lg p-3`)
  - Quando marcado: seta `localEvento = "Escritório Indexa"` e desabilita o campo de endereço
  - Quando desmarcado: limpa `localEvento` e reabilita o campo
- Ao carregar, se `localEvento === "Escritório Indexa"`, marca o checkbox automaticamente

### 2. `src/components/admin/agenda/EditTaskModal.tsx`
- Mesma lógica: checkbox "Escritório Indexa" abaixo do campo Local/Endereço
- Ao carregar task, se `local_evento === "Escritório Indexa"`, marca checkbox

### 3. Edge Functions (notificações WhatsApp)
Nos 4 arquivos que geram links de Maps a partir de `local_evento`:
- `supabase/functions/task-notify-created/index.ts`
- `supabase/functions/task-notify-change/index.ts`
- `supabase/functions/task-reminder-scheduler/index.ts`
- `supabase/functions/zapi-webhook/index.ts`

Adicionar verificação: se `local_evento === "Escritório Indexa"`, usar o link fixo `https://maps.app.goo.gl/g5zDXfK66siRq6W76` em vez do link auto-gerado `https://www.google.com/maps/search/?api=1&query=...`.

## Exemplo visual do checkbox

```text
┌─────────────────────────────────────────┐
│ 📍 Local do Evento                     │
│ [  Buscar local (ex: Hotel Viale...)  ] │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ☑ 📍 Local no Escritório Indexa    │ │
│ │    Rua ..., Foz do Iguaçu          │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Impacto
- Nenhuma alteração em funcionalidades existentes
- Nenhuma migration necessária
- Checkbox visível em todos os tipos de evento

