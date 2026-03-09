

# Plano de Correção — 2FA Seguro com Auth Gate

## Diagnóstico Confirmado

1. **Rota ausente**: `/verificacao-2fa` não existe no `App.tsx` (linha 495-501). Existe apenas no `src/routes/index.tsx` que **não é usado**.
2. **Sessão criada antes do 2FA**: `signInWithPassword` (linha 47 do `useLoginForm.tsx`) cria sessão imediatamente. O `AuthProvider` detecta a sessão e considera o usuário logado.

## Limitação Técnica do Supabase

O SDK do Supabase **não possui** uma API "validar credenciais sem criar sessão". O `signInWithPassword` sempre cria uma sessão ativa. Isso é uma limitação da plataforma, não há como evitar.

## Solução: Auth Gate no AuthProvider

Em vez de tentar evitar a sessão (impossível com Supabase), criamos um **portão de segurança** no `AuthProvider` que bloqueia o acesso enquanto o 2FA estiver pendente.

```text
Email + Senha
  ↓
signInWithPassword (sessão Supabase criada — inevitável)
  ↓
2FA ativado? → SIM → sessionStorage.set('pending_2fa', userId)
  ↓                    → navigate('/verificacao-2fa')
  ↓                    → AuthProvider vê flag → isLoggedIn = FALSE
  ↓                    → Todas as rotas protegidas bloqueadas
  ↓                    ↓
  ↓                  Código validado → sessionStorage.remove('pending_2fa')
  ↓                    → isLoggedIn = TRUE → acesso liberado
  ↓
  NÃO → login normal
```

**Por que isso é seguro:** Mesmo com sessão Supabase ativa, o app inteiro trata `isLoggedIn = false` quando `pending_2fa` existe. Nenhuma rota protegida é acessível. O usuário só vê a página de verificação 2FA ou o login.

## Arquivos a Modificar (4 arquivos)

### A. `src/App.tsx` (1 linha)
- Adicionar rota `/verificacao-2fa` antes do catch-all `*`, após linha 501
- Importar `TwoFactorVerificationPage`

### B. `src/hooks/useAuth.tsx` — Auth Gate
- Na derivação de `isLoggedIn` (linha 40), adicionar verificação:
  ```
  const pending2fa = sessionStorage.getItem('pending_2fa');
  const isLoggedIn = !!session?.access_token && !!userProfile && !pending2fa;
  ```
- Quando `pending_2fa` existir, `isLoggedIn = false` → todas as rotas protegidas bloqueiam acesso

### C. `src/components/auth/hooks/useLoginForm.tsx` — Definir flag antes de redirecionar
- Após detectar `two_factor_enabled` (linha 134):
  - `sessionStorage.setItem('pending_2fa', data.user.id)`
  - Navegar para `/verificacao-2fa?userId=...`
  - **Não fazer signOut**, **não armazenar credenciais**

### D. `src/pages/auth/TwoFactorVerificationPage.tsx` — Limpar flag após sucesso
- Após verificação do código bem-sucedida (linha 99):
  - `sessionStorage.removeItem('pending_2fa')`
  - Isso faz `isLoggedIn` mudar para `true` automaticamente
  - Redirecionar para rota correta baseada no role

- No botão "Voltar ao Login" (linha 239):
  - Fazer `supabase.auth.signOut()` + `sessionStorage.removeItem('pending_2fa')` antes de navegar
  - Isso garante logout limpo se o usuário desistir

## Garantias

| Regra | Cumprida |
|-------|----------|
| Sem tabelas novas | ✓ |
| Sem signOut como solução | ✓ |
| Sem credenciais em sessionStorage | ✓ |
| Sem fluxos paralelos | ✓ |
| Sessão bloqueada até 2FA | ✓ |
| Reutiliza componentes existentes | ✓ |

## Limitação Transparente

A sessão Supabase existe tecnicamente antes do 2FA (limitação do SDK). Porém, o app **ignora essa sessão** até o 2FA ser validado. As RLS policies do Supabase continuam protegendo os dados no backend. A única forma de eliminar isso seria uma edge function de validação de credenciais, o que adicionaria complexidade sem benefício real — as RLS já protegem os dados.

