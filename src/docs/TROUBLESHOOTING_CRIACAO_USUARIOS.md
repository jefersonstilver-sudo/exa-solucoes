# 🔧 Troubleshooting - Criação de Usuários

## Sistema de Criação de Contas Administrativas

### ✅ Como Funciona

1. **Botão "Criar Nova Conta"** → Abre dialog com formulário
2. **Formulário valida dados** → Nome, sobrenome, email, CPF (opcional), role
3. **Chama Edge Function** → `create-admin-account`
4. **Edge Function cria usuário** → No auth e na tabela users
5. **Retorna credenciais** → Copiadas automaticamente para clipboard
6. **Envia email** → Com credenciais de acesso

### 🔑 Credenciais Padrão

```
Senha padrão: exa2025
```

**⚠️ IMPORTANTE**: Esta senha é definida na Edge Function e não pode ser alterada no frontend.

---

## 🐛 Problemas Comuns

### 1. "Erro ao criar usuário"

**Sintomas:**
- Toast de erro genérico
- Nenhum log detalhado
- Usuário não aparece na lista

**Causas Possíveis:**

#### A) Edge Function não implantada
```bash
# Verificar se está implantada
# No console do Supabase: Edge Functions > create-admin-account > Deploy History
```

**Solução:**
```bash
# Re-implantar a função
supabase functions deploy create-admin-account
```

#### B) Permissões RLS incorretas
**Verificar:**
- Tabela `users` deve ter política para admins criarem registros
- Política `users_can_insert_own` não se aplica aqui (é via service role)

**Solução:**
```sql
-- Verificar políticas na tabela users
SELECT * FROM pg_policies WHERE tablename = 'users';
```

#### C) Email já existe
**Verificar:**
```sql
SELECT email, role FROM users WHERE email = 'email@exemplo.com';
```

**Solução:**
- Se usuário existe mas não deveria: deletar do auth e da tabela users
- Se usuário deve existir: usar outro email

---

### 2. "Usuário criado mas não aparece na lista"

**Sintomas:**
- Toast de sucesso
- Mas usuário não aparece em `/super_admin/usuarios`

**Causas:**

#### A) Cache desatualizado
**Solução:**
```typescript
// No código já tem handleRefresh que:
1. Recarrega lista de users
2. Recarrega estatísticas
```

**Como testar:**
- Clicar no botão de refresh (🔄) no topo
- Ou recarregar a página (F5)

#### B) Filtro ativo
**Verificar:**
- Campo de busca tem algum texto?
- Filtros de role ativos?

#### C) RLS bloqueando leitura
**Verificar:**
```sql
-- Sua role atual
SELECT current_user, session_user;

-- Ver se consegue ler users
SELECT count(*) FROM users;
```

---

### 3. "Senha não funciona"

**Sintomas:**
- Usuário criado com sucesso
- Mas não consegue fazer login com `exa2025`

**Causas:**

#### A) Senha não foi definida corretamente
**Verificar Edge Function:**
```typescript
// Em userCreation.ts, linha 23
const defaultPassword = 'exa2025';
```

**Testar:**
```bash
# Tentar login com as credenciais
curl -X POST https://SUPABASE_URL/auth/v1/token \
  -H "apikey: SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"email@exemplo.com","password":"exa2025"}'
```

#### B) Confirmação de email pendente
**Verificar:**
```sql
SELECT email, email_confirmed_at 
FROM auth.users 
WHERE email = 'email@exemplo.com';
```

**Solução:**
```typescript
// Na Edge Function, linha 38
email_confirm: true  // Deve estar assim
```

---

### 4. "CPF não está sendo salvo"

**Sintomas:**
- Formulário aceita CPF
- Mas não aparece no banco

**Verificar:**

#### A) Edge Function recebe CPF?
**Console logs:**
```
📦 [CREATE-ADMIN] Dados recebidos: { email, adminType, nome, cpf: '***' }
```

#### B) Inserção na tabela users
**Console logs:**
```
💾 [CREATE-ADMIN] Inserindo dados: { id, email, role, nome, cpf: '***' }
```

#### C) Banco de dados
```sql
SELECT nome, cpf, tipo_documento 
FROM users 
WHERE email = 'email@exemplo.com';
```

---

### 5. "Role errado no banco"

**Sintomas:**
- Criou como "Administrador Financeiro"
- Mas aparece como "Administrador Geral"

**Causas:**

#### A) Mapeamento de roles incorreto
**Verificar CreateUserDialog.tsx:**
```typescript
role: z.enum(['admin', 'admin_marketing', 'admin_financeiro', 'super_admin'])
```

**Verificar validation.ts:**
```typescript
const validRoles = ['admin', 'admin_marketing', 'admin_financeiro', 'super_admin'];
```

#### B) Bug no banco
**Corrigir manualmente:**
```sql
UPDATE users 
SET role = 'admin_financeiro'
WHERE email = 'financeiro@examidia.com.br';
```

---

## 🔍 Debug Checklist

Ao investigar problemas de criação de usuários:

- [ ] Verificar logs do console (F12)
- [ ] Verificar Network tab (requisição para Edge Function)
- [ ] Verificar Edge Function logs no Supabase Dashboard
- [ ] Verificar tabela `users` no banco
- [ ] Verificar tabela `auth.users` no banco
- [ ] Testar login com as credenciais
- [ ] Verificar se email de boas-vindas foi enviado

---

## 📊 Logs Importantes

### Console do Browser
```javascript
📤 Enviando requisição para criar usuário: { email, adminType, nome }
📥 Resposta da Edge Function: { functionData, functionError }
✅ Conta criada com sucesso
📋 Credenciais copiadas para área de transferência
```

### Edge Function Logs
```
🚀 [CREATE-ADMIN] Edge function iniciada
📦 [CREATE-ADMIN] Dados recebidos
🔍 [CREATE-ADMIN] Verificando usuário existente
🔄 [CREATE-ADMIN] Tentativa 1/3 de criação
✅ [CREATE-ADMIN] Usuário criado com sucesso
💾 [CREATE-ADMIN] Inserindo na tabela users
📧 [CREATE-ADMIN] Enviando email de boas-vindas
🎉 [CREATE-ADMIN] Conta criada com sucesso!
```

---

## 🚨 Problemas Críticos de Segurança

### ⚠️ Roles na Tabela `users`

**PROBLEMA IDENTIFICADO:**
```
Atualmente as roles estão sendo armazenadas diretamente na tabela 'users'.
Isso pode permitir ataques de escalação de privilégios!
```

**Solução Recomendada:**
Usar tabela `user_roles` separada (que já existe no banco):

```sql
-- Estrutura da tabela user_roles
CREATE TABLE user_roles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  role app_role NOT NULL,
  granted_at timestamp,
  granted_by uuid
);
```

**⚠️ TODO:** Migrar sistema para usar `user_roles` em vez da coluna `role` na tabela `users`.

---

## 📞 Suporte

Se o problema persistir:

1. **Coletar informações:**
   - Logs do console (F12 > Console)
   - Network requests (F12 > Network > create-admin-account)
   - Edge Function logs (Supabase Dashboard)

2. **Verificar RLS:**
   ```sql
   -- Ver políticas ativas
   SELECT * FROM pg_policies WHERE tablename IN ('users', 'user_roles');
   ```

3. **Testar manualmente:**
   ```bash
   # Chamar Edge Function diretamente
   curl -X POST https://SEU_PROJETO.supabase.co/functions/v1/create-admin-account \
     -H "Authorization: Bearer SEU_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"teste@exemplo.com","adminType":"admin","nome":"Teste Admin"}'
   ```
