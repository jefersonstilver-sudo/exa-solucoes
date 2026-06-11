## Diagnóstico (causa real)

O save **está enviando** o `cash_total_value` correto para o banco (linha 1559 — `cashTotal = overwriteCashValue ? parseFloat(cashValue) : fidelTotal*(1-discount/100)`).

O problema acontece **depois do save**, quando o formulário re-hidrata a proposta editada:

1. Em `NovaPropostaPage.tsx` (linhas 602-605), a hidratação só restaura:
   - `duration_months`
   - `discount_percent`
   - `fidel_monthly_value`
   
2. **Nunca** restaura `overwriteCashValue` nem `cashValue`.

3. Como `overwriteCashValue` volta a `false`, o `cashTotal` derivado (linha 1157) recalcula a partir do `fidelTotal*(1-discount/100)` — sobrescrevendo visualmente o valor manual salvo no banco e fazendo parecer que "voltou o valor antigo".

4. Se o usuário salvar novamente sem ativar o toggle, o `cash_total_value` calculado pisa o valor manual que estava no banco. Daí a percepção de "não salvou".

Conclusão: o save funciona, mas a UI perde a marcação de "manual", recalcula em cima e regrava por cima na próxima edição.

## Solução

### 1. Marcar persistentemente que o valor é manual

Adicionar coluna booleana `cash_value_manual` em `proposals` (default `false`). Fonte da verdade explícita — não depende de comparar floats.

```sql
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS cash_value_manual boolean NOT NULL DEFAULT false;
```

(sem novos GRANTs — a tabela já existe e mantém suas policies)

### 2. Gravar a flag no save (NovaPropostaPage.tsx)

Nos dois objetos de save (`proposalData` ~linha 1559 e `draftData` ~linha 1872), adicionar:

```ts
cash_value_manual: overwriteCashValue && !isCustomPayment && !isCustomDays && modalidadeProposta !== 'permuta',
cash_total_value: ... // mantém como está; já usa cashTotal corretamente
```

### 3. Re-hidratar o toggle ao abrir em modo edição (linhas 602-605)

Logo após `setFidelValue(...)`, adicionar:

```ts
const isManual = Boolean((existingProposal as any).cash_value_manual);
setOverwriteCashValue(isManual);
if (isManual) {
  setCashValue(String(existingProposal.cash_total_value ?? ''));
} else {
  setCashValue('');
}
```

Fallback (compat retroativa para propostas antigas sem a flag): se `cash_value_manual` for `null/undefined` mas existir divergência > R$ 1 entre `cash_total_value` e `fidel_monthly_value * duration_months * (1 - discount_percent/100)`, ativar `overwriteCashValue=true` com o valor salvo.

### 4. Não tocar em mais nada

- Cálculos de `cashTotal`, `fidelTotal`, slider PIX, parcelas custom, permuta, contratos: **inalterados**.
- UI do toggle, input destacado e desativação do mensal/slider (já implementados): **inalterados**.
- Página de detalhes (`PropostaDetalhesPage`) já lê `cash_total_value` direto — continua correta.

## Resultado esperado

- Ao salvar com toggle manual ativo: a flag e o valor são persistidos.
- Ao reabrir a proposta para edição: o toggle volta ativado, o campo manual aparece preenchido com o valor salvo, o mensal e o slider PIX ficam cinzas (como já fazem), e o `cashTotal` exibido = valor manual salvo.
- Ao salvar de novo sem mexer: o valor manual é mantido (não é mais sobrescrito pelo cálculo automático).

## Arquivos afetados

- `supabase/migrations/<novo>.sql` — adicionar coluna `cash_value_manual`.
- `src/pages/admin/proposals/NovaPropostaPage.tsx` — hidratação (linha ~605), `proposalData` (linha ~1559), `draftData` (linha ~1872).
