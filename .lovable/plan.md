# Remover página `/sistema/login` (ERP) e consolidar no login padrão

## Causa raiz do problema

A página `/sistema/login` (LoginERP) está causando o logout quando você tenta acessar `/admin/pedidos`:

1. `useSuperAdminProtection` redireciona para `/sistema/login` quando detecta perda momentânea de sessão / role.
2. `SuperAdminPage` também força `/sistema/login` em vários pontos.
3. Há um **redirecionamento de subdomínio** em `src/App.tsx` (linhas 113-127) que joga qualquer acesso via `sistema.examidia.com.br` direto pra `/sistema/login`, criando loops.
4. O `LoginERP` faz `supabase.auth.signOut()` se a role não estiver imediatamente disponível (linha 98 do `ERPLoginForm`), o que explica o "ele desloga" durante a navegação.

A página `/login` (`src/pages/Login.tsx`) já trata super_admin / admin / admin_marketing / admin_financeiro corretamente (linhas 38-43), então o ERP é redundante.

## Mudanças

### 1. `src/App.tsx`
- Remover `const LoginERP = lazy(...)` (linha 53).
- Remover o bloco IIFE de redirecionamento de subdomínio (linhas 111-127) **ou** trocar o destino de `/sistema/login` por `/login`. Recomendado: **remover totalmente**, já que `sistema.examidia.com.br` pode usar `/login` igual ao domínio principal.
- Remover a rota `<Route path="/sistema/login" ... />` (linha 562).

### 2. `src/hooks/useSuperAdminProtection.tsx`
- Linha 37: trocar `navigate('/sistema/login', ...)` por `navigate('/login', ...)`.

### 3. `src/pages/SuperAdminPage.tsx`
- Linhas 44, 74, 77, 146: trocar todas as ocorrências de `/sistema/login` por `/login`.

### 4. `supabase/functions/resend-welcome-email/index.ts`
- Linha 142: atualizar o link do email de `${siteUrl}/sistema/login` para `${siteUrl}/login`.

### 5. Arquivos a deletar (sem uso após as mudanças)
- `src/pages/sistema/LoginERP.tsx`
- `src/components/sistema/ERPLoginForm.tsx`
- `src/components/sistema/ERPCircuitBackground.tsx`
- Diretório `src/pages/sistema/` se ficar vazio.

## Verificações pós-mudança
- `rg "sistema/login|LoginERP|ERPLoginForm|ERPCircuitBackground"` deve retornar zero ocorrências.
- Acessar `/admin/pedidos` logado como admin — não deve mais redirecionar/deslogar.
- Acessar `/super_admin` deslogado — deve cair em `/login` (e não em `/sistema/login`).

## Fora do escopo
- Nenhuma mudança no fluxo de autenticação do `/login` padrão, no 2FA ou nas roles. Apenas remoção do ERP duplicado.
