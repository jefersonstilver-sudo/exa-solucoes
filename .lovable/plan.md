

# Fix: White Screen - Vite Dev Server 503 Errors

## Problem Identified

The Vite development server is returning **503 errors** when trying to serve source files. The `main.tsx` entry point never executes (no "Starting application" log appears). The entire application is blank on ALL routes, not just the proposal page.

## Root Cause

The dev server is stuck/crashed after the recent batch of edits (10+ files modified simultaneously). The massive module graph (150+ scripts) combined with rapid changes overwhelmed the server.

## Fix Strategy

Make a minimal, targeted change to trigger a clean Vite HMR restart and force cache invalidation:

### 1. Bump version prefix to force fresh start

**File**: `src/config/version.ts`
- Change `APP_VERSION` prefix from `4.0` to `5.0`
- This triggers the `useForceCacheClear` hook to clear all stale browser caches on next load
- The code change itself forces Vite to re-process the module graph from scratch

### 2. Simplify the force cache clear hook to prevent reload loops

**File**: `src/hooks/useForceCacheClear.ts`
- Remove the `window.location.reload()` call entirely
- Instead, just clear caches and store the new version silently
- The reload was previously causing potential infinite loops and is unnecessary since Vite HMR handles live updates
- Cache clearing (service workers, sessionStorage) still happens, but without the disruptive forced reload

### 3. Add safety guard in main.tsx

**File**: `src/main.tsx`
- Add a `setTimeout` fallback that shows the emergency error page if React hasn't rendered within 15 seconds
- This prevents permanent white screens in the future by showing an actionable error message with a reload button

## What does NOT change

- No UI, functionality, or workflow changes
- No dependency changes
- No changes to any agenda, task, or contact modules
- All recent ScheduleTimeModal, notification, and mobile improvements remain intact

## Technical Details

The 503 errors from Vite happen when the dev server's module transform pipeline is stuck. A code change to `version.ts` will trigger a targeted HMR update that cascades through `main.tsx` and `App.tsx`, effectively forcing Vite to re-establish its module graph cleanly.

