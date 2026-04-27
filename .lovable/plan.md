
## Problema

No mapa do `/super_admin/paineis-exa` (componente `PaineisMapModal`), as cores dos pinos hoje refletem apenas o estado **operacional dos painéis** (online/offline/partial). Isso não bate com a página "Painéis Real", onde a cor segue o **status do prédio**:

- `ativo` → **verde**
- `instalacao` (em instalação) → **amarelo**
- `inativo` → **vermelho**

Além disso, prédios em instalação não estão aparecendo no endereço correto (ou somem do mapa) porque o hook `useBuildingsWithDeviceStatus` exige `totalDevices > 0` — prédios em instalação geralmente ainda não têm devices vinculados, então caem fora.

## Mudanças

### 1. Buscar o `status` do prédio
Arquivo: `src/modules/monitoramento-ia/hooks/useBuildingsWithDeviceStatus.ts`

- Incluir `status` no `select` da tabela `buildings`.
- Adicionar `buildingStatus: 'ativo' | 'instalacao' | 'inativo' | string` no tipo `BuildingWithDeviceStatus` (mantendo o `status` operacional atual para o tooltip e contadores).
- Remover o filtro `.filter(b => b.totalDevices > 0)` para prédios com `status = 'instalacao'`, para que apareçam no mapa mesmo sem painéis ainda instalados (desde que tenham coordenadas — manual ou auto). Manter o filtro para os demais para não poluir.
- Normalizar o status com NFD (igual ao `BuildingStoreCard`) para tratar "instalação"/"instalacao".

### 2. Pino colorido por status do prédio
Arquivo: `src/modules/monitoramento-ia/components/paineis/PaineisMapModal.tsx`

- Trocar a função `createMarkerSvgUrl` para receber o **status do prédio** (`ativo` | `instalacao` | `inativo`) em vez de `online/offline/partial`.
- Paleta:
  - `ativo` → `#22C55E` (verde) / dark `#16A34A`
  - `instalacao` → `#F59E0B` (amarelo) / dark `#D97706`
  - `inativo` → `#EF4444` (vermelho) / dark `#DC2626`
  - fallback → cinza
- Atualizar o `marker.icon` para usar essa nova função.
- O tooltip (mouseover) e o `BuildingDetailCard` continuam exibindo `onlineCount/totalDevices` (operacional) — apenas a **cor** do pino muda.
- Animação `BOUNCE` deixa de ser por status operacional; aplicar somente a prédios `inativo` ou remover a animação para evitar confusão (preferência: remover BOUNCE, manter mapa limpo).

### 3. Endereço correto para prédios em instalação
- Como o hook agora inclui prédios em instalação mesmo sem devices, eles serão renderizados na coordenada (`manual_latitude`/`manual_longitude` se existir, senão `latitude`/`longitude`) — exatamente como qualquer outro prédio.
- Caso um prédio em instalação não tenha coordenadas válidas, ele continua excluído (impossível posicionar). O ajuste manual de coordenada já existe em `BuildingDetailCard` via `handleAddressUpdate`.

### 4. Filtro "Problemas" (toggle vermelho no header)
- Hoje filtra por status operacional (`offline`/`partial`). Manter como está — é um filtro independente sobre painéis com problema, não sobre status do prédio. Apenas garantir que prédios em instalação sem devices não sejam contados como "problema".

## Detalhes técnicos

```ts
// Helper de normalização (já usado no BuildingStoreCard)
const normalizeStatus = (s?: string) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getBuildingStatusKind = (s?: string): 'ativo' | 'instalacao' | 'inativo' => {
  const n = normalizeStatus(s);
  if (n.includes('instala')) return 'instalacao';
  if (n.includes('inativ')) return 'inativo';
  return 'ativo';
};
```

```ts
// createMarkerSvgUrl(kind, sequentialNumber) — kind = 'ativo' | 'instalacao' | 'inativo'
```

## Arquivos editados

- `src/modules/monitoramento-ia/hooks/useBuildingsWithDeviceStatus.ts`
- `src/modules/monitoramento-ia/components/paineis/PaineisMapModal.tsx`

Nenhuma mudança em UI fora do mapa, nenhuma alteração de workflow ou de outras telas.
