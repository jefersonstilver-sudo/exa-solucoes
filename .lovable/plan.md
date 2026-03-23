

# Plano: Conciliação de status de devices nos prédios

## Causa raiz encontrada na auditoria do banco

Dados reais do banco de dados revelam **3 bugs simultâneos**:

### Bug 1: Múltiplos devices por prédio — último vence
O reduce no `buildingsAdminService.ts` faz `acc[building_id] = device` — assignment simples. Quando um prédio tem vários devices (Vale do Monjolo tem 2, Saint Peter tem 3, Foz Residence tem 3), o **último da lista** vence. Se esse último tem `status = 'deleted'`, o prédio inteiro aparece como "Não conectado".

Exemplo real: **Vale do Monjolo** tem:
- `14cebf33` → status `online` ✅
- `d130ea60` → status `deleted` ❌ ← este pode ganhar

### Bug 2: Devices com status `deleted` ainda retornados
A query filtra `is_active = true`, mas **9 devices com status `deleted`** ainda têm `is_active = true` no banco. Eles poluem o mapa.

### Bug 3: Status `deleted` não mapeado no badge
O `BuildingPanelStatusBadge` só conhece `online`, `offline`, `not_connected`. O status `deleted` cai no `default` → mostra "Não conectado".

## Correções

### C-01: Priorizar melhor device no reduce
**Arquivo**: `src/services/buildingsAdminService.ts`

Trocar o reduce simples por lógica que prioriza: `online > offline > deleted/outros`. Quando múltiplos devices existem para o mesmo prédio, o melhor status vence.

### C-02: Filtrar devices deletados da query
**Arquivo**: `src/services/buildingsAdminService.ts`

Adicionar `.neq('status', 'deleted')` na query de devices para excluir devices marcados como deletados.

### C-03: Mapear `deleted` como fallback no badge
**Arquivo**: `src/components/admin/buildings/BuildingPanelStatusBadge.tsx`

Status `deleted` deve ser tratado como `not_connected` explicitamente (já funciona pelo default, mas a regra de negócio do `buildingStatus === 'ativo'` precisa cobrir esse caso também — hoje só cobre `not_connected`, não `deleted`).

Atualizar a lógica do `effectiveStatus` para: se `buildingStatus === 'ativo'` e status não é `online` nem `offline`, forçar `online`.

## Arquivos alterados

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `src/services/buildingsAdminService.ts` | Filtrar deleted + priorizar melhor device |
| 2 | `src/components/admin/buildings/BuildingPanelStatusBadge.tsx` | Cobrir status `deleted` na regra de ativo=online |

