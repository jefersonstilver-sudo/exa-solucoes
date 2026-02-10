

# Fix: Logo Scale Factor Not Applying Visually

## Root Cause (Two Conflicts)

1. **Overflow clipping**: The ticker container div (line 177 of `LogoTicker.tsx`) has fixed height `h-16 md:h-18 lg:h-20` with `overflow-hidden`. Any logo scaled above 100% gets cut off.

2. **CSS transform conflict**: The `className` on TickerLogoItem includes Tailwind classes like `hover:scale-110` and `scale-105` (isSelected). These generate CSS `transform: scale(1.1)` which **overrides** the inline `style={{ transform: scale(scaleFactor) }}`. CSS `transform` from classes and inline styles cannot stack -- one replaces the other entirely.

## Solution

### File 1: `src/components/exa/TickerLogoItem.tsx`

- Remove `scale-105` from the `isSelected` className (line 67)
- Combine all scale values into a **single inline transform**: multiply `scaleFactor` by the selection boost (1.05 when selected)
- Remove `hover:scale-110` from the `className` prop handling (it will be handled by the parent)

Change the div style to:
```tsx
style={{ 
  cursor: hasInteraction ? 'pointer' : 'default', 
  transform: `scale(${scaleFactor * (isSelected ? 1.05 : 1)})` 
}}
```

Remove `scale-105` from the isSelected className string.

### File 2: `src/components/exa/LogoTicker.tsx`

- Remove `hover:scale-110` from the className passed to TickerLogoItem (line 109), since it conflicts with the inline transform
- Remove `overflow-hidden` from the ticker container div (line 177) or replace with `overflow-x-hidden overflow-y-visible` to allow vertical expansion of scaled logos

Line 109 change:
```tsx
className="transition-all duration-300 ease-out"
```

Line 177 change -- replace `overflow-hidden` with `overflow-x-hidden`:
```tsx
className="ticker w-full h-16 md:h-18 lg:h-20 relative overflow-x-hidden bg-[#9C1E1E] rounded-none"
```

## Files Modified

1. `src/components/exa/TickerLogoItem.tsx` -- unify all transforms into single inline style
2. `src/components/exa/LogoTicker.tsx` -- remove conflicting hover:scale-110 class, fix overflow clipping
