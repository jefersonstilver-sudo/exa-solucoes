

# Plano: Restaurar Fluxo de Publicação com Dialog de Envio para Rascunhos

## Problema

A mudança anterior criou a função `handlePublishDraft` (linhas 2068-2267) que publica rascunhos **diretamente**, sem mostrar o dialog de escolha de envio (WhatsApp / Email / Apenas Link). O botão "Publicar" para rascunhos chama `handlePublishDraft` em vez de `handleOpenSendDialog`.

O fluxo correto (que já existia para propostas novas) é:
1. Clicar "Publicar" abre o dialog com opções de envio
2. Usuário escolhe WhatsApp, Email ou Apenas Link
3. `createProposalMutation` salva, muda status para `enviada`, gera número EXA, e envia notificações

A `createProposalMutation` já trata rascunhos corretamente (linhas 1623-1660): gera número EXA, muda status para `enviada`, e cria log.

## Solução

### Arquivo: `src/pages/admin/proposals/NovaPropostaPage.tsx`

1. **Remover a função `handlePublishDraft`** (linhas 2066-2267) e o state `isPublishingDraft` (linha 2067) — são redundantes com `createProposalMutation`

2. **Restaurar o botão "Publicar" para sempre chamar `handleOpenSendDialog`** (linha 4464-4468): remover a condição ternária que desviava rascunhos para `handlePublishDraft`

3. **Limpar referências a `isPublishingDraft`** no disabled e nos labels do botão (linhas 4476, 4480, 4487-4488)

O `createProposalMutation` (linha 1623-1660) já faz tudo que é necessário para rascunhos: converte número `RASCUNHO-*` para `EXA-*`, muda status para `enviada`, cria contato no CRM, e envia notificações. Nenhuma lógica nova é necessária.

## Impacto
- Apenas o fluxo de publicação de rascunhos
- Restaura o comportamento original do sistema

