

# Fix: Logo Not Visually Scaling in Ticker Preview

## Root Cause

In `TickerLogoItem.tsx` (line 79), the scale is applied via `transform: scale()` on the `<img>` element. However:
- The `<img>` has `max-h-12 md:max-h-16 max-w-28 md:max-w-40` constraining its box size
- CSS `transform: scale()` scales the visual rendering but does NOT change the element's layout box
- The parent containers in `LogoTicker.tsx` (line 109) add `h-10 md:h-12 lg:h-14` and the ticker div has `overflow-hidden`
- Result: the image scales up visually but is immediately clipped by its own max constraints and parent overflow

## Solution

Move the `transform: scale()` from the `<img>` to the **wrapper `<div>`** in `TickerLogoItem.tsx`. This way the entire logo container scales, and the visual effect is clean and visible. Also remove the conflicting height constraint from the className passed in `LogoTicker.tsx`.

## Technical Changes

### File 1: `src/components/exa/TickerLogoItem.tsx`

- Move `style={{ transform: scale(scaleFactor) }}` from the `<img>` (line 79) to the parent `<div>` (line 64)
- Remove `transform` style from the `<img>` entirely
- The div already has `transition-all duration-300 ease-out` so the animation will be smooth

### File 2: `src/components/exa/LogoTicker.tsx`

- Remove the fixed height constraint `h-10 md:h-12 lg:h-14` from the className passed to `TickerLogoItem` (line 109) since it clips the scaled logos
- Keep the `transition-all duration-300 ease-out hover:scale-110` for non-admin hover effect

## Files modified

1. `src/components/exa/TickerLogoItem.tsx` -- move scale transform to container div
2. `src/components/exa/LogoTicker.tsx` -- remove height constraint on logo items

No other functionality is altered.

