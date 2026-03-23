

# Plano: Correção completa de labels, filtros e redirect departamental

## Diagnóstico confirmado

### Por que a sidebar ainda mostra itens não liberados
O banco de dados ESTÁ correto — existem 11 permissões departamentais para Comercial (propostas, pedidos, contatos, crm_hub, etc.) e módulos como `dashboard`, `predios`, `paineis`, `aprovacoes` NÃO estão na lista. O hook `useDynamicModulePermissions` prioriza dept-specific quando existem registros. Porém há **2 bugs de mapeamento**:
- `CRM Hub` no sidebar usa `MODULE_KEYS.crm_site`, mas no banco a permissão é `crm_hub` → CRM Hub fica invisível para Comercial
- `Central de Tarefas` usa `MODULE_KEYS.dashboard`, mas deveria usar `minha_manha` (que está habilitado para Comercial)

### Por que aparece "Admin Geral" e "Painel Administrativo"
A label "Admin Geral" existe em **4 arquivos** diferentes, incluindo a sidebar legada (`AdminSidebar.tsx`), o header legado (`AdminHeader.tsx`), o `ModernAdminHeader.tsx`, o `userRoleService.ts` e o `UserManagementPanel.tsx`. A sidebar moderna já tem lógica correta para usar departamento, mas os outros componentes NÃO foram atualizados.

### Onde "Meu Perfil" está faltando
Já está no sidebar (grupo "Conta") e nas rotas. Verificar se está renderizando — pode estar sendo filtrado por algum bug.

---

## Correções

### C-01: Corrigir mapeamento de module keys no sidebar
**Arquivo**: `src/components/admin/layout/ModernAdminSidebar.tsx`
- `CRM Hub`: trocar moduleKey de `MODULE_KEYS.crm_site` para `MODULE_KEYS.crm_hub`
- `Central de Tarefas`: trocar moduleKey de `MODULE_KEYS.dashboard` para `MODULE_KEYS.minha_manha` (ou criar novo key)
- Garantir que `crm_hub` exista em `MODULE_KEYS`

### C-02: Atualizar labels em TODOS os componentes
Substituir "Admin Geral", "Administrador Geral", "Admin" por lógica baseada em departamento em:

| Arquivo | Label atual | Correção |
|---------|------------|---------|
| `AdminSidebar.tsx` line 272 | `'Admin Geral'` | Usar departamento ou "Coordenação" |
| `ModernAdminHeader.tsx` line 51 | `'Admin'` | Usar departamento ou "Coordenação" |
| `AdminHeader.tsx` line 96 | `'Admin'` | Usar departamento ou "Coordenação" |
| `userRoleService.ts` line 98 | `'Administrador Geral'` | `'Coordenação'` (label genérico, dept aparece nos componentes) |
| `UserManagementPanel.tsx` (5 ocorrências) | `'Administrador Geral'` / `'Admin Geral'` | `'Coordenação'` |

Padrão: se o usuário tem `departamento.name`, mostrar esse nome. Senão, usar "Coordenação" para role `admin`.

### C-03: Redirect departamental inteligente
**Arquivo**: `src/routes/AdminRoutes.tsx` — `AdminIndexRedirect`

Atualizar a lista de prioridade para considerar o setor. Para Comercial, a prioridade natural já é: `pedidos, propostas, contatos` — que são os primeiros na lista e estão habilitados. Confirmar que o redirect funciona corretamente com as permissões dept-specific.

Adicionar mapa de prioridade por departamento:
- Comercial → propostas, pedidos, contatos, crm_hub
- Marketing → leads, emails, videos_site
- Financeiro → financeiro, relatorios, pedidos
- Administrativo → dashboard, predios, paineis
- Tecnologia → processos, configuracoes

### C-04: Adicionar `crm_hub` ao MODULE_KEYS e MODULE_ROUTES
**Arquivo**: `src/hooks/useDynamicModulePermissions.ts`
- Verificar se `crm_hub` já existe em MODULE_KEYS (sim, existe como valor `'crm_hub'`)
- Mas o CRM Hub na sidebar usa `MODULE_KEYS.crm_site` — essa é a inconsistência
- Corrigir a referência no sidebar

### C-05: Verificar "Meu Perfil" renderiza corretamente
Confirmar que o grupo "Conta" com `__always_visible__` não está sendo removido por algum filtro. Adicionar console.log temporário se necessário.

---

## Arquivos alterados

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `src/components/admin/layout/ModernAdminSidebar.tsx` | Fix moduleKeys (crm_site→crm_hub, dashboard→minha_manha) |
| 2 | `src/components/admin/layout/AdminSidebar.tsx` | "Admin Geral" → departamento/Coordenação |
| 3 | `src/components/admin/layout/ModernAdminHeader.tsx` | "Admin" → departamento/Coordenação |
| 4 | `src/components/admin/layout/AdminHeader.tsx` | "Admin" → departamento/Coordenação |
| 5 | `src/services/userRoleService.ts` | "Administrador Geral" → "Coordenação" |
| 6 | `src/components/admin/users/UserManagementPanel.tsx` | 5 ocorrências "Admin Geral"/"Administrador Geral" → "Coordenação" |
| 7 | `src/routes/AdminRoutes.tsx` | Prioridade de redirect por departamento |

Nenhuma migration necessária — o banco já está correto.

