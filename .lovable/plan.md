

# MOBILE FIX — Plano de Execução

## Escopo Real (após análise)

Das 13 correções solicitadas, **2 já estão implementadas** (FIX-10 e FIX-11):
- `OrdersPage.tsx` já tem `isMobile` + `OrderMobileList` com layout mobile completo
- `ProviderBenefits.tsx` já tem `BenefitMobileList` com cards mobile

Serão executadas **11 correções** em **4 fases**.

---

## FASE 1 — Correções Globais CSS (4 fixes)

**[FIX-01]** `src/styles/responsive-optimizations.css`
- Adicionar `input, textarea, select { font-size: 16px !important; }` dentro do media query mobile existente

**[FIX-02]** `src/styles/base.css`
- Adicionar `html, body { overflow-x: hidden; max-width: 100vw; }` no `@layer base`
- **`src/pages/Exa.tsx`**: Remover o `useEffect` que seta `overflowX: hidden` inline no body/html (workaround agora desnecessário)

**[FIX-03]** `src/modules/monitoramento-ia/styles/exa-glassmorphism.css`
- `.exa-shape-1`: `width: min(600px, 90vw); height: min(600px, 90vw);`
- `.exa-shape-2`: `width: min(500px, 90vw); height: min(500px, 90vw);`
- Adicionar `overflow: hidden; contain: layout;` no seletor compartilhado `.exa-shape-1, .exa-shape-2`

**[FIX-04]** Criar `src/styles/z-index.css` com variáveis CSS de camadas
- Importar no `src/index.css`
- Aplicar nos componentes:
  - `MobileBottomNav.tsx`: `z-50` → `z-[var(--z-bottom-nav)]` (z-40 CSS var)
  - `MobileBottomNavigation.tsx`: idem
  - `dialog.tsx`: overlay `z-50` → `z-[var(--z-modal-overlay)]`, content `z-50` → `z-[var(--z-modal)]`
  - `sheet.tsx`: overlay e content `z-50` → `z-[var(--z-drawer)]` (z-120)
  - `FullscreenContractEditor.tsx`: `z-[9999999]` → `z-[var(--z-fullscreen)]`
  - `FullscreenMonitor.tsx`: `z-[9999999]` → `z-[var(--z-fullscreen)]`
  - `MobileFullscreenMap.tsx`: `z-[99999]` → `z-[var(--z-fullscreen)]`

**Arquivos**: 8 arquivos

---

## FASE 2 — Modais e Drawers Mobile (3 fixes)

**[FIX-05]** `src/components/ui/dialog.tsx`
- DialogContent: adicionar `max-h-[calc(100dvh-2rem)] overflow-y-auto w-[calc(100%-2rem)] sm:w-full` às classes existentes

**[FIX-06]** `src/components/ui/sheet.tsx`
- `sheetVariants` bottom: adicionar `max-h-[90dvh] overflow-y-auto`
- left/right: adicionar `overflow-y-auto`

**[FIX-07]** `src/components/admin/financeiro/contas-pagar/PagarContaModal.tsx`
- O DialogContent já tem `h-[95vh]` → mudar para `max-h-[calc(100dvh-2rem)]`
- Garantir que o conteúdo interno tem scroll adequado (já tem `flex-1 overflow-hidden flex flex-col`)
- Footer: adicionar `sticky bottom-0 bg-background pt-3 border-t`

**[FIX-08]** `src/components/admin/contracts/FullscreenContractEditor.tsx`
- Container: `fixed inset-0 ... flex flex-col` → adicionar `h-[100dvh]`
- Content area (`.flex-1.overflow-hidden`): → `flex-1 overflow-y-auto`

**Arquivos**: 4 arquivos

---

## FASE 3 — Tabelas Admin (1 fix)

**[FIX-09]** `src/modules/monitoramento-ia/components/PanelsTable.tsx`
- Envolver tabela existente em `hidden md:block`
- Adicionar `block md:hidden` com cards mobile mostrando: nome, status badge, condomínio, último online, botões de ação

**[FIX-10/11]** — JÁ IMPLEMENTADOS. OrdersPage e ProviderBenefits já possuem listas mobile dedicadas.

**Arquivos**: 1 arquivo

---

## FASE 4 — Home Page Overflow (2 fixes)

**[FIX-12]** `src/pages/Exa.tsx`
- O div do LogoTicker com `w-screen left-1/2 -translate-x-1/2` → mudar para `w-full` com `inset-x-0` ou manter overflow-hidden no pai (já tem)
- Remover useEffect de overflowX (feito no FIX-02)

**[FIX-13]** O LogoTicker já está dentro de um container com `overflow-hidden`. Verificar e garantir que o container pai contém o overflow corretamente. Mudar `w-screen left-1/2 -translate-x-1/2` para abordagem mais segura.

**Arquivos**: 1 arquivo (Exa.tsx, já tocado no FIX-02)

---

## Resumo Total

| Fase | Fixes | Arquivos |
|------|-------|----------|
| 1 — CSS Global | FIX-01 a FIX-04 | 8 |
| 2 — Modais | FIX-05 a FIX-08 | 4 |
| 3 — Tabelas | FIX-09 | 1 |
| 4 — Home | FIX-12, FIX-13 | 1 |
| **Total** | **11 fixes** | **~12 arquivos únicos** |

