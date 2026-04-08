

# Adicionar Link do Google Maps na Notificação WhatsApp

## Contexto

A notificação WhatsApp mostra o local do evento como texto puro (ex: "📍 Local: Av. Jorge Schimmelpfeng, 232 - Centro, Foz do Iguaçu, PR"). O usuário quer que inclua um link clicável para abrir direto no Google Maps.

## Solução

Modificar as 4 Edge Functions que enviam notificações com `local_evento` para:
1. Mostrar o nome/endereço completo do local
2. Adicionar um link do Google Maps logo abaixo (`https://www.google.com/maps/search/?api=1&query=ENDEREÇO_ENCODED`)

### Formato atual:
```
📍 Local: Av. Jorge Schimmelpfeng, 232 - Centro, Foz do Iguaçu, PR
```

### Formato novo:
```
📍 Local: Av. Jorge Schimmelpfeng, 232 - Centro, Foz do Iguaçu, PR
🗺️ Ver no Maps: https://www.google.com/maps/search/?api=1&query=Av.+Jorge+Schimmelpfeng+232+Centro+Foz+do+Iguaçu+PR
```

O link usa `encodeURIComponent(local_evento)` para gerar a URL — funciona em qualquer dispositivo e abre direto no Google Maps.

## Arquivos a modificar

1. **`supabase/functions/task-notify-created/index.ts`** (linha 98-100) — notificação de tarefa criada
2. **`supabase/functions/task-notify-change/index.ts`** — notificação de alteração
3. **`supabase/functions/task-notify-cancelled/index.ts`** — notificação de cancelamento
4. **`supabase/functions/task-reminder-scheduler/index.ts`** (linhas 150, 493) — lembretes diários
5. **`supabase/functions/zapi-webhook/index.ts`** (linhas 384, 779) — confirmação de recebimento

Em cada arquivo, onde aparece:
```typescript
if (params.local_evento) {
  message += `📍 Local: ${params.local_evento}\n`;
}
```

Trocar por:
```typescript
if (params.local_evento) {
  message += `📍 Local: ${params.local_evento}\n`;
  message += `🗺️ Ver no Maps: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(params.local_evento)}\n`;
}
```

Mesma lógica para as variações (`t.local_evento`, `taskData?.local_evento`, `finalLocal`, etc.) em cada função.

## Impacto

- Nenhuma mudança na UI ou no fluxo de criação de tarefas
- Apenas o texto da mensagem WhatsApp é enriquecido com o link
- O link funciona em qualquer celular — abre o Google Maps app ou o navegador

