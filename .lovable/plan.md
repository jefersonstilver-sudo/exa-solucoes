

# Fix: [object Object] tags + duplicate key error on order creation

## Problem 1: `[object Object]` tags

The `selected_buildings` column stores objects with `building_id` as the key (not `id`):
```json
{ "building_id": "aefe8faa-...", "building_name": "Bella Vita", "bairro": "Centro", ... }
```

Current code in `ClientSearchSection.tsx` line 94 tries `b?.id` which is `undefined`, falling back to `String(b)` = `[object Object]`.

**Fix**: Change `b?.id` to `b?.building_id` in both places:

### `ClientSearchSection.tsx` (lines 89-95)
```typescript
buildings = proposal.selected_buildings.map((b: any) =>
  typeof b === 'string' ? b : b?.building_id || b?.id || String(b)
);
```

### `OrderConfigSection.tsx` (line 115)
```typescript
const idStr = typeof rawId === 'string' ? rawId 
  : (rawId as any)?.building_id || (rawId as any)?.id || JSON.stringify(rawId);
```

## Problem 2: Duplicate key error on account creation

When a proposal is selected, `checkAccountStatus` returns `{ exists: true, userId: "..." }` but the edge function might return `user_id` differently. Then `clientId` stays `null`, causing `submitOrder` to call `createAccount()` which fails because the user already exists in `auth.users`.

**Fix in `useAdminCreateOrder.ts`** (`submitOrder`, lines 196-202):

Before calling `createAccount()`, check account status first:
```typescript
if (!clientId && formData.clientEmail) {
  // Check if account exists before trying to create
  const status = await checkAccountStatus(formData.clientEmail, true);
  if (status.exists && status.userId) {
    clientId = status.userId;
  } else {
    const result = await createAccount();
    clientId = result.userId;
  }
}
```

## Summary

| File | Change |
|------|--------|
| `ClientSearchSection.tsx` | Use `building_id` instead of `id` when extracting building IDs |
| `OrderConfigSection.tsx` | Use `building_id` as primary key extraction |
| `useAdminCreateOrder.ts` | Check if account exists before creating to prevent duplicate key error |

