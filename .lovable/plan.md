

# Plano: Auditoria e Correção do Reset de Senha

## Diagnóstico (baseado nos logs do Supabase Auth e Edge Function)

Identifiquei **3 problemas distintos** que se combinam para quebrar o fluxo:

### Problema 1 — Hook timeout no cold start
O `unified-email-service` é o hook de `send_email` do Supabase Auth. O Auth tem timeout de **5 segundos**. Na primeira invocação (cold start), a função leva mais que isso e retorna 422 "Failed to reach hook within maximum time". O email de recovery **não é enviado**.

### Problema 2 — Sem debounce nos botões
O botão "Enviar Email de Reset" (DangerZone.tsx, PasswordResetForm.tsx, etc.) não tem cooldown. O usuário clica de novo rapidamente e o Supabase retorna **429 "For security purposes, you can only request this after 5 seconds"** — que é exatamente o erro da screenshot.

### Problema 3 — "One-time token not found"
Nos logs do Auth aparece este erro em `/verify`. Quando o email de recovery chega a ser enviado com sucesso e o usuário clica no link, se ele já usou ou expirou, a página `/reset-password` mostra "Link Expirado". Mas o ResetPassword.tsx **não escuta o evento `PASSWORD_RECOVERY`** do `onAuthStateChange` — ele só faz `getSession()` uma vez. Se a verificação do token cria a sessão após o check inicial, a sessão não é detectada.

---

## Correções

### C-01: Debounce + cooldown em TODOS os botões de reset (6 arquivos)

Adicionar um estado `cooldown` com timer de 60 segundos após cada envio bem-sucedido, e um handler de erro que extrai os segundos do 429:

| Arquivo | Localização |
|---------|-------------|
| `src/components/admin/users/console/DangerZone.tsx` | `handleResetPassword` |
| `src/components/auth/PasswordResetForm.tsx` | `handleResetPassword` |
| `src/hooks/useUserConsole.ts` | função de reset |
| `src/components/admin/users/ClientsSection.tsx` | `handleResetPassword` |
| `src/components/admin/users/UserDetailsDialogComplete.tsx` | inline handler |
| `src/components/admin/security/SecureAdminReset.tsx` | `handlePasswordReset` |

Padrão: após sucesso, desabilitar botão por 60s com countdown. Ao receber 429, extrair o tempo da mensagem e mostrar toast com "Aguarde X segundos".

### C-02: Corrigir ResetPassword.tsx para escutar PASSWORD_RECOVERY

O `useEffect` atual só faz `getSession()` uma vez. Precisa adicionar `onAuthStateChange` listener para o evento `PASSWORD_RECOVERY` — quando o Supabase processa o token do link, ele emite esse evento e cria a sessão. Sem esse listener, a página pode mostrar "Link Expirado" mesmo quando o link é válido.

```text
Fluxo correto:
1. User clica no link → redireciona para /reset-password#access_token=...
2. Supabase detecta o hash e processa → emite PASSWORD_RECOVERY
3. onAuthStateChange captura → seta hasValidSession = true
4. Formulário aparece
```

### C-03: Tratamento robusto de erro 429 com extração de tempo

Em todos os handlers, ao receber erro com mensagem contendo "after X seconds", extrair o número e mostrar toast informativo: "Aguarde mais X segundos antes de tentar novamente".

---

## Arquivos alterados (8 total)

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `src/components/admin/users/console/DangerZone.tsx` | Cooldown + 429 handling |
| 2 | `src/components/auth/PasswordResetForm.tsx` | Cooldown + 429 handling |
| 3 | `src/hooks/useUserConsole.ts` | Cooldown + 429 handling |
| 4 | `src/components/admin/users/ClientsSection.tsx` | Cooldown + 429 handling |
| 5 | `src/components/admin/users/UserDetailsDialogComplete.tsx` | Cooldown + 429 handling |
| 6 | `src/components/admin/security/SecureAdminReset.tsx` | Cooldown + 429 handling |
| 7 | `src/pages/ResetPassword.tsx` | onAuthStateChange listener para PASSWORD_RECOVERY |
| 8 | `src/pages/ProfileSettings.tsx` | Cooldown + 429 handling |

Nenhuma lógica de negócio alterada. Nenhuma migration necessária.

