# Guia de Deleção Permanente de Contas

## 🎯 Funcionalidade

Sistema completo para deletar contas de usuários **PERMANENTEMENTE**, permitindo recriação imediata com o mesmo email.

---

## 🔐 Permissões

**EXCLUSIVO para Super Administradores**
- Apenas usuários com `role: 'super_admin'`
- Validado no frontend e backend

---

## ⚙️ Como Funciona

### **Fluxo Completo**

1. **Super Admin acessa detalhes do usuário**
   - Via `UsersPage` → `IndexaTeamSection` → `UserDetailsDialog`
   - Ou via Mobile: `EnhancedUserMobileCard` → `UserDetailsCard`

2. **Clica em "Deletar Conta Permanentemente"**
   - Botão vermelho nas "Ações de Super Admin"

3. **Confirmação rigorosa**
   - Dialog de confirmação com avisos de segurança
   - Mostra todos os dados que serão deletados
   - Botão "SIM, DELETAR PERMANENTEMENTE"

4. **Deleção em 3 etapas** (Edge Function `delete-user-account`):
   ```
   a) Busca informações do usuário (para logs)
   b) Deleta da tabela `users` (banco de dados)
   c) Deleta do `auth.users` (autenticação Supabase)
   d) Registra ação nos logs de auditoria
   ```

5. **Resultado**
   - ✅ Conta completamente removida
   - ✅ Email liberado para recriação imediata
   - ✅ Ação registrada em auditoria

---

## 📁 Arquivos Modificados/Criados

### **Edge Function (Backend)**
- `supabase/functions/delete-user-account/index.ts`
  - Deleta do banco (`users` table)
  - Deleta do auth (`auth.users`)
  - Registra em auditoria

### **Frontend**
- `src/components/admin/users/UserDetailsDialog.tsx`
  - Botão "Deletar Conta Permanentemente"
  - Dialog de confirmação com avisos
  - Integração com edge function

---

## 🔍 O Que É Deletado

### ✅ **Removido Completamente**
- Registro na tabela `users`
- Conta no `auth.users` (Supabase Auth)
- Todos os relacionamentos diretos (se houver ON DELETE CASCADE)

### ❌ **NÃO Deletado (Mantido para Histórico)**
- Logs de auditoria (`user_activity_logs`)
  - Mantém registro da criação e deleção
  - Informações do usuário deletado
  - Quem realizou a deleção

---

## 🚀 Como Usar

### **Passo 1: Acessar Usuários**
```
Super Admin → /super_admin/usuarios
```

### **Passo 2: Abrir Detalhes**
```
Clique em "Ver Detalhes" no usuário desejado
```

### **Passo 3: Deletar**
```
1. Role até "Ações de Super Admin"
2. Clique em "Deletar Conta Permanentemente"
3. Leia os avisos com atenção
4. Confirme clicando em "SIM, DELETAR PERMANENTEMENTE"
```

### **Passo 4: Recriação (Se Necessário)**
```
Após deleção, você pode criar nova conta com o mesmo email imediatamente:
1. Clique em "Criar Nova Conta"
2. Use o mesmo email que foi deletado
3. Sistema criará nova conta sem erros de duplicidade
```

---

## ⚠️ Avisos de Segurança

### **ATENÇÃO: Ação Irreversível**
- ❌ Não é possível desfazer a deleção
- ❌ Todos os dados do usuário serão perdidos
- ❌ Relacionamentos serão afetados (se ON DELETE CASCADE)

### **Quando Usar**
✅ Conta de teste que precisa ser recriada  
✅ Usuário criado com email errado  
✅ Conta duplicada acidentalmente  
✅ Limpeza de contas antigas  

### **Quando NÃO Usar**
❌ Para desativar temporariamente um usuário  
❌ Para revogar permissões (use alteração de role)  
❌ Para "resetar" dados (use outras ferramentas)  

---

## 📊 Logs de Auditoria

Toda deleção é registrada em `user_activity_logs`:

```json
{
  "action_type": "ADMIN_ACCOUNT_DELETED",
  "entity_type": "user",
  "entity_id": "uuid-do-usuario-deletado",
  "action_description": "Conta admin deletada: email@exemplo.com",
  "metadata": {
    "deleted_account": {
      "email": "email@exemplo.com",
      "nome": "Nome do Usuário",
      "role": "admin",
      "user_id": "uuid-do-usuario"
    },
    "performed_by": "Nome do Super Admin",
    "performed_by_id": "uuid-do-super-admin",
    "ip_address": "IP de origem",
    "user_agent": "Navegador usado",
    "timestamp": "2025-11-08T12:00:00.000Z"
  }
}
```

---

## 🧪 Teste de Funcionamento

### **Cenário 1: Deleção Normal**
```
1. Criar usuário teste: teste@exemplo.com
2. Verificar que existe na lista
3. Deletar via UserDetailsDialog
4. Confirmar que sumiu da lista
5. Tentar criar novamente com mesmo email
6. ✅ Deve criar sem erros
```

### **Cenário 2: Validação de Permissão**
```
1. Logar como admin normal (não super_admin)
2. Acessar /super_admin/usuarios
3. Abrir detalhes de usuário
4. ❌ Botão de deleção não deve aparecer
```

### **Cenário 3: Verificação de Auditoria**
```
1. Deletar usuário
2. Acessar /super_admin/auditoria
3. Buscar por "ADMIN_ACCOUNT_DELETED"
4. ✅ Deve aparecer registro com detalhes
```

---

## 🔧 Troubleshooting

### **Erro: "Erro ao deletar usuário do banco de dados"**
**Causa**: Foreign keys impedindo deleção  
**Solução**: 
1. Verificar relacionamentos na tabela `users`
2. Adicionar `ON DELETE CASCADE` ou `ON DELETE SET NULL`
3. Ou deletar manualmente registros relacionados primeiro

### **Erro: "Falha ao deletar do auth"**
**Causa**: Problemas com Supabase Auth  
**Solução**: 
1. Verificar se Service Role Key está configurada
2. Usuário pode já estar deletado do auth
3. Verificar logs da edge function

### **Email ainda "existe" ao recriar**
**Causa**: Cache ou deleção incompleta  
**Solução**:
1. Aguardar alguns segundos
2. Verificar se realmente foi deletado: 
   ```sql
   SELECT * FROM auth.users WHERE email = 'email@exemplo.com';
   SELECT * FROM users WHERE email = 'email@exemplo.com';
   ```
3. Se persistir, deletar manualmente via SQL

---

## 📈 Estatísticas de Uso

Para monitorar uso da funcionalidade:

```sql
-- Quantas deleções foram feitas
SELECT COUNT(*) 
FROM user_activity_logs 
WHERE action_type = 'ADMIN_ACCOUNT_DELETED';

-- Últimas deleções
SELECT 
  action_description,
  metadata->>'performed_by' as deletado_por,
  created_at
FROM user_activity_logs 
WHERE action_type = 'ADMIN_ACCOUNT_DELETED'
ORDER BY created_at DESC
LIMIT 10;

-- Deleções por super admin
SELECT 
  metadata->>'performed_by' as super_admin,
  COUNT(*) as total_deletions
FROM user_activity_logs 
WHERE action_type = 'ADMIN_ACCOUNT_DELETED'
GROUP BY metadata->>'performed_by'
ORDER BY total_deletions DESC;
```

---

## 🎓 Boas Práticas

1. **Sempre verificar antes de deletar**
   - Confirmar email e role
   - Verificar se há pedidos/dados importantes

2. **Comunicar antes de deletar**
   - Avisar o usuário se possível
   - Documentar motivo da deleção

3. **Backup de dados críticos**
   - Exportar dados importantes antes
   - Salvar em logs de auditoria

4. **Monitorar logs**
   - Revisar deleções periodicamente
   - Identificar padrões suspeitos

5. **Limitar acesso**
   - Manter apenas super_admins confiáveis
   - Auditar quem tem essa permissão

---

## 📞 Suporte

Para problemas com deleção de contas:
1. Verificar logs da edge function `delete-user-account`
2. Checar logs de auditoria no banco
3. Consultar este guia
4. Contatar desenvolvedor se persistir

---

**Última atualização**: 2025-11-08  
**Versão**: 1.0  
**Autor**: Sistema EXA Mídia
