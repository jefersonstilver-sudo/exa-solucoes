

# Plano: Ativar Conta + Adicionar Logo no Console Admin

## Análise da Arquitetura Atual

| Item | Resultado |
|------|-----------|
| Status do email | `email_confirmed_at` em `auth.users`, exposto via `ConsoleUser.email_confirmed_at` |
| Confirmação de email | Edge function `admin-update-user` já suporta `confirm_email: true` → chama `auth.admin.updateUserById({ email_confirm: true })` |
| Logo da empresa | Armazenada em `users.avatar_url` (coluna existente) |
| Storage de logos | Bucket `arquivos`, pasta `PAGINA PRINCIPAL LOGOS/` (mesmo bucket já usado) |
| Componente alvo | `src/components/admin/users/console/IdentityTab.tsx` |
| Hook do console | `src/hooks/useUserConsole.ts` |

## Funcionalidade 1 — Botão "Ativar Conta"

**Onde:** `IdentityTab.tsx`, dentro do card de alerta de email não confirmado (linhas 98-128), ao lado do botão "Reenviar Email de Confirmação".

**Lógica:** Adicionar botão "Ativar Conta" que chama a edge function `admin-update-user` com `{ email: user.email, confirm_email: true }`. Essa edge function já existe e já faz exatamente isso (linha 46-47 do `admin-update-user/index.ts`).

**Hook:** Adicionar função `confirmEmailManually` no `useUserConsole.ts` que invoca a edge function e atualiza o estado local.

**Resultado:** Badge muda de "✗ Pendente" para "✓ Confirmado", alerta de email desaparece.

## Funcionalidade 2 — Botão "Adicionar Logo da Empresa"

**Onde:** `IdentityTab.tsx`, nova seção após "Status da Conta" (após linha 200).

**Lógica:**
1. Botão "Adicionar Logo da Empresa" abre input de file upload
2. Upload do arquivo PNG para bucket `arquivos` em `PAGINA PRINCIPAL LOGOS/`
3. Atualiza `users.avatar_url` do usuário alvo com o storage key
4. Exibe preview da logo após upload

**Reutiliza:** Mesmo bucket e mesma pasta que o `useLogoFileReplace` já usa. Mesma coluna `avatar_url` da tabela `users` (conforme memória do sistema).

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/users/console/IdentityTab.tsx` | Adicionar botão "Ativar Conta" no alerta + seção de upload de logo |
| `src/types/userConsoleTypes.ts` | Adicionar `onConfirmEmail` e `onUploadLogo` nas props de `IdentityTabProps` |
| `src/hooks/useUserConsole.ts` | Adicionar funções `confirmEmailManually` e `uploadClientLogo` |
| `src/components/admin/users/console/UserConsoleDialog.tsx` | Passar novas props para `IdentityTab` |

## Garantias

- Zero tabelas novas
- Zero colunas novas
- Reutiliza edge function `admin-update-user` existente
- Reutiliza bucket `arquivos` existente
- Reutiliza coluna `avatar_url` existente
- Logo aparece automaticamente no dashboard do anunciante (já lê de `avatar_url`)

