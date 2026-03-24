

# Plano: Migrar para endpoint batch `PATCH /ativo/batch`

## Situacao atual

O `sync-video-status-to-aws` faz um loop por cada predio e chama `global-toggle-ativo/{clientId}` individualmente, que por sua vez chama `PATCH /ativo/{client_id}` na API externa. Isso causa lentidao e falhas em predios apos o primeiro.

## Novo endpoint

```
PATCH http://15.228.8.3:8000/ativo/batch
Content-Type: application/json
Body: { "client_ids": ["101", "102", "105"], "titulo": "arquivo.mp4", "ativo": true }
```

Uma unica chamada atualiza todos os predios de uma vez.

## Correcao

### `supabase/functions/sync-video-status-to-aws/index.ts`

Substituir o loop que chama `global-toggle-ativo` por chamadas diretas ao endpoint batch:

1. **Ativar o video selecionado** em todos os predios com uma unica chamada:
   - `PATCH /ativo/batch` com `client_ids` = todos os prefixos, `titulo` = nome do video ativo, `ativo` = true

2. **Desativar os demais videos** em todos os predios, uma chamada por titulo:
   - `PATCH /ativo/batch` com `client_ids` = todos os prefixos, `titulo` = nome do video a desativar, `ativo` = false

Isso elimina o loop N predios x M videos, substituindo por apenas (1 + quantidade de videos inativos) chamadas HTTP.

### `supabase/functions/global-toggle-ativo/index.ts`

Nenhuma alteracao. Continua disponivel caso seja necessario para operacoes individuais, mas nao sera mais chamado pelo `sync-video-status-to-aws`.

## Arquivo alterado

1. `supabase/functions/sync-video-status-to-aws/index.ts` — chamadas batch diretas substituindo loop individual

