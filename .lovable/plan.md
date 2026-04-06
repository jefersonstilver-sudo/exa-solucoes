

# Plano: Botao "Sincronizar API" no BuildingCard3

## Problema
O predio SALA REUNIAO nao recebeu os videos na API externa (AWS). Nao existe botao para forcar sync diretamente pela tela de predios — so existe na tela de pedidos.

## Solucao
Adicionar um botao "Sync API" em cada BuildingCard3 que busca TODOS os pedidos ativos que incluem aquele predio na `lista_predios` e dispara `sync-buildings-external-api` para cada um.

## Implementacao

### 1. Criar servico `buildingSyncService.ts`
Nova funcao `syncBuildingWithExternalAPI(buildingId)`:
- Consulta `pedidos` onde `lista_predios` contem o `buildingId` e status IN ('ativo', 'video_aprovado')
- Para cada pedido encontrado, chama `sync-buildings-external-api` com `{ pedido_id, action: 'add', building_ids: [buildingId] }`
- Retorna resumo: quantos pedidos sincronizados, quantos falharam

### 2. Editar `BuildingCard3.tsx`
- Importar `RefreshCw` icon e o novo servico
- Adicionar botao "Sync API" na area de acoes (ao lado de Playlist), visivel para todos os admins
- Estado local `syncing` para loading spinner
- Toast com resultado (sucesso/erro)

### Arquivos

| Arquivo | Acao |
|---------|------|
| `src/services/buildingSyncService.ts` | **Criar** |
| `src/components/admin/buildings/v3/BuildingCard3.tsx` | **Editar** — adicionar botao Sync API |

