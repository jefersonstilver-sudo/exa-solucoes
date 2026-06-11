## Diagnóstico

Após inspecionar o código:

- **Rota está registrada** em `src/routes/SuperAdminRoutes.tsx` (linha 280): `<Route path="usuarios" element={<UsersPage />} />`. Montagem correta em `/super_admin/*` (App.tsx) → resolve em `/super_admin/usuarios`.
- **Sidebar aponta corretamente** em `src/components/admin/layout/ModernAdminSidebar.tsx` (linha 401-405): `href: buildPath('usuarios')` com `useAdminBasePath` retornando `/super_admin` para `super_admin` → `/super_admin/usuarios`. NavLink usa `to={item.href}` sem `preventDefault`.
- **Componente existe** (`src/pages/admin/UsersPage.tsx`, default export) e importa hooks/diálogos que existem (`useUserStats.tsx`, `UserConsoleDialog`, `CreateUserDialog`, etc.).
- **Permissão não bloqueia**: `super_admin` é tratado como CEO em `useDynamicModulePermissions` e tem `hasModuleAccess` sempre `true`. Não há `ProtectedModuleRoute` envolvendo a rota.
- **Não existe `<Navigate>` ou `navigate()` que redirecione `/super_admin/usuarios` → `/super_admin`** em nenhum lugar do código.

A tela "Carregando página…" com logo é o `PageTransitionLoader` global (`usePageTransition`), que aparece em qualquer troca de rota. Ele esconde, durante ~500 ms, qualquer crash de render do componente filho.

A hipótese mais forte (consistente com URL voltar a `/super_admin` e nenhum erro visível) é: **o `UsersPage` lança um erro durante render/effect** (ex.: RPC `get_users_with_last_access` ausente/sem permissão, hook `useUserStats` falhando, sub-componente quebrado). Esse erro é capturado por um `ErrorBoundary` ancestral (ou pelo Suspense em volta de `SuperAdminPage` em App.tsx) que descarta a árvore e remonta — caindo no `index` route (`Dashboard`) sem mudar a URL visualmente percebida pelo usuário, antes do `PageTransitionLoader` sumir.

## O que será feito

Mudanças escopadas APENAS à rota `/super_admin/usuarios`. Nenhum outro item de menu, helper de navegação, `App.tsx`, `SuperAdminPage`, `PageTransitionLoader` ou `useDynamicModulePermissions` será alterado.

### 1. Isolar a rota num ErrorBoundary visível

Em `src/routes/SuperAdminRoutes.tsx`, substituir:

```tsx
<Route path="usuarios" element={<UsersPage />} />
```

por:

```tsx
<Route
  path="usuarios"
  element={
    <ErrorBoundary>
      <UsersPage />
    </ErrorBoundary>
  }
/>
```

Usa o `src/components/ui/ErrorBoundary.tsx` que já existe e mostra a mensagem de erro + stack na tela (em vez de bubble + redirect silencioso).

### 2. Reforçar tratamento dentro de `UsersPage.tsx`

- Adicionar `console.error` detalhado quando `fetchUsers()` falhar (já existe `toast.error`, mas sem log estruturado).
- Adicionar estado `loadError: string | null`. Quando setado, renderizar um card vermelho com o erro e botão "Tentar novamente", **sem** redirecionar.
- Estado de loading explícito: skeleton/spinner enquanto `loading || loadingStats`.
- Estado vazio explícito quando `users.length === 0` após carregar: card "Nenhum usuário encontrado" com botão "Atualizar".
- Envolver chamadas a `useUserStats`/RPC com try/catch e logs prefixados `[UsersPage]` para diagnóstico no console.

### 3. Verificação pós-correção

- Recarregar `/super_admin`, clicar em "Usuários".
- Cenário A (RPC ok): URL muda para `/super_admin/usuarios`, lista renderiza, ou estado vazio aparece.
- Cenário B (RPC falha): URL muda para `/super_admin/usuarios`, mensagem de erro visível na tela + log no console com causa raiz — sem voltar ao Dashboard.

### Fora de escopo

- Não alterar `App.tsx`, `SuperAdminPage`, `usePageTransition`, `ModernAdminSidebar`, `useAdminBasePath`, `useDynamicModulePermissions`, nem outras rotas.
- Não mexer em RLS/RPC do Supabase nesta task (se o RPC estiver com permissão errada, o erro ficará visível e tratamos em task separada).
