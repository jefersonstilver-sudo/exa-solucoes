

# Plano: Remover vendedores fixos e usar dados reais do banco

## Problema
`SellersRankingCard.tsx` e `ProposalStatsRow.tsx` usam listas hardcoded (`FIXED_SELLER_IDS`) com 4 vendedores fixos (Bruno, Eduardo, Suzana, Jeferson). Tres deles nao fazem mais parte da equipe. O hook `useDashboardUnifiedStats` ja retorna `propostasPorVendedor` dinamicamente de todas as propostas reais -- mas os componentes filtram e descartam esses dados.

## Alteracoes

### 1. SellersRankingCard.tsx
- Remover `FIXED_SELLER_IDS` e `FIXED_SELLER_NAMES`
- Usar diretamente o array `vendedores` (que ja vem do hook com dados reais)
- Ordenar por `valorRecebido` decrescente
- Mostrar todos os vendedores que tem pelo menos 1 proposta (filtrar `enviadas > 0`)
- Manter layout de ranking, medalhas e grafico iguais

### 2. ProposalStatsRow.tsx
- Remover `FIXED_SELLER_IDS` e `FIXED_SELLER_NAMES`
- Usar diretamente `stats.propostasPorVendedor` filtrado por `enviadas > 0`
- Ordenar por `valorVendido` decrescente
- Grid responsivo: ajustar `grid-cols` dinamicamente baseado na quantidade de vendedores (max 6 colunas)

### Resultado
- Dashboard mostra apenas vendedores que realmente tem propostas no periodo
- Novos vendedores aparecem automaticamente sem precisar editar codigo
- Dados 100% sincronizados com a base real

## Arquivos alterados
1. `src/components/admin/dashboard/SellersRankingCard.tsx`
2. `src/components/admin/dashboard/ProposalStatsRow.tsx`

