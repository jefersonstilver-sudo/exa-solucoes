

# Plano: Adicionar prefixo `/propagandas` no endpoint de delete

## Problema

As duas Edge Functions usam `/admin/delete-propaganda/{client_id}` mas o endpoint correto tem o prefixo `/propagandas/`:
`/propagandas/admin/delete-propaganda/{client_id}`

## Correções

### 1. `supabase/functions/delete-video-from-external-api/index.ts` (linha 69)
Mudar URL de:
`http://15.228.8.3:8000/admin/delete-propaganda/${clientId}`
para:
`http://15.228.8.3:8000/propagandas/admin/delete-propaganda/${clientId}`

### 2. `supabase/functions/sync-buildings-external-api/index.ts` (linha 251)
Mudar URL de:
`${EXTERNAL_API_BASE}/admin/delete-propaganda/${prefix}`
para:
`${EXTERNAL_API_BASE}/propagandas/admin/delete-propaganda/${prefix}`

## Arquivos alterados
1. `supabase/functions/delete-video-from-external-api/index.ts`
2. `supabase/functions/sync-buildings-external-api/index.ts`

