

# Plano: Corrigir PATCH duplicado no global-toggle-ativo

## Problema

Quando o usuario troca o video ativo, o `global-toggle-ativo` e chamado **DUAS VEZES** para cada predio:

1. `setBaseVideoService()` → `notifyExternalAPI()` → `sync-video-status-to-aws` → loop predios → `global-toggle-ativo` ✅
2. `OrderDetails.tsx` (linhas 303-365) → loop predios → `global-toggle-ativo` ❌ (duplicado)

A segunda chamada conflita com a primeira na API externa, causando falha nos predios apos o primeiro (1110).

## Correcao

### 1. `src/pages/advertiser/OrderDetails.tsx`

**Remover** o bloco de linhas 303-369 que chama `global-toggle-ativo` diretamente. O `setBaseVideoService` ja faz isso internamente via `sync-video-status-to-aws`.

O codigo apos `if (result.success)` deve ir direto para o `toast.success` e `refreshSlots`.

### 2. `supabase/functions/sync-video-status-to-aws/index.ts`

Ja esta correto — loop por todos os predios com try/catch individual. Nenhuma alteracao necessaria.

## Arquivo alterado

1. `src/pages/advertiser/OrderDetails.tsx` — remover chamada duplicada ao `global-toggle-ativo`

