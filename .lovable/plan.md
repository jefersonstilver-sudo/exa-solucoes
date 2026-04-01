

# Plano: Dashboard Dinâmico de Vendedores + Diagnóstico de Publicação

## Problema 1: Cards de vendedores com nomes fictícios (PropostasPage.tsx)

A seção de vendedores (linhas 227-1015) usa **3 IDs fixos hardcoded** ("Bruno Dantas", "Jeferson Stilver", "Eduardo Comercial"). Consulta ao banco mostra que nos últimos 30 dias, **apenas Jeferson** (`7cca6d1b`) tem propostas enviadas. "Bruno" e "Eduardo" nunca enviaram propostas — são cards fantasma.

O componente `ProposalStatsRow.tsx` (usado no dashboard principal) já é 100% dinâmico e correto. O problema está exclusivamente em `PropostasPage.tsx`.

### Correção

Substituir os 3 cards hardcoded por uma query dinâmica que busca **todos os vendedores que criaram propostas nos últimos 30 dias**, sem lista fixa de IDs:

1. **Remover** `SELLER_IDS` e a query `sellers-stats-fixed` (linhas 227-286)
2. **Nova query dinâmica**: buscar `SELECT DISTINCT created_by FROM proposals WHERE created_at >= NOW() - 30 days AND status != 'rascunho'`, depois buscar nomes e calcular stats
3. **Substituir os 3 cards fixos** (linhas 934-1016) por um `.map()` dinâmico que renderiza apenas vendedores reais com propostas no período
4. Cores dos cards serão atribuídas por índice (array de cores rotativo)

## Problema 2: Proposta não sai de "Rascunho" ao publicar

### Diagnóstico

A proposta `EXA-2026-2586` tem `status: rascunho` mas `sent_at` definido e número EXA — estado inconsistente. Isso ocorreu com a versão anterior do código que tinha `handlePublishDraft` (já removido). O código atual do `createProposalMutation` (linhas 1634-1644) está correto: faz `.update({ ...proposalData, status: 'enviada' })`.

**Causa provável**: A inconsistência é residual da versão anterior. Porém, para garantir que não aconteça novamente, vou adicionar:

1. **Logs explícitos** antes e depois do `.update()` no `createProposalMutation` para rastrear se o update executa
2. **Verificação pós-update**: após o `.update()`, fazer um `.select()` e confirmar que `status === 'enviada'` no retorno, logando qualquer discrepância
3. **Corrigir a proposta inconsistente** existente (EXA-2026-2586) via insert tool: `UPDATE proposals SET status = 'enviada' WHERE id = '41856389-...' AND status = 'rascunho' AND number LIKE 'EXA%'`

## Arquivos a editar

- **`src/pages/admin/proposals/PropostasPage.tsx`**: remover IDs fixos, query dinâmica, cards dinâmicos
- **`src/pages/admin/proposals/NovaPropostaPage.tsx`**: adicionar logs de diagnóstico no mutation
- **Dados**: corrigir proposta inconsistente no banco

## Impacto
- Dashboard mostra apenas vendedores reais com propostas no período
- Publicação de rascunhos ganha rastreabilidade com logs
- Nenhuma alteração em outros fluxos

