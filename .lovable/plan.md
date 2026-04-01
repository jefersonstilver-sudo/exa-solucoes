

# Plano: Permitir salvar alterações em propostas editadas

## Problema

Quando o usuário edita uma proposta **já publicada** (status `enviada`):
1. **Auto-save está desabilitado** — linha 911: `if (!clientData.firstName.trim() || isEditMode) return;`
2. **Botão "Salvar Rascunho" não aparece** — linha 4118 só mostra para propostas com status `rascunho`
3. **Único caminho para salvar é "Salvar Alterações"** (botão Publicar) — que abre o dialog de envio por WhatsApp/Email, forçando o usuário a confirmar envio novamente

Ou seja, o usuário muda o valor mensal e **não tem nenhuma forma direta de salvar** sem repassar pelo fluxo de envio completo.

## Solução

### Arquivo: `src/pages/admin/proposals/NovaPropostaPage.tsx`

1. **Adicionar botão "Salvar Alterações" direto no footer** — visível apenas quando `isEditMode && proposta não é rascunho`. Este botão faz `.update()` direto no banco SEM abrir o dialog de envio (WhatsApp/Email).

2. **Criar função `handleSaveEdits`** — similar ao `handleSaveDraft` mas:
   - Mantém o `status` e `number` existentes (não altera)
   - Usa o mesmo objeto `proposalData` do `createProposalMutation`
   - Após salvar, mostra toast de sucesso e invalida o cache

3. **Manter o botão "Publicar/Reenviar"** separado para quando o usuário quiser republicar com envio de notificações.

### Mudanças específicas:
- **Nova função `handleSaveEdits`** (~30 linhas): faz `supabase.from('proposals').update(proposalData).eq('id', editProposalId)` direto
- **Footer (linha ~4095)**: adicionar botão "Salvar" entre os botões existentes, com ícone `Save`, apenas em modo edição de proposta não-rascunho
- **Nenhuma outra alteração** — fluxo de criação, rascunho e publicação permanecem iguais

