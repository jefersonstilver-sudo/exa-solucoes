

# Final Implementation Plan: WhatsApp Verification Fix + State Synchronization

## SECTION 1 — Edge Function Fix

**File:** `supabase/functions/verify-user-whatsapp-code/index.ts`

Insert a new block after line 159 (after the `signup` block closes, before the final `return` on line 161):

```typescript
// Se for verificação do número atual (phone_change), marcar como verificado
if (tipo === 'phone_change' && userId) {
  const { error: markVerifiedError } = await supabase
    .from('users')
    .update({ 
      telefone_verificado: true,
      telefone_verificado_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (markVerifiedError) {
    console.error('⚠️ [VERIFY-USER-CODE] Erro ao marcar telefone como verificado (phone_change):', markVerifiedError);
  } else {
    console.log('✅ [VERIFY-USER-CODE] Telefone marcado como verificado via phone_change');
  }
}
```

**Safety confirmation:** At line 159, the code has already been validated (lines 80-96 — invalid code returns 400 and exits) and consumed (lines 99-107 — failure throws, caught by catch at line 169). It is structurally impossible to reach line 159 without successful validation.

---

## SECTION 2 — Modal Flow Correction

**File:** `src/components/settings/WhatsAppVerificationModal.tsx`

Add a `mode` prop to the interface:

```typescript
interface WhatsAppVerificationModalProps {
  // ...existing props
  mode?: 'verify' | 'change'; // default: 'change'
}
```

**Two modes:**

| Mode | Flow | Steps |
|------|------|-------|
| `verify` | Verify existing number | Step 1 (send code) → Step 2 (enter code) → `onSuccess` + `onClose` |
| `change` | Change to new number | Step 1 → Step 2 → Step 3 (new number) → Step 4 (verify new) → `onSuccess` + `onClose` |

**Implementation detail:** In `handleVerifyCurrentPhone` (line 129), after `toast.success('Código verificado!')`:

- If `mode === 'verify'`: call `onSuccess(currentPhone)` then `onClose()`. Do NOT call `setStep(3)`.
- If `mode === 'change'`: call `setStep(3)` as currently (no change).

**Title:** Line 217 changes from hardcoded "Alterar WhatsApp" to conditional: `mode === 'verify' ? 'Verificar WhatsApp' : 'Alterar WhatsApp'`.

**Step 1 text** (line 237): When `mode === 'verify'`, change to "Para verificar seu número, enviaremos um código para seu WhatsApp:" instead of mentioning security/alteration.

No changes to Steps 3, 4, `handleSendCodeNewPhone`, `handleVerifyNewPhone`, or `handleResend`.

---

## SECTION 3 — Settings Page State Synchronization

**File:** `src/pages/advertiser/AdvertiserSettings.tsx`

**A. Pass `mode` to modal** (line 524-528):

```tsx
<WhatsAppVerificationModal
  open={showWhatsAppModal}
  onClose={() => setShowWhatsAppModal(false)}
  currentPhone={settings.phone}
  userId={userProfile?.id || ''}
  mode={phoneVerified ? 'change' : 'verify'}
  onSuccess={...}
/>
```

**B. Simplify `onSuccess` callback** (lines 529-544):

Replace with:

```tsx
onSuccess={async (newPhone) => {
  // Optimistic UI update
  setSettings((prev) => ({ ...prev, phone: newPhone }));
  setPhoneVerified(true);
  
  // Full resync from database (edge function already persisted telefone_verificado)
  await loadUserSettings();
  
  toast.success('WhatsApp verificado com sucesso!');
}}
```

Remove the manual `supabase.from('users').update(...)` block (lines 532-541) — the edge function now handles persistence. `loadUserSettings()` resyncs all state from DB, guaranteeing no stale data.

---

## SECTION 4 — 2FA Dependency

Already correctly implemented. No changes needed:

- Line 466: `disabled={!phoneVerified}` on the AppleSwitch
- Lines 448-461: Amber warning with "Verificar agora" button when `!phoneVerified`
- Lines 469-472: Guard that prevents toggle if phone not verified

After `loadUserSettings()` sets `phoneVerified = true` from DB, the toggle becomes immediately enabled in the same render cycle. No page refresh needed.

---

## SECTION 5 — Company Section

**File:** `src/components/settings/CompanyBrandSection.tsx` — **No changes needed.**

Already confirmed in prior diagnostic:

- **Logo exists:** Institutional summary card renders with logo on red gradient background, company name, document, and green status badges (lines 46+, 213-229)
- **No logo:** Dashed-border upload placeholder with "Upload" text (lines 259-268)
- **Terms:** `CompanyTermsCheckbox` is disabled once accepted, shows confirmation date
- **`isEditing` prop:** Already received and applied to all fields

---

## SECTION 6 — UI Consistency

After the fix, all verified states reflect backend truth through `loadUserSettings()`:

| State | Source | UI Indicator |
|-------|--------|-------------|
| WhatsApp verified | `users.telefone_verificado` | Green badge + "Alterar Número" button |
| WhatsApp unverified | `users.telefone_verificado = false` | Amber badge + "Verificar" button |
| 2FA status | `users.two_factor_enabled` | AppleSwitch + Active/Inactive badge |
| Terms accepted | `users.empresa_aceite_termo` | Disabled checkbox + date |
| Company data | `users` + `profiles` | Identity card or placeholder |

No stale UI possible: `loadUserSettings()` is called after every modal action, and the edge function persists before the frontend even receives the response.

---

## SECTION 7 — Risk Assessment

- **No database schema changes** — uses existing `telefone_verificado` and `telefone_verificado_at` columns
- **No new tables**
- **No new edge functions** — only modifying existing `verify-user-whatsapp-code`
- **No breaking architecture changes** — `mode` prop defaults to `'change'`, preserving backward compatibility
- **Minimal risk deployment** — 3 files, additive changes only, existing flows untouched

---

## FINAL FILE CHANGE SUMMARY

| # | File | What Changes | Lines Affected |
|---|------|-------------|----------------|
| 1 | `supabase/functions/verify-user-whatsapp-code/index.ts` | Add `phone_change` block to persist `telefone_verificado = true` after validated code | Insert after line 159 |
| 2 | `src/components/settings/WhatsAppVerificationModal.tsx` | Add `mode` prop; short-circuit to `onSuccess` + `onClose` after Step 2 when `mode='verify'`; conditional title/text | Props interface, `handleVerifyCurrentPhone`, dialog title |
| 3 | `src/pages/advertiser/AdvertiserSettings.tsx` | Pass `mode` prop based on `phoneVerified`; simplify `onSuccess` to use `loadUserSettings()` instead of manual DB update | Lines 524-544 |

No other files modified.

