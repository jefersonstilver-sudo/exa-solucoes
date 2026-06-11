## Plano de correção

A causa real é que o botão “valor à vista manual” ainda está sendo tratado como um ajuste dentro da lógica mensal/fidelidade. Na proposta atual aberta, o banco está salvo como `payment_type = days`, `duration_months = 0`, `cash_value_manual = false` e `cash_total_value = 3882.67`, por isso a pública, a lista e os cards continuam lendo o valor antigo.

## O que vou corrigir

1. **Criar uma regra única para “proposta à vista manual”**
   - Quando o botão de valor à vista manual estiver ativo, a proposta será considerada uma proposta à vista.
   - O valor principal da proposta passa a ser `cash_total_value`.
   - Não será tratado como fidelidade mensal.
   - Não será tratado como período em dias.
   - O desconto/slider não recalcula por cima do valor manual.

2. **Corrigir todos os salvamentos da proposta**
   - Salvamento principal.
   - Salvamento manual de rascunho.
   - Autosave/debounce de rascunho, que hoje ainda recalcula o valor antigo e pode sobrescrever o valor manual.

3. **Persistir a intenção correta no banco**
   - Gravar `cash_value_manual = true` quando o botão estiver ativo.
   - Gravar `cash_total_value` exatamente com o valor digitado.
   - Manter `payment_type` compatível com os fluxos existentes, sem quebrar propostas customizadas, permuta ou período em dias.
   - Se necessário, ajustar a proposta atual afetada para sair do estado incorreto (`days`, `duration_months = 0`, `cash_value_manual = false`).

4. **Corrigir a reabertura/edição**
   - Ao abrir uma proposta com valor à vista manual, o botão volta ativo.
   - O campo manual volta preenchido.
   - O valor mensal/fidelidade fica visualmente desativado.
   - O sistema não recalcula automaticamente para o valor antigo.

5. **Corrigir a página pública**
   - Quando `cash_value_manual = true`, exibir somente a lógica de à vista como valor principal.
   - Não mostrar equivalência mensal como se fosse fidelidade.
   - Não deixar o card de fidelidade competir com o valor manual.
   - O pagamento gerado deve usar o valor manual salvo em `cash_total_value`.

6. **Corrigir lista interna e cards mobile**
   - Cards/lista de propostas passam a mostrar o valor à vista manual como valor principal.
   - Remover `/mês` quando a proposta for valor manual à vista.
   - Exibir um indicador simples de “À vista” para esse caso.

## Arquivos que serão ajustados

- `src/pages/admin/proposals/NovaPropostaPage.tsx`
- `src/pages/public/PropostaPublicaPage.tsx`
- `src/pages/admin/proposals/PropostasPage.tsx`
- `src/components/admin/proposals/ProposalMobileCard.tsx`
- Possível atualização pontual da proposta atual no banco, apenas para corrigir o registro que ficou salvo com a lógica errada.

## Resultado esperado

- Digitou R$ 7 mil e poucos no valor à vista manual, salvou: esse valor fica salvo de verdade.
- Ao abrir de novo, continua R$ 7 mil e poucos.
- Na proposta pública aparece R$ 7 mil e poucos.
- No card/lista interna aparece R$ 7 mil e poucos como à vista, não como mensalidade.
- Nenhuma lógica de fidelidade mensal sobrescreve esse valor enquanto o botão estiver ativo.