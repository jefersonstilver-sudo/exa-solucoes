
## Problema

No mapa de `/super_admin/paineis-exa`:

1. **Royal Legacy** está com `status='ativo'` no banco mas seus painéis estão **offline** — hoje o pino aparece **verde**, escondendo o problema. A cor precisa refletir a realidade operacional.
2. Prédios marcados como **`interno`** estão aparecendo no mapa público — não devem.
3. O **tooltip de hover** mostra apenas "X/Y painéis online" — o usuário quer ver **todas as informações de cada painel** (nome, status, provedor, último online, endereço).

## Regras corretas de cor do pino

| Status do prédio | Painéis | Cor |
|---|---|---|
| `interno` | qualquer | **não aparece no mapa** |
| `instalacao` | qualquer | **amarelo** |
| `inativo` | qualquer | **vermelho** |
| `ativo` | todos online | **verde** |
| `ativo` | algum/todos offline | **vermelho** |
| `ativo` | sem painéis | **vermelho** (anomalia) |

Ou seja: para `ativo`, a cor passa a depender do estado operacional dos painéis. `instalacao` continua amarelo independente dos painéis (estão sendo configurados).

## Mudanças

### 1. `src/modules/monitoramento-ia/hooks/useBuildingsWithDeviceStatus.ts`

- Estender `getBuildingStatusKind` para reconhecer também `'interno'`.
- Adicionar campo derivado `pinKind: 'ativo' | 'instalacao' | 'inativo'` no tipo `BuildingWithDeviceStatus`, computado assim:
  ```ts
  if (buildingStatus === 'instalacao') pinKind = 'instalacao';
  else if (buildingStatus === 'inativo') pinKind = 'inativo';
  else if (buildingStatus === 'ativo' && status === 'online') pinKind = 'ativo';
  else pinKind = 'inativo'; // ativo com painéis offline/partial/sem painéis
  ```
- Atualizar o filtro final para **excluir prédios `interno`** do mapa:
  ```ts
  .filter(b => b.buildingStatus !== 'interno')
  .filter(b => b.totalDevices > 0 || b.buildingStatus === 'instalacao')
  ```
- Buscar campos extras dos devices úteis para o tooltip: já temos `name`, `status`, `provider`. Adicionar `address` e `last_online_at` ao select e ao tipo `DeviceInfo`.

### 2. `src/modules/monitoramento-ia/components/paineis/PaineisMapModal.tsx`

- Trocar `createMarkerSvgUrl(building.buildingStatus, …)` por `createMarkerSvgUrl(building.pinKind, …)`.
- Reescrever o **tooltip de hover** com card detalhado:
  - Cabeçalho: nome do prédio, badge com status do prédio (Ativo/Em Instalação/Inativo) e endereço.
  - Resumo: `X/Y painéis online`.
  - Lista de painéis (até 8 visíveis, scroll se mais), cada item:
    - Bolinha verde/vermelha de status
    - Nome do painel
    - Provedor (badge)
    - "Último online: há Xh" (`formatDistanceToNow` em pt-BR a partir de `last_online_at`)
  - Estilo limpo, max-width ~320px, fundo branco com leve sombra, fonte system-ui.
- Usar `disableAutoPan: false` para o `InfoWindow` ficar visível em pinos próximos da borda.

### 3. Filtro "Problemas" (header)

Continua filtrando por `status` operacional (`offline`/`partial`) — ele já reflete corretamente o que o usuário considera problema. Sem mudanças.

## Detalhes técnicos

- `last_online_at` já existe na tabela `devices` (visto nos logs do realtime).
- Usar `date-fns` (`formatDistanceToNow`, locale `ptBR`) — já importado em outros componentes do projeto.
- Manter `optimized: true` nos markers.
- A coluna `status` em `buildings` aceita exatamente: `ativo`, `instalacao`, `interno` (confirmado via query). Não há `inativo` no banco hoje, mas a regra fica preparada para quando existir.

## Arquivos editados

- `src/modules/monitoramento-ia/hooks/useBuildingsWithDeviceStatus.ts`
- `src/modules/monitoramento-ia/components/paineis/PaineisMapModal.tsx`

Nenhuma mudança em UI fora do mapa, no workflow ou em outras telas.
