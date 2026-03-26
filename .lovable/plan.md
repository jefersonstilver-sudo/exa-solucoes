

# Plano: Atualizar IP da API externa

## Problema
O servidor da API externa mudou de IP. Todas as referências a `http://15.228.8.3:8000` precisam ser atualizadas para `http://18.228.252.149:8000`.

## Arquivos a alterar (8 arquivos, 55 ocorrências)

| Arquivo | Ocorrências |
|---------|-------------|
| `supabase/functions/delete-video-from-external-api/index.ts` | 1 |
| `supabase/functions/create-building-client/index.ts` | 2 |
| `supabase/functions/delete-building-client/index.ts` | 2 |
| `supabase/functions/upload-video-to-external-api/index.ts` | 1 |
| `supabase/functions/sync-buildings-external-api/index.ts` | 1 |
| `supabase/functions/global-toggle-ativo/index.ts` | 1 |
| `supabase/functions/notify-active/index.ts` | 1 |
| `supabase/functions/sync-video-status-to-aws/index.ts` | 1 |

Arquivo de documentação (atualizar também):
- `docs/VIDEO_LOGGING_SYSTEM.md` — 1 ocorrência

## Mudança
Substituição direta de `15.228.8.3` por `18.228.252.149` em todos os arquivos listados. Nenhuma outra alteração de lógica ou UI.

## Pós-deploy
As Edge Functions alteradas precisarão ser re-deployed no Supabase para que a mudança entre em vigor.

