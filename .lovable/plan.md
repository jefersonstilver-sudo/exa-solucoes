## Problema

Ao ativar o toggle **"Definir valor à vista manualmente"** (linha 3235 de `NovaPropostaPage.tsx`):
- O campo "Valor Total à Vista" abre, mas o **Valor Mensal (Fidelidade)** acima continua editável, dando a sensação de que ambos competem.
- O **slider de Desconto PIX** também continua ativo, mas é ignorado (`cashTotal` passa a usar `cashValue` direto), confundindo o usuário.
- O usuário relata que "não consegue" definir o valor à vista — o input aceita digitação, mas a UI não dá feedback de que o controle agora é manual.

## Mudanças (apenas UI/UX no card de pagamento)

Arquivo único: `src/pages/admin/proposals/NovaPropostaPage.tsx`

1. **Desativar visualmente o campo Valor Mensal** (linhas 3180–3192) quando `overwriteCashValue === true`:
   - Adicionar `disabled={overwriteCashValue}` no `<Input>` do `fidelValue`.
   - Adicionar classes `opacity-60 bg-gray-100 cursor-not-allowed` quando manual estiver ativo.
   - Esconder o alerta de "valor difere do sugerido" (3194–3213) enquanto manual estiver ativo (não faz sentido nesse modo).

2. **Desativar visualmente o Slider de Desconto PIX** (linhas 3221–3231) quando `overwriteCashValue === true`:
   - Passar `disabled` no `<Slider>`.
   - Envolver em `<div className={overwriteCashValue ? 'opacity-50 pointer-events-none' : ''}>`.
   - Mostrar um pequeno texto: "Desconto desativado — valor à vista definido manualmente".

3. **Destacar o input manual** (linhas 3240–3246):
   - Garantir `autoFocus` quando o toggle for ligado, para o usuário digitar imediatamente.
   - Adicionar borda primária (`border-primary`) e um hint "Esse valor substitui o cálculo automático".
   - Pré-preencher `cashValue` com o `cashTotal` atual no momento em que o toggle é ativado (assim o usuário edita a partir do valor sugerido em vez de campo vazio).

4. **Nenhuma alteração** em lógica de cálculo (`cashTotal`, salvamento, contratos) — apenas comportamento de UI dos três blocos acima.

## Resultado esperado

- Toggle OFF: comportamento atual (mensal editável, slider ativo, manual oculto).
- Toggle ON: mensal e slider ficam cinzas/bloqueados, e o campo "Valor Total à Vista" recebe foco já preenchido com o valor atual, pronto para edição.
