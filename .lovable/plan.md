

# Complete Implementation Plan: "Meus Pedidos" Dashboard + Order Detail Page

This plan covers **two pages**: the orders listing dashboard and the individual order detail page, with full layout wireframes for both.

---

## PAGE 1 — "Meus Pedidos" Dashboard Layout

```text
┌─────────────────────────────────────────────────────┐
│  COMPANY HEADER                                      │
│  ┌──────┐  Company Name                             │
│  │ LOGO │  CNPJ: XX.XXX.XXX/XXXX-XX                │
│  └──────┘  Account Owner: João Silva                │
│                                                      │
│  (if no logo: subtle dashed placeholder with         │
│   "Adicione a logo da sua empresa")                  │
├─────────────────────────────────────────────────────┤
│  METRICS ROW (3 cards, equal width)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Ativas   │ │ Pendentes│ │Concluídas│            │
│  │    3     │ │    1     │ │    5     │            │
│  └──────────┘ └──────────┘ └──────────┘            │
├─────────────────────────────────────────────────────┤
│  SEARCH + FILTER BAR                                 │
│  [🔍 Buscar...            ] [Status ▼]              │
├─────────────────────────────────────────────────────┤
│  CAMPAIGN CARDS (vertical stack)                     │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │ Campanha #a1b2c3d4         Status Badge     │    │
│  │ Criado: 15/01/2026                          │    │
│  │                                              │    │
│  │ Valor     Duração    Locais    Exibições     │    │
│  │ R$1.200   3 meses    5 locais  36.000       │    │
│  │                                              │    │
│  │ Video Slots: ████████░░ 8/10                │    │
│  │                                              │    │
│  │              [Ver Detalhes]  [Ação Principal]│    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  (repeat for each campaign)                          │
└─────────────────────────────────────────────────────┘
```

### Mobile Layout (iPhone)

```text
┌──────────────────────┐
│ COMPANY HEADER       │
│ ┌────┐ Company Name  │
│ │LOGO│ CNPJ          │
│ └────┘ Owner Name    │
├──────────────────────┤
│ ┌─────┐┌─────┐┌─────┐
│ │Ativ.││Pend.││Conc.│
│ │  3  ││  1  ││  5  │
│ └─────┘└─────┘└─────┘
├──────────────────────┤
│ [🔍 Buscar...       ]│
├──────────────────────┤
│ ┌────────────────────┐
│ │ #a1b2c3d4   Badge  │
│ │ 15/01/2026         │
│ │                    │
│ │ R$1.200 · 3 meses │
│ │ 5 locais · 36k    │
│ │                    │
│ │ Slots: ████░░ 8/10│
│ │                    │
│ │ [Ver Detalhes]     │
│ └────────────────────┘
│ (stacked vertically) │
└──────────────────────┘
```

### Data Source

- Company data: `userProfile.empresa_nome`, `userProfile.empresa_documento`, `userProfile.nome`, `userProfile.logo_url`
- Stats: calculated from `useUserOrdersAndAttempts` results (already available)
- Video slot count per order: `item.videos?.length || 0` out of 10 (already fetched by hook lines 78-116)

---

## PAGE 2 — Order Detail Page with 10 Video Slots

```text
┌─────────────────────────────────────────────────────┐
│  ← Detalhes do Pedido                                │
│  #a1b2c3d4                                           │
├─────────────────────────────────────────────────────┤
│  ▸ Status do Contrato (collapsed)                    │
├─────────────────────────────────────────────────────┤
│  ▸ Locais Selecionados (collapsed)                   │
├─────────────────────────────────────────────────────┤
│  GESTÃO DE VÍDEOS (always expanded)                  │
│                                                      │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ S1  │ │ S2  │ │ S3  │ │ S4  │ │ S5  │          │
│  │ ✅  │ │ 🎬  │ │ ⏳  │ │  +  │ │  +  │          │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ S6  │ │ S7  │ │ S8  │ │ S9  │ │ S10 │          │
│  │  +  │ │  +  │ │  +  │ │  +  │ │  +  │          │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘          │
│                                                      │
│  Slots utilizados: 3 / 10                            │
├─────────────────────────────────────────────────────┤
│  ▸ Parcelas (collapsed, if fidelidade)               │
├─────────────────────────────────────────────────────┤
│  ▸ Resumo do Pedido (collapsed)                      │
├─────────────────────────────────────────────────────┤
│  ▸ Informações de Compra (collapsed)                 │
├─────────────────────────────────────────────────────┤
│  ▸ Programação Semanal (collapsed)                   │
└─────────────────────────────────────────────────────┘
```

### Mobile Layout (iPhone)

```text
┌──────────────────────┐
│ ← Detalhes do Pedido │
│ #a1b2c3d4            │
├──────────────────────┤
│ ▸ Contrato           │
├──────────────────────┤
│ ▸ Locais             │
├──────────────────────┤
│ GESTÃO DE VÍDEOS     │
│                      │
│ ┌────┐┌────┐┌────┐  │
│ │ S1 ││ S2 ││ S3 │  │
│ └────┘└────┘└────┘  │
│ ┌────┐┌────┐┌────┐  │
│ │ S4 ││ S5 ││ S6 │  │
│ └────┘└────┘└────┘  │
│ ┌────┐┌────┐┌────┐  │
│ │ S7 ││ S8 ││ S9 │  │
│ └────┘└────┘└────┘  │
│ ┌────┐              │
│ │S10 │              │
│ └────┘              │
│                      │
│ Slots: 3 / 10       │
├──────────────────────┤
│ ▸ Parcelas           │
├──────────────────────┤
│ ▸ Resumo             │
├──────────────────────┤
│ ▸ Compra             │
├──────────────────────┤
│ ▸ Programação        │
└──────────────────────┘
```

---

## IMPLEMENTATION DETAILS

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/advertiser/orders/AdvertiserDashboardHeader.tsx` | Company identity header (logo/placeholder, name, CNPJ, owner) |
| `src/components/advertiser/orders/AdvertiserOrderStats.tsx` | 3 metric cards (Ativas, Pendentes, Concluídas) |
| `src/components/advertiser/orders/AdvertiserOrderCard.tsx` | Campaign card with video slot usage bar |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/advertiser/AdvertiserOrders.tsx` | Remove inline `OrderCard` (lines 270-419). Import new components. Remove `if (isMobile) return <MobileAdvertiserOrders />`. Use `useIsMobile()` for responsive layout within single component. Add CNPJ to header. Add slot usage to cards. |
| `src/pages/advertiser/OrderDetails.tsx` | Add "Slots utilizados: X / 10" summary below `VideoManagementCard`. Grid layout for slots: 5 cols desktop, 3 cols mobile. No other changes — page structure stays identical. |
| `src/components/order/VideoManagementCard.tsx` | Add slot usage counter display ("X / 10 slots utilizados"). Ensure grid renders all 10 slots (5x2 desktop, 3+cols mobile). |

### Files to Delete

| File | Reason |
|------|--------|
| `src/pages/advertiser/MobileAdvertiserOrders.tsx` | Logic absorbed into unified `AdvertiserOrders.tsx` |

### No Database Changes

- Video slots already support 10 (`videoSlotService.ts` line 89)
- No schema migrations needed
- No new tables or columns

### Design Rules

- All buttons: min-height 44px on mobile
- Cards: `bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm`
- Metrics: no oversized icons, no colored backgrounds — clean number + label only
- Slot usage bar: thin progress bar using Tailwind (`bg-gray-200` track, `bg-[#9C1E1E]` fill)
- Company header: existing red gradient logo container style preserved
- No new frameworks, only Tailwind + shadcn

### Step-by-Step Sequence

1. Create `AdvertiserDashboardHeader.tsx` — company identity with logo/placeholder, name, CNPJ, owner
2. Create `AdvertiserOrderStats.tsx` — 3 clean metric cards
3. Create `AdvertiserOrderCard.tsx` — responsive card with slot usage indicator
4. Refactor `AdvertiserOrders.tsx` — unified responsive page using new components, remove mobile redirect
5. Update `VideoManagementCard.tsx` — add slot usage counter ("X / 10")
6. Delete `MobileAdvertiserOrders.tsx`

### Risk Analysis

| Risk | Level | Mitigation |
|------|-------|-----------|
| Mobile regression from deleting MobileAdvertiserOrders | Medium | All logic (delete, PIX, cortesia modal) migrated to unified component |
| Missing company fields (CNPJ, logo) | Low | Graceful fallbacks ("Empresa não informada", letter avatar) |
| Video slot grid breaking on small screens | Low | 3-col grid on mobile is well-tested pattern |

