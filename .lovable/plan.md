

# Plano: Painel Admin Confiavel - Preview de Video, Sincronizacao e Gestao de Predios

## Diagnostico

### Problema 1: Sem preview de video no admin
- A listagem admin (`OrdersTableRow`) usa `ActiveVideosColumn` que mostra apenas texto (nome do video + badges)
- A area do anunciante (`AdvertiserOrderCard`) tem um mini player com `<video>` autoplay muted usando `useOrderCurrentVideoData`
- A pagina de detalhes admin (`ProfessionalOrderReport`) tem preview com `controls` mas nao autoplay

### Problema 2: Desincronizacao de videos
- `useActiveVideosForAllOrders` filtra por `pedidos.status IN ['video_aprovado']` -- **exclui status 'ativo'**
- A area do anunciante usa `useCurrentVideoDisplay` que chama a RPC `get_current_display_video` (correta, sem filtro de status)
- Isso explica por que videos aparecem na area do anunciante mas nao no admin

### Problema 3: Nome do pedido no admin
- O `OrderData` no `ProfessionalOrderReport` nao tem campo `nome_pedido`
- O header mostra apenas `#{order.id.substring(0,8)}`

### Funcionalidade nova: Gestao de predios
- A secao "Predios Contratados" ja existe (somente leitura)
- Falta: adicionar/remover predios com sync API AWS

---

## Alteracoes

### 1. Corrigir filtro de status em useActiveVideosForAllOrders
**Arquivo**: `src/hooks/useActiveVideosForAllOrders.tsx`

- Linha 58: mudar `.in('pedidos.status', ['video_aprovado'])` para `.in('pedidos.status', ['video_aprovado', 'ativo'])`
- Isso faz os videos de pedidos ativos aparecerem no admin

### 2. Adicionar mini player na listagem admin
**Arquivo**: `src/components/admin/orders/ActiveVideosColumn.tsx`

- Importar `useOrderCurrentVideoData`
- Adicionar um mini `<video>` autoplay muted loop acima da lista de videos ativos
- Tamanho: ~120px width, aspect-video, rounded, object-cover
- Mesmo padrao do `AdvertiserOrderCard` (lazy loading nao e critico aqui pois a coluna ja e filtrada por pedido)

### 3. Adicionar nome do pedido no header do relatorio admin
**Arquivo**: `src/components/admin/orders/ProfessionalOrderReport.tsx`

- Adicionar `nome_pedido?: string` ao `OrderData` interface
- No header (linha 267-268): se `nome_pedido` existe, exibir como titulo principal grande, com o codigo `#XXXXXXXX` como subtitulo menor
- Adicionar `OrderNameEdit` no corpo do relatorio para edicao inline (similar ao que fizemos no advertiser)

### 4. Adicionar nome do pedido na listagem compacta admin
**Arquivo**: `src/components/admin/orders/components/OrdersTableRow.tsx`

- Na celula do ID (linha 83-84): se `nome_pedido` existe, mostrar nome em bold + ID como badge discreto
- Se nao existe, manter comportamento atual

### 5. Gestao de predios no relatorio admin
**Arquivo**: `src/components/admin/orders/ProfessionalOrderReport.tsx`

Na secao "Predios Contratados" (linhas 746-800):
- Adicionar botao "Adicionar Predio" no header da secao
- Adicionar botao "Remover" em cada linha de predio
- Ao adicionar: abrir dialog com lista de predios disponiveis (multi-select)
- Ao remover: confirmar e deletar

### 6. Hook para gestao de predios do pedido
**Novo arquivo**: `src/hooks/useOrderBuildingsManagement.ts`

- `addBuildings(orderId, buildingIds[])`: atualiza `lista_predios` no banco + chama edge function para sync API AWS
- `removeBuilding(orderId, buildingId)`: remove de `lista_predios` + chama edge function para deletar videos do predio na API AWS
- Usa real-time para refletir mudancas instantaneamente

### 7. Edge function para sync predios com API AWS
**Novo arquivo**: `supabase/functions/sync-buildings-external-api/index.ts`

- Recebe: `pedido_id`, `action` (add/remove), `building_ids`
- Para "add": envia videos aprovados do pedido para os novos predios via API AWS
- Para "remove": remove videos do predio via endpoint de delecao AWS
- CORS headers completos (mesmo padrao corrigido)

## Detalhes tecnicos

```text
Fluxo de sincronizacao:
Admin clica "Adicionar Predio"
  -> Dialog com lista de predios
  -> Seleciona predios
  -> Hook atualiza lista_predios no Supabase
  -> Hook chama edge function sync-buildings-external-api
  -> Edge function envia videos para novos predios na API AWS
  -> UI atualiza em tempo real

Admin clica "Remover Predio" 
  -> Confirmacao
  -> Hook remove de lista_predios
  -> Hook chama edge function (action: remove)
  -> Edge function deleta videos daquele predio na API AWS
  -> UI atualiza em tempo real
```

## Arquivos alterados/criados

1. `src/hooks/useActiveVideosForAllOrders.tsx` -- fix filtro status (1 linha)
2. `src/components/admin/orders/ActiveVideosColumn.tsx` -- mini player video
3. `src/components/admin/orders/ProfessionalOrderReport.tsx` -- nome_pedido + gestao predios
4. `src/components/admin/orders/components/OrdersTableRow.tsx` -- nome_pedido na listagem
5. `src/hooks/useOrderBuildingsManagement.ts` -- novo hook gestao predios
6. `supabase/functions/sync-buildings-external-api/index.ts` -- nova edge function
7. `src/components/admin/orders/BuildingManagementDialog.tsx` -- novo dialog selecao predios

## Ordem de implementacao

1. Fix filtro status (resolve desincronizacao imediatamente)
2. Mini player na listagem admin
3. Nome do pedido no admin (header + listagem)
4. Gestao de predios (hook + edge function + UI)

