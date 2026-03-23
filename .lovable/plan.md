

# Plano: Corrigir nomenclatura, filtro de permissões e visibilidade do Meu Perfil

## Diagnóstico

### Por que o filtro não funciona
O `useDynamicModulePermissions` busca permissões na tabela `role_permissions` filtrando por `role_key`. Jeniffer tem role `admin` (igual a Coordenação), então recebe **todas** as permissões do role `admin` — incluindo Dashboard, Prédios, Painéis, Aprovações. O sistema não diferencia por departamento.

### Por que o badge mostra "ADMIN"
O `UserMenu.tsx` tenta ler `(user as any)?.departamento`, mas o `useUserSession` retorna `userProfile` como `user`. O `departamento` vem como um objeto `{id, name, color, icon, display_order}` do `useAuth`. O código já tenta extrair `dept?.name`, mas na prática o campo pode não estar chegando ou o fallback para "ADMIN" está sendo atingido.

### Por que "Meu Perfil" não aparece na sidebar
Já está no footer (linhas 598-621 do sidebar), mas não como item de menu no corpo da sidebar.

---

## Correções

### C-01: Permissões por departamento (não só por role)

A tabela `role_permissions` precisa suportar filtro por `departamento_id` além de `role_key`. Sem isso, é impossível dar permissões diferentes para dois usuários com o mesmo role `admin` mas departamentos diferentes.

**Migration**: Adicionar coluna opcional `departamento_id` na tabela `role_permissions`. A query passa a filtrar por `role_key` + `departamento_id` quando o usuário tem departamento.

```text
Lógica:
1. Se o usuário tem departamento_id → buscar role_permissions WHERE role_key = X AND departamento_id = Y
2. Se não encontrar resultados → fallback para WHERE role_key = X AND departamento_id IS NULL
3. CEO → acesso total (sem consulta)
```

**Arquivo**: `src/hooks/useDynamicModulePermissions.ts`
- Alterar a query para incluir `departamento_id` do `userProfile`
- Implementar fallback para permissões genéricas do role

### C-02: Inserir permissões por departamento

**Migration SQL**: Inserir registros na `role_permissions` para cada departamento. Ex: para o departamento Comercial com role `admin`, habilitar apenas os módulos que a equipe comercial precisa (propostas, pedidos, contatos, CRM, etc.) e desabilitar os que não precisa (dashboard administrativo completo, prédios, painéis, aprovações de vídeo).

### C-03: Corrigir badge no UserMenu

**Arquivo**: `src/components/user/UserMenu.tsx`
- O `user` do `useUserSession` é na verdade `userProfile` do `useAuth`, que tem `departamento` como `UserDepartment | undefined`
- Trocar `(user as any)?.departamento` por acesso tipado correto
- Garantir que o nome do departamento é extraído corretamente

### C-04: Corrigir nomenclatura na sidebar

**Arquivo**: `src/components/admin/layout/ModernAdminSidebar.tsx`
- `getAdminTitle()` já tenta usar departamento, mas o fallback para role `admin` retorna "Coordenação"
- Jeniffer tem role `admin` e departamento "Comercial" — o `dept` deveria ser encontrado
- Investigar se `userProfile.departamento` está populado corretamente (pode ser que a join não retorne dados)
- Mudar o título "Painel Administrativo" para "Painel {Departamento}" quando o departamento existe

### C-05: Adicionar "Meu Perfil" como item na sidebar

**Arquivo**: `src/components/admin/layout/ModernAdminSidebar.tsx`
- Adicionar item "Meu Perfil" em um grupo existente (ex: no final da lista, ou em um grupo "Conta")
- Rota: `buildPath('meu-perfil')`
- Este item não precisa de permissão — sempre visível para qualquer admin/funcionário

---

## Arquivos alterados

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | Migration SQL | Adicionar `departamento_id` à `role_permissions` + inserir permissões por departamento |
| 2 | `src/hooks/useDynamicModulePermissions.ts` | Query com filtro por `departamento_id` + fallback |
| 3 | `src/components/user/UserMenu.tsx` | Corrigir extração do departamento + badge |
| 4 | `src/components/admin/layout/ModernAdminSidebar.tsx` | Título dinâmico + item "Meu Perfil" no menu |

