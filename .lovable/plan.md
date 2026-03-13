

# MOBILE FIX FASE 2 — GRUPO A — SIDEBAR/DRAWER

## Diagnóstico Real (arquivos lidos)

### Estado Atual

1. **Overlay (A-01)**: O sidebar mobile usa o componente `Sheet` do shadcn (sidebar.tsx L193-210). O `SheetOverlay` já renderiza com `bg-black/80` e `z-[var(--z-drawer)]` (120). O overlay funciona corretamente -- o background escuro está presente. Nenhuma correção necessária aqui.

2. **Largura (A-02)**: O `SIDEBAR_WIDTH_MOBILE` em sidebar.tsx L23 é `"18rem"` (288px). Porém o `SheetContent` do sidebar usa `w-[--sidebar-width]` que é setado como `18rem`. O sheet.tsx left variant já tem `w-3/4` como base, mas o sidebar sobrescreve com `w-[--sidebar-width]`. 288px em 390px = 73% da tela, deixando ~102px para fechar. Está razoável mas pode ser refinado para `max-w-[280px] w-[85vw]` conforme solicitado.

3. **Botão Sair (A-03)**: O `SidebarFooter` (L589-649) já tem a estrutura correta: avatar + nome + botão sair. Está dentro do flex column do sidebar com `border-t`. O drawer do Sheet já envolve children em `flex h-full w-full flex-col` (L207). O SidebarContent tem `overflow-y-auto` e padding-bottom de 80px. O footer parece estar bem posicionado. Preciso verificar se na prática ele fica "flutuando" -- pode ser que o padding-bottom excessivo (80px) do SidebarContent esteja empurrando o footer.

4. **Ícone de hambúrguer (A-04)**: O `SidebarTrigger` (sidebar.tsx L260-301) renderiza um `ChevronLeft` (seta `<`) sempre -- tanto no desktop quanto no mobile header. No mobile, deveria ser um ícone de Menu (hambúrguer). Este é o problema real visível no screenshot.

---

## Plano de Execução

### [A-01] OVERLAY — Sem alteração necessária
O `SheetOverlay` já tem `bg-black/80` com z-index correto. O overlay escuro aparece. Confirmado no código.

### [A-02] LARGURA DO DRAWER
**Arquivo**: `src/components/ui/sidebar.tsx` (L196-209)

Alterar o `SheetContent` no bloco mobile do `Sidebar` para limitar a largura:
```tsx
<SheetContent
  ...
  className="w-[85vw] max-w-[280px] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
  // Remove o style que setava --sidebar-width: 18rem
>
```

### [A-03] FOOTER DO DRAWER
**Arquivo**: `src/components/admin/layout/ModernAdminSidebar.tsx` (L472-478)

O `SidebarContent` tem `paddingBottom: calc(env(safe-area-inset-bottom) + 80px)` que é excessivo dentro do drawer mobile. Reduzir para `16px` em mobile (o footer do sidebar já está fora do SidebarContent, dentro do SidebarFooter).

Também no `SidebarFooter` (L590): adicionar `mt-auto` para garantir que fique no fundo.

### [A-04] ÍCONE DE HAMBÚRGUER NO HEADER
**Arquivo**: `src/components/admin/layout/ModernAdminLayout.tsx` (L66)

Substituir o `SidebarTrigger` mobile por um botão customizado que usa `Menu` do Lucide em vez do `ChevronLeft`:

```tsx
<button onClick={toggleSidebar} className="md:hidden mr-2 p-2">
  <Menu className="h-5 w-5" />
</button>
```

Isso requer acesso ao `useSidebar()` — que já está disponível dentro do `SidebarProvider`. Vou criar um componente inline `MobileMenuTrigger` que usa `useSidebar().toggleSidebar()` com ícone `Menu`.

---

## Resumo de Arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/components/ui/sidebar.tsx` | L196-209: Largura mobile → `w-[85vw] max-w-[280px]`, remover style inline de width |
| `src/components/admin/layout/ModernAdminSidebar.tsx` | L472-478: Reduzir padding-bottom mobile; L590: adicionar `mt-auto` ao footer |
| `src/components/admin/layout/ModernAdminLayout.tsx` | L64-67: Substituir `SidebarTrigger` mobile por botão com ícone `Menu` |

3 arquivos, 0 componentes novos, 0 dependências novas.

