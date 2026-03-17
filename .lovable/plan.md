

# Fix: Sidebar Travada e Responsividade Geral

## Diagnóstico

Analisei o layout, sidebar, Sheet, Dialog, Drawer e CSS global. Identifiquei **3 causas raiz** que explicam o travamento e problemas de interação no mobile:

### Causa 1: CSS Global Agressivo Quebrando Touch Targets na Sidebar

Em `src/styles/responsive-optimizations.css`, a regra:
```css
@media (max-width: 768px) {
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```
Aplica-se a **TODOS** os botões e links, incluindo os itens internos da sidebar (NavLinks, tooltips, badges). Isso faz com que elementos pequenos (badges, ícones, close buttons) expandam para 44x44px, causando sobreposição de touch targets e impossibilitando cliques precisos. O botão de fechar do Sheet (X) e os itens de navegação se sobrepõem.

### Causa 2: Drawer Component com Layout Errado

O `src/components/ui/drawer.tsx` define o `DrawerContent` como `fixed inset-y-0 right-0` (slide from right, fullscreen height) com `z-50`. Quando o `CreateTaskModal` abre como Drawer no mobile, ele compete com a sidebar Sheet (z-120) e pode criar stacking context conflicts. O overlay do Drawer é `z-50` enquanto o Sheet é `z-120` -- inconsistência.

### Causa 3: Sidebar Desktop Wrapper com z-30 Capturando Eventos

Em `ModernAdminLayout.tsx` linha 62:
```jsx
<div className="relative z-30">
  <ModernAdminSidebar />
</div>
```
No mobile, o `<Sidebar>` renderiza como Sheet (portal fora do DOM), mas essa `div` vazia com `z-30` e `relative` ainda ocupa espaço no flex layout e pode interceptar eventos de toque na área esquerda da tela.

---

## Plano de Correção

### 1. Corrigir CSS Global — Escopar Touch Targets

**Arquivo: `src/styles/responsive-optimizations.css`**

Remover a regra genérica `button, a, [role="button"]` e substituir por regras escopadas que NÃO afetam a sidebar:

```css
@media (max-width: 768px) {
  main button, main a, main [role="button"],
  .touch-target-safe button, .touch-target-safe a {
    min-height: 44px;
    min-width: 44px;
  }
}
```

Isso garante que touch targets de 44px se aplicam ao conteúdo principal mas NÃO ao sidebar, Sheet overlays, ou dialogs internos.

### 2. Corrigir Layout Wrapper da Sidebar no Mobile

**Arquivo: `src/components/admin/layout/ModernAdminLayout.tsx`**

Remover o wrapper `div.relative.z-30` desnecessário e simplificar:

```jsx
<div className="flex h-screen w-full bg-background overflow-hidden relative">
  <ModernAdminSidebar />
  {!isMobile && <SidebarTriggerPositioned isTablet={isTablet} />}
  <SidebarInset>...</SidebarInset>
</div>
```

No mobile, o `Sidebar` renderiza via Sheet/Portal, então não precisa de wrapper. No desktop, o componente `Sidebar` já gerencia seu próprio z-index.

### 3. Normalizar Z-Index do Drawer

**Arquivo: `src/components/ui/drawer.tsx`**

Atualizar overlay e content para usar as variáveis CSS padronizadas:
- DrawerOverlay: `z-50` → `z-[var(--z-drawer)]` (120)
- DrawerContent: `z-50` → `z-[var(--z-drawer)]` (120)

### 4. Garantir Sidebar Items Responsivos

**Arquivo: `src/components/admin/layout/ModernAdminSidebar.tsx`**

Adicionar classe de exclusão nos NavLinks da sidebar para evitar conflito com a regra de touch targets:
- Adicionar `min-h-0 min-w-0` nos itens de navegação para resetar os min-height/min-width forçados pelo CSS global

### 5. CreateTaskModal — Drawer Fullscreen no Mobile

**Arquivo: `src/components/admin/agenda/CreateTaskModal.tsx`**

O DrawerContent já usa `max-h-[95vh]` mas não tem z-index adequado. Atualizar para:
```jsx
<DrawerContent className="max-h-[95dvh] z-[var(--z-modal)]">
```

---

## Resumo de Arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/styles/responsive-optimizations.css` | Escopar touch targets para não afetar sidebar/overlays |
| `src/components/admin/layout/ModernAdminLayout.tsx` | Remover wrapper z-30, condicionar SidebarTrigger |
| `src/components/ui/drawer.tsx` | Normalizar z-index para usar variáveis CSS |
| `src/components/admin/layout/ModernAdminSidebar.tsx` | Reset min-h/min-w nos NavLinks |
| `src/components/admin/agenda/CreateTaskModal.tsx` | Z-index e altura responsiva no Drawer |

5 arquivos, 0 dependências novas. Foco em desbloquear interações e normalizar a hierarquia de camadas.

