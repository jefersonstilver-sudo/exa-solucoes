

# Fix TS2589 Build Error and Restore Preview

## Problem
The build fails with `TS2589: Type instantiation is excessively deep` at `src/services/supabase.ts` line 136. This prevents the preview from loading (connection refused = dev server crashed during build).

The CORS issue mentioned has already been reverted on GitHub. The remaining blocker is this TypeScript error.

## Root Cause
Line 136: `query.eq('user_id', user.id)` — TypeScript cannot resolve the deeply nested generic types when chaining `.eq()` on a query variable that was built with `.from().select().order().limit()`. This is a known Supabase SDK type depth issue.

## Fix
Cast the query builder to `any` before calling `.eq()`, or restructure to avoid the chained variable approach:

**In `src/services/supabase.ts` (lines 120-141)**, replace the current `getAllPedidos` implementation to use two separate query paths instead of conditionally chaining on a shared variable:

```typescript
export const getAllPedidos = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const adminRoles = ['admin', 'super_admin', 'admin_departamental', 'comercial'];
  const isAdmin = profile && adminRoles.includes(profile.role);

  if (isAdmin) {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return data || [];
  } else {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return data || [];
  }
};
```

This avoids the intermediate `query` variable that causes the infinite type instantiation.

## Impact
- Fixes the only remaining build error
- No UI or functionality changes
- Preview will load once the build succeeds

