# Exclusão de Tipo de Conta com Aviso de Impacto

## O que muda na experiência

Hoje a exclusão existe apenas na lista de tipos (com um diálogo simples "Excluir? Esta ação não pode ser desfeita"). Não mostra quantos/quais usuários usam aquele tipo, e não está disponível dentro do modal "Configurar Módulos" (que é onde o super_admin geralmente está trabalhando o tipo).

Com a mudança:

1. **Botão "Excluir tipo de conta"** passa a aparecer dentro do `ModulePermissionsModal` (rodapé, em destaque vermelho destrutivo, fora dos toggles), apenas para tipos `is_system = false` (Super Admin / Sistema continuam protegidos).
2. Ao clicar, abre um **diálogo de impacto completo** com:
   - Nome e descrição do tipo prestes a ser excluído.
   - **Contagem total** de usuários que usam aquele tipo.
   - **Lista dos usuários afetados** (nome + email + último acesso), rolável, com badge "Perderá acesso".
   - Aviso claro em vermelho: *"Estes usuários ficarão sem tipo de conta válido e perderão acesso ao sistema. Será necessário atribuir manualmente um novo tipo de conta para cada um antes que voltem a acessar."*
   - Bloco de **próximos passos sugeridos** (com link rápido para a página de Usuários filtrada por esses IDs).
3. Se houver usuários vinculados, o botão "Excluir mesmo assim" exige **confirmação dupla** — o super_admin precisa digitar a palavra `EXCLUIR` no campo (padrão Danger Zone do Enterprise Console).
4. Se não houver usuários vinculados, exclusão direta com um único clique de confirmação.
5. Após excluir: invalida `role-types`, `user-counts-by-role` e `module-permissions`, fecha o modal e mostra toast com resumo (`"Tipo X excluído. N usuários ficaram sem tipo válido."`).
6. O AlertDialog antigo da TiposContaPage continua funcionando (compatibilidade), mas reaproveita o mesmo componente novo de impacto, garantindo o mesmo aviso completo em qualquer ponto de entrada.

## Comportamento de borda

- Tipos `is_system = true` (Super Admin, Admin, etc.): botão Excluir fica desabilitado com tooltip *"Tipos de sistema não podem ser excluídos"*.
- Tipo do próprio usuário logado: botão desabilitado com aviso *"Você não pode excluir o tipo que está usando atualmente"*.
- A exclusão remove em cascata as `role_permissions` daquele `role_key` (já é o comportamento atual da mutation; mantido).
- Os usuários afetados **não** são deletados — apenas perdem o vínculo de tipo. A página de Usuários os exibe destacados como "Sem tipo válido" para o super_admin atribuir um novo (já existe esse fluxo de edição de role).

## Detalhes técnicos

**Novo componente:** `src/components/admin/account-types/DeleteRoleTypeDialog.tsx`
- Props: `role: RoleType | null`, `currentUserRoleKey: string`, `open`, `onOpenChange`, `onDeleted()`.
- Query `affected-users-by-role` busca de `users` (`id, email, nome, last_sign_in_at`) onde `role = role.key`.
- Renderiza:
  - Header destrutivo com ícone `AlertTriangle`.
  - Card de contagem ("X usuários serão impactados").
  - `ScrollArea` com a lista (limite visual ~6, restante rolável).
  - Box de aviso vermelho explicando a consequência.
  - Box informativo com sugestão "Atribua um novo tipo a esses usuários antes ou depois da exclusão".
  - Quando `affectedUsers.length > 0`: input "Digite EXCLUIR para confirmar" + botão `Excluir mesmo assim` (desabilitado até bater).
  - Quando `affectedUsers.length === 0`: botão simples `Excluir tipo`.
- Mutation reutiliza a lógica existente: deleta `role_permissions` por `role_key` e depois `role_types` por `key`. Em caso de sucesso, invalida queries (`role-types`, `user-counts-by-role`, `module-permissions`, `role-permissions`) e chama `onDeleted()`.

**Edição em `ModulePermissionsModal.tsx`:**
- Importar `DeleteRoleTypeDialog` e `Trash2`.
- Adicionar estado `showDelete`.
- Acima/abaixo dos botões "Salvar/Cancelar" do rodapé, adicionar uma "Danger Zone" colapsável com botão `Excluir tipo de conta` (vermelho outline). Disponível apenas se `!role.is_system`.
- Ao confirmar exclusão (`onDeleted`), chamar `onClose()` para fechar o modal de módulos.

**Edição em `TiposContaPage.tsx`:**
- Substituir os dois `AlertDialog` existentes (linha 677 e 1080) por `DeleteRoleTypeDialog` reutilizado.
- Remover a `deleteRole` mutation duplicada do componente da página (passa a viver no novo componente). O botão lixeira da lista mobile/desktop apenas abre o dialog.
- Passar `currentUserRoleKey` obtido via `useAuth` para impedir auto-exclusão.

**Sem mudanças** em RLS, edge functions, fluxo de criação, `CreateUserDialog`, validação WhatsApp, navegação ou qualquer outro módulo. Escopo restrito à exclusão de tipos de conta.

## Resultado

- Super_admin pode excluir um tipo de conta direto de "Configurar Módulos".
- Antes de excluir, vê **exatamente quem perde acesso** e o que precisa fazer depois.
- Tipos do sistema permanecem protegidos.
- Auto-exclusão bloqueada.
- Mesma UX consistente quando exclui pela lista ou pelo modal.

Aprova para eu implementar?