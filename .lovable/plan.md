

# Redesign Mobile Video Slot Cards — Apple-like Layout

## Problem

The current mobile layout uses a 2-column grid with microscopic text (7px-9px), tiny buttons (h-4 to h-6 = 16-24px), and cramped spacing. On iPhone, everything is squeezed and confusing — users cannot manage their videos effectively.

## Solution

Redesign the mobile experience with a clean, single-column layout inspired by Apple's design language: generous spacing, proper touch targets (44px minimum), clear visual hierarchy, and breathing room.

```text
┌─────────────────────────────────┐
│  Slot 1              ✅ Aprovado │
│  ─────────────────────────────  │
│  🎬 apice teste                 │
│  10s · horizontal               │
│                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌───┐ │
│  │  ⬇  │ │  📅 │ │  ℹ  │ │ 🗑│ │
│  └─────┘ └─────┘ └─────┘ └───┘ │
│                                 │
│  ★ Principal · ▶ ATIVO          │
└─────────────────────────────────┘
```

## Changes

### 1. `VideoSlotGrid.tsx` — Single column on mobile
- Change grid from `grid-cols-2` to `grid-cols-1` on mobile (`grid-cols-1 sm:grid-cols-2`)
- Increase gap from `gap-1.5` to `gap-3`

### 2. `VideoSlotCard.tsx` — Complete mobile redesign
- **Header**: Increase slot title from `text-[9px]` to `text-base`, badges from `text-[7px]` to `text-sm`
- **Video info section**: Replace cramped layout with spacious card — name at `text-sm`, metadata at `text-xs`, proper padding (`p-3`)
- **"Ver" button**: Increase to `h-9` with `text-sm` for proper touch target
- **"Definir Principal" button**: Increase to `h-9`, show full text on mobile instead of just "★"
- **Badges (Principal, ATIVO, EM EXIBICAO)**: Increase to `text-xs` with proper padding, show full text instead of single emoji characters
- **Status badges (Enviado, pending)**: Same treatment — full readable text at `text-xs`
- Remove all `text-[7px]`, `text-[9px]`, `h-4` sizing on mobile — minimum text `text-xs`, minimum button height `h-9`

### 3. `VideoSlotActions.tsx` — Proper touch targets
- Increase button sizes from `h-6 p-1` to `h-10 p-2.5` on mobile
- Increase icon sizes from `h-2.5 w-2.5` to `h-4.5 w-4.5` on mobile
- Increase gap from `gap-0.5` to `gap-2`

### 4. `VideoSlotUpload.tsx` — Readable upload form
- Increase padding, text sizes, and button heights for mobile
- "Selecionar Arquivo" button to `h-10 text-sm`
- "Enviar Video" button to `h-11 text-sm`
- Title input properly sized

### What stays the same
- Desktop layout (lg: breakpoint) is untouched
- All functionality, data flow, and logic remain identical
- No changes to any other pages or components

