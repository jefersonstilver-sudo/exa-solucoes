

# Root Cause: Logo Upload Error

## Problem

The error is: **"Could not find the 'logo_url' column of 'users' in the schema cache"**

The `users` table does NOT have a `logo_url` column. It has `avatar_url`, but not `logo_url`.

In `CompanyBrandSection.tsx`, three places reference `logo_url` on the `users` table using `as any` to bypass TypeScript:

1. **Line 73** — Reading: `(logoData as any)?.logo_url` — silently returns `undefined` (no error, but logo never loads)
2. **Line 92** — Writing: `supabase.from('users').update({ logo_url: url } as any)` — **THIS IS THE ERROR**
3. **Line 111** — Removing: `supabase.from('users').update({ logo_url: null } as any)` — same error

## Solution

There are two options:

**Option A (no DB change):** Use the existing `avatar_url` column on the `users` table to store the company logo URL. This column already exists and works. The three references to `logo_url` in `CompanyBrandSection.tsx` get changed to `avatar_url`.

**Option B (DB migration):** Add a `logo_url` column to the `users` table.

I recommend **Option A** since `avatar_url` already exists on the `users` table and serves the same purpose for the advertiser's visual identity. No database migration needed.

## Files to Change

| File | Lines | Change |
|------|-------|--------|
| `src/components/settings/CompanyBrandSection.tsx` | 73 | Change `(logoData as any)?.logo_url` → `logoData?.avatar_url` |
| `src/components/settings/CompanyBrandSection.tsx` | 92 | Change `{ logo_url: url } as any` → `{ avatar_url: url }` |
| `src/components/settings/CompanyBrandSection.tsx` | 111 | Change `{ logo_url: null } as any` → `{ avatar_url: null }` |
| `src/pages/advertiser/AdvertiserOrders.tsx` | ~42 | The `fetchCompanyData` also references `logo_url` via `anyData.logo_url` — change to use `avatar_url` directly |

All `as any` casts on these lines can be removed since `avatar_url` is a typed column.

## Implementation Sequence

1. Fix 3 references in `CompanyBrandSection.tsx` (lines 73, 92, 111)
2. Fix `AdvertiserOrders.tsx` company data fetch to use `avatar_url` consistently

