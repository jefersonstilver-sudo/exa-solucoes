

# Status: Plano do Portal do Anunciante — IMPLEMENTADO ✅

| # | Item | Status |
|---|------|--------|
| 1 | Fix scroll (overflow-y-auto na main) | ✅ Feito |
| 2 | Upload de logo em CompanyBrandSection | ✅ Feito |
| 3 | Header premium em Meus Pedidos (logo + nome) | ✅ Feito |
| 4 | Slots de vídeo 4 → 10 | ✅ Feito |
| 5 | Duração 15s → 10s | ✅ Feito |
| 6 | Remover Sofia (botão roxo IA) | ✅ Feito |


## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/advertiser/layout/CompleteResponsiveLayout.tsx` | overflow-y-auto + remover Sofia |
| `src/components/settings/CompanyBrandSection.tsx` | Upload de logo com preview branco |
| `src/pages/advertiser/AdvertiserOrders.tsx` | Header premium com logo + nomes |
| `src/services/videoSlotService.ts` | Slots 1-10 |
| `src/services/videoStorageService.ts` | maxDuration 10 |
| `src/hooks/useVideoSpecifications.ts` | Defaults 10s, max 10 vídeos |

