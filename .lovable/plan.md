

# Status: NADA foi implementado do plano do Portal do Anunciante

O único trabalho feito foi a reconstrução do `AgendaNotificationSettingsModal` (plano separado). Os 6 itens do plano principal do Portal do Anunciante estão **todos pendentes**:

| # | Item | Status |
|---|------|--------|
| 1 | Fix scroll (overflow-y-auto na main) | ❌ Pendente |
| 2 | Upload de logo em CompanyBrandSection | ❌ Pendente |
| 3 | Header premium em Meus Pedidos (logo + nome) | ❌ Pendente |
| 4 | Slots de vídeo 4 → 10 | ❌ Pendente — `videoSlotService.ts` linha 89: `[1, 2, 3, 4]` |
| 5 | Duração 15s → 10s | ❌ Pendente — `videoStorageService.ts` linha 80: `maxDuration = 15` |
| 6 | Remover Sofia (botão roxo IA) | ❌ Pendente — `CompleteResponsiveLayout.tsx` linhas 10-11, 45, 99-102 |

---

## Plano de Implementação Completo

### 1. Fix Scroll + Remover Sofia — `CompleteResponsiveLayout.tsx`

- Adicionar `overflow-y-auto` na `<main>` (linha 57-60)
- Remover imports do Sofia (linhas 10-11)
- Remover `SofiaClientProvider` wrapper (linha 45)
- Remover `SofiaClientVoiceButton`, `SofiaNavigationPopup`, `SofiaQRCodePopup` (linhas 99-102)

### 2. Upload de Logo — `CompanyBrandSection.tsx`

Adicionar seção de upload de logo da empresa antes do campo "Nome da Empresa":
- Input file para imagem (PNG/JPG/SVG, max 5MB)
- Upload para bucket `arquivos` no path `logos/{userId}/logo_{timestamp}.ext`
- Preview circular da logo com opção "Versão Branca" (CSS `brightness-0 invert`)
- Preview sobre fundo vermelho escuro (`from-[#4a0f0f] via-[#6B1515] to-[#7D1818]`)
- Salvar URL no campo `logo_url` da tabela `users`
- Usar `useLogoImageUrl` para signed URLs (bucket privado)

### 3. Header Premium — `AdvertiserOrders.tsx`

Adicionar card de boas-vindas no topo (antes dos stats), mostrando:
- Logo da empresa (de `logo_url` ou `avatar_url`, com signed URL)
- Nome da empresa (`empresa_nome`)
- Nome da pessoa (do `userProfile`)
- Design: card com `rounded-2xl`, padding generoso, fundo branco com borda sutil
- iPhone-friendly: touch targets 44px, tipografia 15-17px

### 4. Slots 4 → 10 — `videoSlotService.ts`

- Linha 89: `[1, 2, 3, 4]` → `Array.from({ length: 10 }, (_, i) => i + 1)`
- Linha 172 (fallback): mesma mudança

### 5. Duração 15 → 10 — `videoStorageService.ts` + `useVideoSpecifications.ts`

- `videoStorageService.ts` linha 80: `maxDuration = 15` → `maxDuration = 10`
- `useVideoSpecifications.ts`: todos os defaults de `15` para `10` (vertical)
- `useVideoSpecifications.ts`: `maxVideosPorPedido` default `4` → `10`

### 6. Nenhuma outra mudança

- Nenhuma tabela nova (usa `users.logo_url` existente)
- Nenhuma outra página alterada
- Lógica de pagamento, checkout, agendamentos intacta

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/advertiser/layout/CompleteResponsiveLayout.tsx` | overflow-y-auto + remover Sofia |
| `src/components/settings/CompanyBrandSection.tsx` | Upload de logo com preview branco |
| `src/pages/advertiser/AdvertiserOrders.tsx` | Header premium com logo + nomes |
| `src/services/videoSlotService.ts` | Slots 1-10 |
| `src/services/videoStorageService.ts` | maxDuration 10 |
| `src/hooks/useVideoSpecifications.ts` | Defaults 10s, max 10 vídeos |

