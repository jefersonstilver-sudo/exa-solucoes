# Tipos de Conta como Módulo Completo (com Usuários, Edição e Exclusão)

Hoje a página tem dois problemas principais:

1. **Botão "Excluir tipo" não aparece** porque o painel de detalhe só renderiza Clonar/Excluir quando `is_system === false`. Para os tipos do sistema (Super Admin, Admin, etc.) ele simplesmente some — sem nem dizer ao usuário o porquê.
2. **Não há visão dos usuários daquele tipo**. O usuário só descobre quem usa o tipo no momento em que tenta excluir. Falta um módulo completo para gerenciar quem está vinculado.

Além disso, o console aponta um aviso de chaves duplicadas no `AnimatePresence` do `ModulePermissionsModal` que apareceu depois da minha última edição.

## O que muda na experiência

### 1. Painel direito vira "Módulo do Tipo de Conta" com 2 abas

Quando o super_admin clicar num tipo na lista esquerda, o painel direito passa a mostrar **abas no topo**:

- **Permissões** (já existe — mantida igual)
- **Usuários** (nova) — lista todos os usuários com aquele `role`

### 2. Aba "Usuários" — gestão completa

Por usuário mostra:
- Avatar/ícone, nome, email
- Departamento (quando houver) e badge de status (Ativo / Bloqueado / Email não confirmado)
- WhatsApp validado ou não (✅/⚠️) — usa colunas que adicionamos na migration anterior
- Data de cadastro

Para cada usuário, um botão de **menu de configurações** (ícone engrenagem) com opções:
- **Abrir console** → abre o `UserConsoleDialog` existente (já tem Identidade, Acesso, Escopo, Auditoria, Danger Zone — tudo pronto)
- **Trocar tipo de conta** → atalho que abre direto a aba "Acesso" do console
- **Reenviar validação WhatsApp** (se não validado)
- **Bloquear / Desbloquear**
- **Excluir usuário** (com confirmação destrutiva — usa fluxo padrão do console)

Acima da lista: campo de busca rápida (nome/email) + botão "Adicionar usuário com este tipo" que abre o `CreateUserDialog` já com o role pré-selecionado.

Quando vazio: estado limpo "Nenhum usuário usa este tipo ainda" + CTA para criar.

### 3. Botão "Excluir tipo" sempre visível, com explicação clara

No header do painel direito, o bloco de ações vira:

- Sempre exibe **"Clonar"** (todos os tipos podem ser clonados como base para outros).
- Sempre exibe **"Excluir tipo"** em vermelho — mas:
  - Para `is_system = true`: botão fica **desabilitado** com tooltip *"Tipos de sistema não podem ser excluídos."*
  - Para o tipo do próprio super_admin logado: desabilitado com tooltip *"Você não pode excluir o tipo que está usando."*
  - Caso contrário: clicável → abre o `DeleteRoleTypeDialog` completo (já criado, com lista de impacto, contagem e confirmação digitada).

### 4. Mesmo modelo no mobile

A versão mobile (Sheet/Dialog) ganha as mesmas duas abas e o mesmo bloco de ações com os mesmos comportamentos.

### 5. Botão "Excluir tipo" no `ModulePermissionsModal`

Mantém o que já adicionei (Zona de Risco no rodapé). Apenas corrijo o bug de chave duplicada do `AnimatePresence`.

## Correção do bug do console

O warning *"two children with the same key"* foi introduzido quando passei a renderizar `<DeleteRoleTypeDialog>` como segundo filho do `<AnimatePresence>` raiz. Solução: mover o `DeleteRoleTypeDialog` para **fora** do `<AnimatePresence>` (fica como sibling no fragmento React), já que ele não precisa de animação de mount/unmount controlada por esse AnimatePresence.

## Detalhes técnicos

**Novo componente:** `src/components/admin/account-types/RoleUsersPanel.tsx`
- Props: `role: RoleType`, `currentUserId: string | null`, `onChanged?: () => void`.
- Query `users-by-role` em `users` (`id, email, nome, role, is_blocked, email_confirmed_at, data_criacao, departamento_id, whatsapp_verified`) onde `role = role.key`. Ordena por `data_criacao desc`. Usa `useQuery`.
- Query `departments` para mapear `departamento_id → name` quando aplicável.
- Estado local: `searchTerm`, `consoleUser` (qual usuário está aberto no console), `createForRole` (boolean para abrir CreateUserDialog).
- Renderiza:
  - Toolbar: `Input` de busca + Botão "Adicionar usuário".
  - Lista de cards com: nome, email, departamento, badges (status, WhatsApp), data, e `DropdownMenu` (engrenagem) com as ações descritas acima.
  - Empty state e loading skeleton.
- Reutiliza:
  - `UserConsoleDialog` (`src/components/admin/users/console/UserConsoleDialog.tsx`) — já tem todo o fluxo de edição, bloqueio, mudança de role, danger zone.
  - `CreateUserDialog` — abre passando role default = `role.key` (acrescentar prop opcional `defaultRole?: string` e usar no estado inicial; se já houver, reaproveita).
- Após `onUserUpdated` do console: invalida `users-by-role`, `user-counts-by-role`, `users` para refletir trocas (se o role mudou, o usuário sai dessa lista automaticamente).

**Edição em `TiposContaPage.tsx`:**
- Importar `Tabs, TabsList, TabsTrigger, TabsContent` do shadcn e `RoleUsersPanel`.
- Adicionar estado `detailTab: 'permissions' | 'users'` (default `permissions`).
- No header de detalhe (desktop e mobile), substituir o bloco condicional `!is_system` por sempre mostrar Clonar + Excluir, controlando `disabled` + `Tooltip` quando bloqueado (sistema ou auto-exclusão). Capturar `userProfile?.id` via `useAuth` para a checagem de auto.
- Trocar a área `Permissions Grid` (linhas ~898-978 desktop e equivalente mobile) por:
  - `<Tabs value={detailTab} onValueChange={...}>` com `TabsList` (Permissões / Usuários).
  - `TabsContent value="permissions"`: o conteúdo atual (grupos colapsáveis).
  - `TabsContent value="users"`: `<RoleUsersPanel role={selectedRole} currentUserId={userProfile?.id} />`.
- Ajustar contagem do header já mostrada (`{userCounts[selectedRole.key] || 0} usuários`) para clicar e levar à aba "Usuários".

**Edição em `CreateUserDialog.tsx`:**
- Adicionar prop opcional `defaultRole?: string`. Se vier, usa como valor inicial de `role` no `useState` e seleciona no Select.

**Edição em `ModulePermissionsModal.tsx` (bugfix):**
- Mover o `<DeleteRoleTypeDialog>` para fora do `<AnimatePresence>` raiz, retornando um `<>` envolvendo `<AnimatePresence>{...}</AnimatePresence>` e o `<DeleteRoleTypeDialog />`. Resolve o warning de chave duplicada sem alterar comportamento.

**Sem mudanças** em RLS, edge functions, fluxo de WhatsApp, criação de prédios, painéis ou qualquer outro módulo. Escopo restrito à página de Tipos de Conta + bugfix do modal.

## Resultado

- Clica num tipo → vê **permissões** e **usuários** no mesmo lugar, sem precisar trocar de página.
- Cada usuário tem **engrenagem com ações** completas (editar, mudar tipo, bloquear, excluir).
- Botão **"Excluir tipo"** sempre visível com motivo claro quando está bloqueado.
- Sem mais warning de chave duplicada no console.

Aprova para eu implementar?