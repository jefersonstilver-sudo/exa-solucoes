## Plano de correção: proposta por dias + valor manual

### Diagnóstico
A proposta atual `EXA-2026-9900` está com o valor certo (`cash_total_value = 7849`), mas a lógica apagou o período por dias:

```text
cash_value_manual = true
cash_total_value = 7849
is_custom_days = false
custom_days = null
duration_months = 1
fidel_monthly_value = 3882.67
payment_type = standard
```

Isso acontece porque o sistema trata “valor à vista manual” e “período em dias” como modos incompatíveis. Quando o botão manual é ativado, ele força `is_custom_days=false`, limpa `custom_days`, troca para `duration_months=1` e a UI volta a mostrar referências de fidelidade/mês.

### Regra correta
Criar uma regra única:

```text
Se período em dias estiver ativo:
- a proposta é uma proposta por dias
- o valor principal é sempre o total do período
- se o valor manual estiver ativo, usar exatamente o valor digitado
- não mostrar fidelidade/mês como opção principal
- não converter para 1 mês
```

Para o caso informado:

```text
Início: 15/06
Fim: 01/08
Duração: 47 dias
Total: R$ 7.849,00
```

### O que será ajustado

1. **Formulário de edição/criação**
   - Permitir “Dias” + “Valor à vista manualmente” ao mesmo tempo.
   - Remover a regra que desliga `is_custom_days` quando o valor manual é ativado.
   - Permitir mais de 29 dias no campo de dias para suportar 47 dias.
   - Quando as datas forem escolhidas, salvar `custom_days = 47`, `custom_days_start_date = 2026-06-15`, `custom_days_end_date = 2026-08-01`.

2. **Salvamento principal, rascunho manual e autosave**
   - Para proposta por dias com valor manual, salvar:

```text
payment_type = days
is_custom_days = true
custom_days = 47
custom_days_start_date = 2026-06-15
custom_days_end_date = 2026-08-01
cash_value_manual = true
cash_total_value = 7849
fidel_monthly_value = 0 ou valor técnico não exibido
duration_months = 0
```

   - Evitar que `duration_months=1` ou fidelidade mensal sobrescrevam a proposta.

3. **Reabertura da proposta**
   - Ao abrir uma proposta com `is_custom_days=true`, manter o seletor “Dias” ativo.
   - Ao abrir uma proposta com `cash_value_manual=true`, manter o campo manual preenchido.
   - Se ambos existirem, mostrar “47 dias + R$ 7.849 total”, sem voltar para fidelidade.

4. **Resumo dentro do editor**
   - Quando for período em dias, o resumo exibirá “Total do período”.
   - Se o total foi manual, ocultar equivalência mensal e bloco de fidelidade.

5. **Lista interna e card mobile**
   - Mostrar `47d` e `R$ 7.849,00` como valor principal.
   - Mostrar badge “Período em dias” ou “À vista manual”.
   - Não mostrar `/mês` para essa proposta.

6. **Página pública da proposta**
   - Usar as datas reais quando existirem: 15/06 até 01/08.
   - Mostrar total de 47 dias.
   - Exibir R$ 7.849,00 como valor principal.
   - Ocultar plano fidelidade, equivalência mensal, cartão recorrente e comparações por mês quando `is_custom_days=true`.

7. **Detalhes internos da proposta**
   - Corrigir a tela de detalhes para usar `cash_total_value` no total de período em dias.
   - Remover exibição de “Fidelidade/mês” quando a proposta é por dias/manual.

8. **Correção pontual no banco para a proposta atual**
   - Ajustar `EXA-2026-9900` para refletir o estado real:

```text
payment_type = days
is_custom_days = true
custom_days = 47
custom_days_start_date = 2026-06-15
custom_days_end_date = 2026-08-01
cash_value_manual = true
cash_total_value = 7849
duration_months = 0
discount_percent = 0
```

### Arquivos envolvidos
- `src/pages/admin/proposals/NovaPropostaPage.tsx`
- `src/pages/public/PropostaPublicaPage.tsx`
- `src/pages/admin/proposals/PropostasPage.tsx`
- `src/components/admin/proposals/ProposalMobileCard.tsx`
- `src/components/admin/proposals/ProposalMobileList.tsx`
- `src/pages/admin/proposals/PropostaDetalhesPage.tsx`

### Resultado esperado
- Você escolhe “Dias”, coloca 15/06 até 01/08, o sistema calcula 47 dias.
- Você ativa valor manual e digita R$ 7.849.
- Ao salvar, a proposta continua como 47 dias + R$ 7.849.
- Ao reabrir, não volta para 1 mês.
- Na pública, card interno, mobile e detalhes, aparece o total por dias, sem fidelidade mensal.