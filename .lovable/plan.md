

# Correções: Detecção de Conta Ativa + Lógica de Ativação

## Problema atual

1. A edge function `admin-update-user` **não suporta `check_only`** nem busca por `user_id` — só por email. O `checkAccountStatus` nunca funciona corretamente.
2. Ao selecionar proposta, não verifica se o cliente já tem conta no sistema.
3. O botão "Ativar Conta" pode aparecer mesmo quando o usuário já está ativo.

## Solução

### 1. `supabase/functions/admin-update-user/index.ts`
Adicionar suporte a:
- `user_id` como parâmetro alternativo ao `email` para buscar o usuário
- `check_only: true` — retorna `{ email_confirmed, user_exists }` sem modificar nada

### 2. `src/hooks/useAdminCreateOrder.ts` — `checkAccountStatus`
Ajustar para passar `email` (que a edge function já suporta) em vez de `user_id`, já que o fallback atual não funciona.

### 3. `src/components/admin/orders/create/ClientSearchSection.tsx` — `selectProposal`
Ao selecionar proposta, buscar na tabela `users` por `client_email` da proposta para:
- Se encontrar → setar `clientId`, verificar status da conta
- Se não encontrar → `clientId = null`, mostrar "Criar Conta"

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/admin-update-user/index.ts` | Adicionar `check_only` e busca por `user_id` |
| `src/hooks/useAdminCreateOrder.ts` | Corrigir `checkAccountStatus` para usar email |
| `src/components/admin/orders/create/ClientSearchSection.tsx` | Verificar conta ao selecionar proposta |

