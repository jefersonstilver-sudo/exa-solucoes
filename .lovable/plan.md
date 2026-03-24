

# Plano: Migrar para endpoint batch `PATCH /ativo/batch`

## Status: ✅ Implementado

## Alteração realizada

### `supabase/functions/sync-video-status-to-aws/index.ts`

- Removido loop individual por prédio chamando `global-toggle-ativo`
- Substituído por chamadas diretas ao `PATCH http://15.228.8.3:8000/ativo/batch`
- 1 chamada para ativar o vídeo selecionado em todos os prédios
- N chamadas para desativar cada outro vídeo em todos os prédios
- Atualizado CORS headers e pinning da lib supabase-js
