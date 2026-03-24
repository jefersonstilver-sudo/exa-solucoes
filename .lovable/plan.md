

# Plano: Corrigir PATCH para atualizar TODOS os predios do pedido

## Problema

Em `src/pages/advertiser/OrderDetails.tsx` (linha 325-346), quando o anunciante define um video como principal, o codigo pega apenas o PRIMEIRO predio (`lista_predios[0]`) e chama `global-toggle-ativo` uma unica vez. Todos os outros predios do pedido ficam com o status desatualizado na API externa.

O painel admin (`videoBaseService.ts`) nao tem esse bug — ele chama `sync-video-status-to-aws`, que ja itera por todos os predios corretamente.

## Correcao

### Arquivo: `src/pages/advertiser/OrderDetails.tsx` (linhas 325-356)

Substituir a logica de pegar apenas o primeiro predio por um loop que chama `global-toggle-ativo` para CADA predio do pedido:

```text
// ANTES (errado - apenas 1 predio):
const firstBuildingId = orderDetails?.lista_predios?.[0];
const clientId = firstBuildingId?.replace(/-/g, '').substring(0, 4);
await supabase.functions.invoke(`global-toggle-ativo/${clientId}`, { body: { titulos } });

// DEPOIS (correto - todos os predios):
const allBuildingIds = orderDetails?.lista_predios || [];
for (const buildingId of allBuildingIds) {
  const clientId = buildingId.replace(/-/g, '').substring(0, 4);
  await supabase.functions.invoke(`global-toggle-ativo/${clientId}`, { body: { titulos } });
}
```

Adicionar logs para cada predio processado e tratar erros individuais sem interromper o loop (igual ao padrao usado em `sync-video-status-to-aws`).

## Arquivos alterados

1. `src/pages/advertiser/OrderDetails.tsx` — loop por todos os predios em `lista_predios`

