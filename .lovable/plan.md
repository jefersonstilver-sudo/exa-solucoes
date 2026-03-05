

# Diagnostic Result: Edge Function Not Deployed

## Root Cause Confirmed

The edge function file `supabase/functions/verify-user-whatsapp-code/index.ts` contains the correct code, but the **deployed version is outdated**. Evidence:

| Check | Result |
|-------|--------|
| Database `telefone_verificado` | `false` (not updated) |
| Database `telefone_verificado_at` | `null` (not updated) |
| Edge function log after verification | Only shows "Código verificado com sucesso" — no "Telefone marcado como verificado via phone_change" log |
| Frontend code (`AdvertiserSettings.tsx`) | Correct — reads `telefone_verificado`, passes `mode`, calls `loadUserSettings()` |
| Modal code (`WhatsAppVerificationModal.tsx`) | Correct — short-circuits in `verify` mode after Step 2 |

## What Needs to Happen

**One action only**: Redeploy the edge function `verify-user-whatsapp-code`.

The file already contains the correct code (lines 161-176). No code changes are needed. The function just needs to be deployed so the running version matches the source file.

## No Layout or Design Changes

All changes made were strictly logic-level:
- Edge function: added `phone_change` persistence block (already in file, needs deploy)
- Modal: added `mode` prop for verify vs change flow
- Settings page: passes `mode` and calls `loadUserSettings()` in `onSuccess`

The page layout, colors, typography, spacing, and component structure remain exactly as they were before. The screenshot you shared matches the current design — nothing was altered visually.

## After Deploy

Once the edge function is redeployed:
1. User clicks "Verificar" → modal opens in verify mode
2. Enters code → edge function validates + sets `telefone_verificado = true` in DB
3. Modal calls `onSuccess` → `loadUserSettings()` reads the updated value
4. UI shows green verified badge, 2FA toggle becomes enabled

