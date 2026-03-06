

# Plano: Unificar Perfil do Anunciante + Corrigir Atualização de Dados

## Diagnóstico

Existem **duas rotas concorrentes** para o perfil do anunciante, causando confusão e dados "não atualizados":

| Rota | Componente | Problema |
|------|-----------|----------|
| `/anunciante/perfil` | `AdvertiserSettings.tsx` | Componente completo (logo, WhatsApp, 2FA, empresa). Acessível pela sidebar. |
| `/anunciante/configuracoes` | `ProfileSettings.tsx` | Componente simplificado. `CompanyBrandSection` renderizado **sem `isEditing`** — impossível editar. Acessível pelo UserMenu e drawer. |

**O usuário está em `/anunciante/configuracoes`** (ProfileSettings.tsx), que mostra `CompanyBrandSection` com `isEditing=false` (linha 221), então nunca consegue editar a empresa. Além disso, este componente não exibe WhatsApp, 2FA, documentação — dados que o anunciante já preencheu em outro lugar.

Console confirma: `avatar_url: null` para o usuário atual, indicando que os dados da empresa nunca foram persistidos por esta rota.

## Solução

### 1. Unificar rotas no App.tsx
Ambas `/anunciante/perfil` e `/anunciante/configuracoes` renderizarão `AdvertiserSettings` (o componente completo).

**Arquivo:** `src/App.tsx` (linhas 479-488)
- Linha 484-488: Trocar `ProfileSettings` por `AdvertiserSettings` na rota `configuracoes`
- Manter ambas as rotas para compatibilidade

### 2. Padronizar navegação
Todos os menus apontarão para `/anunciante/configuracoes` com label "Meu Perfil":

| Arquivo | Mudança |
|---------|---------|
| `src/components/advertiser/layout/AdvertiserSidebarContent.tsx` (linha 69-72) | Trocar `href: '/anunciante/perfil'` → `/anunciante/configuracoes` |
| `src/components/mobile/MobileDrawerNavigation.tsx` (linha 73-77) | Já aponta para `/anunciante/configuracoes` — OK |
| `src/components/user/UserMenu.tsx` (linha 551) | Já aponta para `/anunciante/configuracoes` — OK |
| `src/components/advertiser/layout/ModernAdvertiserSidebar.tsx` (linha 40-42) | Trocar `href: '/anunciante/configuracoes'` — label já é "Configurações" — OK |

### 3. Garantir atualização imediata após salvar
No `AdvertiserSettings.tsx`, após `handleSave` (linha 127-176):
- Chamar `refreshUserProfile()` do `useAuth` para atualizar o `userProfile` global
- Isso faz com que o header do dashboard e qualquer componente que leia `userProfile.avatar_url` ou `userProfile.nome` atualize imediatamente

**Arquivo:** `src/pages/advertiser/AdvertiserSettings.tsx`
- Importar `refreshUserProfile` de `useAuth`
- Após `handleSave` bem-sucedido, chamar `await refreshUserProfile()`

### 4. Atualizar `CompanyBrandSection` para invalidar cache após salvar logo
No `handleLogoProcessed` (linha 88-105), após salvar `avatar_url`:
- Forçar refresh do `useAuth` profile para que `AdvertiserOrders` e o header atualizem

**Arquivo:** `src/components/settings/CompanyBrandSection.tsx`
- Importar `useAuth` e chamar `refreshUserProfile()` após logo salva

## Arquivos Alterados (4)

| Arquivo | Tipo | Mudança |
|---------|------|---------|
| `src/App.tsx` | Rota | `/anunciante/configuracoes` → renderizar `AdvertiserSettings` |
| `src/components/advertiser/layout/AdvertiserSidebarContent.tsx` | Nav | "Perfil" href → `/anunciante/configuracoes` |
| `src/pages/advertiser/AdvertiserSettings.tsx` | Refresh | Chamar `refreshUserProfile()` após save |
| `src/components/settings/CompanyBrandSection.tsx` | Refresh | Chamar `refreshUserProfile()` após logo salva |

## Garantias
- Zero tabelas novas
- Zero fluxos paralelos
- Reutiliza `refreshUserProfile` existente
- Todas as funcionalidades existentes preservadas
- Navegação consistente em todos os menus

