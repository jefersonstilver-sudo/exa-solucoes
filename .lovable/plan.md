

# Revised Plan: Order Card Redesign — Mobile-First

## Current State

The `AdvertiserOrderCard.tsx` (194 lines) has no video preview, two "Detalhes" buttons for active orders, and a desktop-first layout. The `useOrderStatus.ts` returns duplicate `action: { label: 'Ver Detalhes' }` for `video_aprovado` and `ativo` statuses.

---

## 1. Card Structure — iPhone First

Every card has the **same height structure** regardless of video state. This ensures visual consistency when scrolling.

### Mobile (Primary Design)

```text
┌────────────────────────────────┐
│ ┌────────────────────────────┐ │
│ │                            │ │
│ │   VIDEO PREVIEW (16:9)     │ │
│ │   muted autoplay loop      │ │
│ │                            │ │
│ │   — or —                   │ │
│ │   "Nenhum vídeo em         │ │
│ │    exibição"               │ │
│ │   (same height, gray bg)   │ │
│ │                            │ │
│ └────────────────────────────┘ │
│                                │
│  Campanha #a1b2c3d4            │
│  10/01/2026                    │
│                                │
│  R$ 1.200  ·  3 meses         │
│  5 locais  ·  36.000 exib.    │
│                                │
│  Slots de vídeo       7 / 10  │
│  ▓▓▓▓▓▓▓░░░                   │
│                                │
│  [EM EXIBIÇÃO]                 │
│                                │
│  [     Ver Detalhes      ]     │
│  (full-width, 44px height)     │
│                                │
│  (if deletable:)               │
│  [     Excluir           ]     │
│  (text-destructive, subtle)    │
└────────────────────────────────┘
```

Key rules:
- Video area: fixed `aspect-video` (16:9), `max-h-[160px]`, `rounded-t-xl`
- When no video: same area renders a `bg-muted` placeholder with centered text "Nenhum vídeo em exibição" — **same height as video preview**
- Info section: `p-4`, vertical stack, `text-sm`
- Metrics on two lines: `Valor · Duração` then `Locais · Exibições`
- Slot progress: thin bar (`h-1.5`), label left "Slots de vídeo", count right "7 / 10"
- Badge: standalone row, no icon prefix
- Action button: **single button**, full-width on mobile, `min-h-[44px]`
- Delete: separate row below, `variant="ghost"` with text "Excluir", no emoji/icon
- No emoji icons anywhere — text-only buttons

### Desktop

```text
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────┐                                                │
│ │          │  Campanha #a1b2c3d4  ·  10/01/2026             │
│ │  VIDEO   │                                                │
│ │ PREVIEW  │  Valor      Duração     Locais    Exibições    │
│ │ 120x90   │  R$ 1.200   3 meses     5         36.000      │
│ │          │                                                │
│ └──────────┘  Slots: ▓▓▓▓▓▓▓░░░ 7/10                       │
│                                                             │
│               [EM EXIBIÇÃO]    [Ver Detalhes]   [Excluir]   │
└─────────────────────────────────────────────────────────────┘
```

- `flex-row` layout: video left (120x90, rounded-lg), info right
- Metrics in a `grid-cols-4` row
- Buttons inline, `min-h-[36px]`

---

## 2. Video Preview Logic

**Which video**: Uses `useOrderCurrentVideoData(orderId)` — calls RPC `get_current_display_video` which returns the priority video (scheduled > base).

**Multiple videos**: Only the currently displaying one is shown. The RPC handles selection.

**No approved video**: The preview area stays but shows a placeholder:
- `bg-muted rounded-t-xl` (mobile) or `bg-muted rounded-lg` (desktop)
- Centered text: "Nenhum vídeo em exibição"
- Same dimensions as the video area — cards remain equal height

**Playback**: `<video autoPlay muted loop playsInline preload="metadata" />`

**Performance — Lazy Loading**:
- Each card uses `useIntersectionObserver` (already exists in project)
- The `<video>` element's `src` is only set when the card enters the viewport
- When it exits, `src` is cleared and the video pauses
- `preload="metadata"` ensures only the first frame loads initially
- This prevents loading 10+ videos simultaneously on pages with many orders

---

## 3. Duplicate Button Fix

**Root cause**: `useOrderStatus` returns `action: { label: 'Ver Detalhes' }` for `video_aprovado` (line 196-204) and `ativo` (line 216-224). The card also has a hardcoded "Detalhes" button (line 168-178).

**Fix**:
1. In `useOrderStatus.ts`: Remove the `action` property from `video_aprovado` and `ativo` cases. These statuses will have no action button — the card's own "Ver Detalhes" handles navigation.
2. In `AdvertiserOrderCard.tsx`: The single "Ver Detalhes" button navigates to `/anunciante/pedido/:id`. When `statusInfo.action` exists (e.g., "Pagar com PIX", "Enviar Vídeo"), it renders as the primary button, and "Ver Detalhes" renders as secondary outline below it.

**Result per status**:

| Status | Primary Button | Secondary |
|--------|---------------|-----------|
| `pendente` (PIX) | Pagar com PIX | Ver Detalhes |
| `pendente` (cartão) | Pagar com Cartão | Ver Detalhes |
| `pago` (no video) | Enviar Vídeo | Ver Detalhes |
| `pago` (video in review) | — | Ver Detalhes |
| `video_aprovado` / `ativo` | — | Ver Detalhes |
| `video_rejeitado` | Enviar Novo Vídeo | Ver Detalhes |
| `expirado` | Renovar Contrato | Ver Detalhes |
| `attempt` | Finalizar Compra | — |

---

## 4. Slots Display

Already implemented correctly: `item.videos?.length || 0` out of 10, with a `Progress` bar. No changes needed — just ensuring it renders in the new card layout at the correct position in the hierarchy.

---

## 5. Pagination Strategy

Currently no pagination. For users with many orders:

- Add **"Carregar mais"** (Load More) button at the bottom of the list
- Show first 10 orders initially
- Each click loads 10 more
- Simple `useState` counter, slicing `filteredItems.slice(0, visibleCount)`
- No infinite scroll (avoids complexity with video lazy loading)
- Show count: "Mostrando 10 de 25 pedidos"

---

## 6. Files to Change

| File | Action | What Changes |
|------|--------|-------------|
| `src/components/advertiser/orders/AdvertiserOrderCard.tsx` | **Rewrite** | Mobile-first card with video preview area (or placeholder), single button, lazy video loading via IntersectionObserver, no emoji icons |
| `src/hooks/useOrderStatus.ts` | **Edit** | Remove `action` from `video_aprovado` (lines 196-204) and `ativo` (lines 216-224) |
| `src/pages/advertiser/AdvertiserOrders.tsx` | **Edit** | Add load-more pagination (show 10, load 10 more), add "Mostrando X de Y" counter |

No other files change. No database changes. Header and Stats components remain as-is.

---

## 7. Implementation Sequence

1. Edit `useOrderStatus.ts` — remove `action` from `video_aprovado` and `ativo`
2. Rewrite `AdvertiserOrderCard.tsx` — mobile-first layout with video preview/placeholder, IntersectionObserver lazy loading, single action button, text-only delete
3. Add load-more pagination to `AdvertiserOrders.tsx`

