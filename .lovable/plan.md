

# Fix: Remove redundant header and clean up mobile order detail page

## Problem
On mobile, "Detalhes do Pedido" appears 3 times:
1. In the sticky top header bar
2. As a large `<h1>` below it  
3. Inside the `OrderNameEdit` card

The `OrderNameEdit` card button is also misaligned and the whole top section feels cluttered.

## Changes

### 1. `src/pages/advertiser/OrderDetails.tsx` (lines 440-453)
- **Remove** the redundant `<div className="mb-3">` block that renders the `<h1>Detalhes do Pedido</h1>` and `#ID` — the sticky mobile header already shows the title, and the `OrderNameEdit` card already shows the order name/ID
- This eliminates the double title on mobile

### 2. `src/components/order/OrderNameEdit.tsx`
- Make the card more compact and Apple-like on mobile:
  - Remove the `border-l-4 border-l-indexa-purple` heavy left border, use a subtle `border border-gray-200 rounded-xl shadow-sm` instead
  - Reduce padding to `p-3` on mobile
  - Make the layout a clean single row: name on left, small edit icon button on right (no text label, just the pencil icon with proper 44px touch target)
  - Show the `#ID` as a small `text-xs text-muted-foreground` under the name
  - When editing: full-width input with inline save/cancel buttons below, properly sized for touch

These two changes remove all redundancy and create a clean, minimal top section.

