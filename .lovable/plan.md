

# Renomear para "Escritório EXA MÍDIA" + Corrigir Endereço

## O que será feito

1. **Renomear** todas as ocorrências de `"Escritório Indexa"` para `"Escritório EXA MÍDIA"` (strings de comparação, labels e valores setados)
2. **Corrigir o endereço** exibido no checkbox de `"Rua Bartolomeu de Gusmão, 901 — Foz do Iguaçu"` para `"Av. Paraná, 974 - Sala 03, Andar 03 - Centro, Foz do Iguaçu - PR"`

## Arquivos a modificar

### Frontend (2 arquivos)
- **`src/components/admin/agenda/CreateTaskModal.tsx`** — substituir todas as ocorrências de `'Escritório Indexa'` por `'Escritório EXA MÍDIA'` e corrigir o endereço na `<p>` descritiva
- **`src/components/admin/agenda/EditTaskModal.tsx`** — mesma substituição e correção de endereço

### Edge Functions (5 arquivos) — substituir `'Escritório Indexa'` por `'Escritório EXA MÍDIA'`
- `supabase/functions/task-notify-created/index.ts`
- `supabase/functions/task-notify-change/index.ts`
- `supabase/functions/task-notify-cancelled/index.ts`
- `supabase/functions/task-reminder-scheduler/index.ts`
- `supabase/functions/zapi-webhook/index.ts`

Após editar, as 5 edge functions serão redeployadas. O link do Google Maps permanece inalterado.

