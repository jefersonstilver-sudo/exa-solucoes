
# Adicionar Data de Inicio e Fim no Periodo em Dias

## Problema
Atualmente, o modulo "Periodo em Dias" so permite inserir a quantidade de dias manualmente. O usuario precisa tambem poder definir uma **data de inicio** e uma **data de fim** da campanha, e o numero de dias ser calculado automaticamente a partir dessas datas.

## Solucao

### 1. Migracao SQL - Novas colunas na tabela `proposals`

Adicionar dois campos:
- `custom_days_start_date` (date, nullable) - Data de inicio da campanha
- `custom_days_end_date` (date, nullable) - Data de fim da campanha

### 2. Atualizar tipos Supabase

Adicionar os novos campos no tipo `proposals` em `src/integrations/supabase/types.ts` (Row, Insert, Update).

### 3. UI - Secao "Periodo em Dias" (NovaPropostaPage.tsx)

Modificar o bloco existente (linhas 2977-3004) para incluir:

```text
+--------------------------------------------------+
| 📅 Periodo em Dias                               |
|                                                  |
| Data de Inicio          Data de Fim              |
| [  23/02/2026  ]        [  10/03/2026  ]         |
|                                                  |
| Quantidade de Dias                               |
| [ 15 ]  dias   (calculado automaticamente)       |
|                                                  |
| ⚠️ Periodos < 30 dias tem acrescimo de 10%       |
|                                                  |
| Valor Total (15 dias):          R$ 1.307,90      |
+--------------------------------------------------+
```

**Comportamento**:
- Dois date pickers (usando o componente Calendar/Popover existente) para inicio e fim
- Ao selecionar ambas as datas, `customDays` e calculado automaticamente (`differenceInDays(end, start)`)
- O input de "Quantidade de Dias" continua visivel mas como **readonly** (calculado pelas datas)
- Se o usuario quiser, pode digitar dias manualmente e as datas ficam vazias (compatibilidade retroativa)

### 4. Estados novos (NovaPropostaPage.tsx)

Adicionar:
- `customDaysStartDate: Date | null` - estado para data inicio
- `customDaysEndDate: Date | null` - estado para data fim

Logica:
- Ao mudar qualquer data, recalcular `customDays` via `differenceInDays`
- Ao mudar `customDays` manualmente, limpar as datas (modo manual)

### 5. Salvar e Restaurar (NovaPropostaPage.tsx)

**handleSaveDraft** (linha ~940): Adicionar campos `custom_days_start_date` e `custom_days_end_date` ao objeto de save.

**Restauracao em modo edicao** (linha ~616): Restaurar `customDaysStartDate` e `customDaysEndDate` do `existingProposal`.

### 6. Proposta publica (PropostaDetalhesPage.tsx)

Atualizar o calculo de periodo (linha ~186) para usar as datas reais quando disponiveis em vez de `addDays(created_at, custom_days)`.

## Arquivos modificados

1. **Nova migracao SQL** - Adicionar colunas `custom_days_start_date` e `custom_days_end_date`
2. **`src/integrations/supabase/types.ts`** - Tipos atualizados
3. **`src/pages/admin/proposals/NovaPropostaPage.tsx`** - Estados, UI com date pickers, save e restore
4. **`src/pages/admin/proposals/PropostaDetalhesPage.tsx`** - Usar datas reais no calculo de periodo
