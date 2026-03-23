

# Plano: Menu dinâmico baseado em permissões + redirect inteligente

## Problema
O `UserMenu.tsx` (dropdown do avatar na homepage) mostra itens hardcoded por role. A Jeniffer (Comercial, role `admin`) vê "Dashboard Administrativo", "Prédios", "Painéis", "Aprovações" — mas quando clica, recebe "Acesso Restrito" porque ela não tem esses módulos liberados na `role_permissions`.

Além disso, o badge mostra "ADMIN" genérico em vez do departamento.

## Correções

### 1. UserMenu dinâmico com permissões reais
**Arquivo**: `src/components/user/UserMenu.tsx`

- Importar `useDynamicModulePermissions` 
- Para o bloco `isAdmin && !isSuperAdmin` (e `isAdminFinanceiro`, `isAdminMarketing`): substituir a lista hardcoded por uma lista filtrada que só mostra itens com `hasModuleAccess(moduleKey)` === true
- O link principal "Dashboard" vai para o primeiro módulo habilitado em vez de `/admin` fixo
- Badge: usar departamento do `userProfile` quando disponível (ex: "COMERCIAL" em vez de "ADMIN")

### 2. Redirect inteligente na rota index do admin
**Arquivo**: `src/routes/AdminRoutes.tsx`

- Criar componente `AdminIndexRedirect` que verifica qual é o primeiro módulo liberado e redireciona para ele
- Se `dashboard` está liberado → `/admin` (Dashboard)
- Se não, encontra o primeiro módulo habilitado e redireciona (ex: `/admin/pedidos`, `/admin/propostas`)
- Se nenhum módulo liberado → `/admin/meu-perfil`

### 3. Mapeamento módulo → rota
Definir um mapa simples `MODULE_ROUTES` conectando cada `MODULE_KEY` à sua rota e label/ícone para uso tanto no UserMenu quanto no redirect:

```text
dashboard → /admin (Dashboard)
pedidos → /admin/pedidos (Pedidos)  
predios → /admin/predios (Prédios)
paineis → /admin/paineis (Painéis)
aprovacoes → /admin/aprovacoes (Aprovações)
propostas → /admin/propostas (Propostas)
...etc
```

## Arquivos alterados

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `src/components/user/UserMenu.tsx` | Menu dinâmico baseado em `hasModuleAccess`; badge com departamento |
| 2 | `src/routes/AdminRoutes.tsx` | Componente `AdminIndexRedirect` para redirecionar ao primeiro módulo permitido |
| 3 | `src/hooks/useDynamicModulePermissions.ts` | Adicionar mapa `MODULE_ROUTES` com rota + label + ícone de cada módulo |

