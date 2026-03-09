

# Correção: Refresh ao salvar causa + Hover com detalhes + Editar causa

## Problemas Identificados

1. **Sem refresh ao salvar causa**: Quando o usuario registra/edita a causa no modal, os badges nos `PanelCard` e `FullscreenMonitor` nao atualizam. O `useDeviceIncidentStatus` so atualiza a cada 30s por polling. Precisa de callback para forcar refresh imediato.

2. **Sem hover nos cards**: Ao passar o mouse sobre um `PanelCard` offline com causa registrada, nao mostra nenhum detalhe. Precisa de tooltip/hover-card com causa, resolucao e categoria.

3. **Causa nao e editavel**: Uma vez registrada, o `OfflineIncidentCard` mostra modo somente leitura. Nao ha botao para editar a causa.

## Solucao

### 1. `useDeviceIncidentStatus.ts` — Expor `refetch`
Retornar `fetchStatuses` como `refetch` para permitir refresh manual externo.

### 2. `Paineis.tsx` — Callback de refresh ao fechar modal
Passar um callback `onIncidentUpdate` para o `ComputerDetailModal`. Quando o modal fecha, chamar `refetch` do `useDeviceIncidentStatus` para atualizar badges imediatamente.

### 3. `useDeviceIncidents.ts` — Retornar dados de causa para hover
O hook `useDeviceIncidentStatus` precisa buscar tambem `causa`, `category_id` e a categoria joinada para popular o hover. Criar um novo hook ou expandir o existente para retornar detalhes resumidos.

Na verdade, mais simples: usar o `usePendingIncidents` que ja existe e retorna incidentes completos com categoria. Usar esse hook no `Paineis.tsx` e passar os dados para o `PanelCard`.

### 4. `PanelCard.tsx` — HoverCard com detalhes do incidente
Adicionar um `HoverCard` (do Radix) que aparece ao passar o mouse sobre o badge de incidente. Mostra: categoria (icon + label), causa, resolucao (resumida), quem registrou.

### 5. `OfflineIncidentCard.tsx` — Botao "Editar" quando causa ja registrada
Adicionar botao "Editar Causa" no modo visualizacao que alterna para modo formulario pre-preenchido. O save usa o mesmo `registerCause` (que faz UPDATE).

## Arquivos

| Arquivo | Mudanca |
|---------|---------|
| `useDeviceIncidentStatus.ts` | Expor `refetch` |
| `Paineis.tsx` | Chamar `refetch` ao fechar modal; usar `usePendingIncidents` para dados de hover |
| `PanelCard.tsx` | Receber dados do incidente + HoverCard com detalhes |
| `OfflineIncidentCard.tsx` | Botao editar causa com formulario pre-preenchido |
| `FullscreenMonitor.tsx` | Receber dados de incidente para tooltip |

