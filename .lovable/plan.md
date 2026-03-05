

# Fix: Enlarge Logo and Enhance Dashboard Header Card

## Problem
The logo in `AdvertiserDashboardHeader.tsx` is too small (56x64px) and has no hover interaction. The card itself needs more visual presence.

## Changes — Single File: `AdvertiserDashboardHeader.tsx`

### 1. Enlarge Logo Container
- Current: `w-14 h-14 sm:w-16 sm:h-16` (56-64px)
- New: `w-20 h-20 sm:w-24 sm:h-24` (80-96px) — clearly visible, prominent
- Remove `p-2` padding on the image so the logo fills more space, use `p-3` for better proportion

### 2. Add Sophisticated Hover Effect on Logo
- Add `group` class on the logo container
- On hover: subtle scale-up (`hover:scale-105`), enhanced shadow (`hover:shadow-xl`), slight brightness boost on the image
- Smooth transition: `transition-all duration-300 ease-out`
- Optional ring glow: `hover:ring-2 hover:ring-white/20`

### 3. Improve Card Visual Presence
- Add a subtle gradient accent or slightly stronger border
- Increase padding slightly for breathing room
- Keep the minimalist corporate style — no drastic changes

### Files Changed
| File | Change |
|------|--------|
| `src/components/advertiser/orders/AdvertiserDashboardHeader.tsx` | Enlarge logo (w-20/w-24), add hover effect (scale + shadow + glow), improve card styling |

No other files affected. No functionality changes.

