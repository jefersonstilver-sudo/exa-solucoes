

# Fix: Sidebar Transparente no Mobile

## Causa Raiz

O Tailwind mapeia `bg-sidebar` → `hsl(var(--sidebar-background))`, mas a variável CSS `--sidebar-background` **nunca foi definida** em `src/styles/base.css`. Resultado: o `SheetContent` do drawer mobile renderiza com background transparente, mostrando o conteúdo da página por trás.

No desktop funciona porque o `<Sidebar>` em `ModernAdminSidebar.tsx` tem a classe `bg-gradient-to-b from-[#7D1818] via-[#9C1E1E] to-[#5C1515]` aplicada diretamente. Mas no mobile, o componente `Sidebar` (sidebar.tsx L193-205) renderiza como `<Sheet>` → `<SheetContent className="bg-sidebar ...">` → `<div>{children}</div>`. O gradient do `ModernAdminSidebar` fica no children interno, mas o `SheetContent` wrapper continua transparente.

## Correção — 2 pontos

### 1. Definir `--sidebar-background` e variáveis relacionadas em `src/styles/base.css`

Adicionar ao bloco `:root` (após as variáveis EXA existentes):

```css
--sidebar-background: 355 68% 37%;      /* #9C1E1E - EXA Red */
--sidebar-foreground: 0 0% 100%;         /* White text */
--sidebar-primary: 355 68% 37%;
--sidebar-primary-foreground: 0 0% 100%;
--sidebar-accent: 355 50% 25%;
--sidebar-accent-foreground: 0 0% 100%;
--sidebar-border: 0 0% 100% / 0.1;
--sidebar-ring: 355 68% 37%;
```

Isso garante que `bg-sidebar` resolve para o vermelho EXA, dando um fallback sólido.

### 2. Forçar o gradient no SheetContent mobile — `src/components/ui/sidebar.tsx`

Na linha 199, substituir `bg-sidebar` por um background explícito que garanta opacidade total no drawer:

```tsx
className="w-[85vw] max-w-[280px] bg-gradient-to-b from-[#7D1818] via-[#9C1E1E] to-[#5C1515] p-0 text-white [&>button]:hidden"
```

Isso replica exatamente o gradient do `ModernAdminSidebar`, garantindo que o wrapper do Sheet tenha o mesmo visual que o desktop.

## Arquivos Alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/styles/base.css` | Adicionar 8 variáveis `--sidebar-*` no `:root` e `.dark` |
| `src/components/ui/sidebar.tsx` | L199: `bg-sidebar` → gradient explícito EXA |

2 arquivos, 0 risco de regressão. Nenhuma lógica alterada.

