

# Plano: Corrigir label do sidebar + Página "Meu Perfil" para admins/funcionários

## Problema 1 — Label incorreta na sidebar

A sidebar (`ModernAdminSidebar.tsx`) mostra labels estáticas como "Admin Geral" baseadas apenas no `role`. A Jeniffer é do departamento **Comercial** mas aparece como "Admin Geral" porque o `getAdminTitle()` não considera o departamento. O profile já carrega `departamento` do banco (via `useAuth`).

**Correção**: Alterar `getAdminTitle()` para usar o nome do departamento quando disponível:
- `super_admin` → "CEO / Diretoria"
- `admin` → "Coordenação"
- `admin_departamental` / roles legados → nome do departamento (ex: "Comercial")
- Fallback: label atual

Também atualizar `getRoleDisplayInfo` em `userRoleService.ts` e os mapas de labels em `UserDetailsDialog.tsx`, `UserDetailsDialogComplete.tsx`, `IndexaTeamSection.tsx`, `UserManagementPanel.tsx` para usar a mesma lógica com departamento.

## Problema 2 — Não existe página "Meu Perfil" para admins

A `ProfileSettings.tsx` existe mas **não tem rota** (foi removida em favor de `AdvertiserSettings`). Admins e funcionários não têm acesso a:
- Verificação de WhatsApp (para EXA Alerts)
- Ativação de 2FA
- Configurações pessoais dentro do painel admin

**Solução**: Criar uma página completa `AdminProfileSettings.tsx` com:

### Seções da página:
1. **Informações Pessoais** — Nome, email (read-only), telefone
2. **Verificação de WhatsApp** — Reutilizar `WhatsAppVerificationModal` para validar telefone e ficar disponível para notificações EXA Alerts
3. **Autenticação em Duas Etapas (2FA)** — Toggle para ativar/desativar, idêntico ao dos clientes em `AdvertiserSettings.tsx` (requer WhatsApp verificado primeiro)
4. **Segurança** — Botão de reset de senha (com cooldown global)
5. **Informações da Conta** — ID, data de criação, cargo, departamento

### Rota e navegação:
- Adicionar rota `meu-perfil` em `AdminRoutes.tsx` e `SuperAdminRoutes.tsx`
- Adicionar link "Meu Perfil" no footer da sidebar (ao lado do avatar) e no dropdown do header

## Arquivos alterados

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `src/components/admin/layout/ModernAdminSidebar.tsx` | Corrigir `getAdminTitle()` para usar departamento; adicionar link "Meu Perfil" |
| 2 | `src/pages/admin/AdminProfileSettings.tsx` | **NOVO** — Página completa de perfil admin com WhatsApp, 2FA, senha |
| 3 | `src/routes/AdminRoutes.tsx` | Adicionar rota `meu-perfil` |
| 4 | `src/routes/SuperAdminRoutes.tsx` | Adicionar rota `meu-perfil` |
| 5 | `src/components/admin/layout/AdminHeader.tsx` | Adicionar link "Meu Perfil" no dropdown |
| 6 | `src/components/admin/layout/AdminSidebar.tsx` | Corrigir `getAdminTitle()` para usar departamento |

