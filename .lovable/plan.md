
# Plano: Exibir Status de Pagamento e Valores Corretamente na Lista de Contas a Pagar

## Diagnóstico do Problema

### Situacao Atual
A interface lista as contas, mas **nao exibe informacoes cruciais de pagamento**:

1. **Valor pago** vs **Valor previsto** - nao mostra se foi pago parcialmente
2. **Data do pagamento** - nao mostra quando foi efetivamente pago
3. **Status "Agendado"** - nao diferencia entre pendente e agendado
4. **Indicador de auto-pagamento** - nao mostra se esta configurado para pagar automaticamente

### Campos Disponiveis no Banco de Dados
```text
despesas_fixas / despesas_variaveis:
- valor_pago (numeric) - Valor efetivamente pago
- data_pagamento (date) - Data que foi pago
- data_pagamento_agendado (date) - Data agendada para pagamento
- auto_pagar_na_data (boolean) - Se vai pagar automaticamente
- status (text) - 'pendente', 'pago', 'agendado', 'atrasado'
```

### Problema no Codigo
O `fetchContas()` busca os dados, mas o mapeamento nao inclui `data_pagamento`, `data_pagamento_agendado` e `auto_pagar_na_data` na interface `ContaPagar`.

## Solucao Proposta

### Fase 1: Expandir Interface ContaPagar

Adicionar os campos que faltam na interface TypeScript:

```typescript
interface ContaPagar {
  id: string;
  nome: string;
  categoria: string;
  valor_previsto: number;
  valor_pago: number;
  data_vencimento: string;
  status: 'pago' | 'pendente' | 'atrasado' | 'parcial' | 'agendado';
  tipo: 'fixa' | 'variavel';
  responsavel?: string;
  observacoes?: string;
  // NOVOS CAMPOS
  data_pagamento?: string;
  data_pagamento_agendado?: string;
  auto_pagar_na_data?: boolean;
}
```

### Fase 2: Atualizar Mapeamento no fetchContas()

Incluir os novos campos ao mapear os dados do banco:

```typescript
// Mapeamento de despesas_fixas
{
  // ... campos existentes
  data_pagamento: d.data_pagamento,
  data_pagamento_agendado: d.data_pagamento_agendado,
  auto_pagar_na_data: d.auto_pagar_na_data,
  status: d.status === 'agendado' ? 'agendado' : /* logica existente */
}
```

### Fase 3: Adicionar Status "Agendado" na Configuracao de Status

```typescript
const getStatusConfig = (status: ContaPagar['status']) => {
  switch (status) {
    // ... existentes
    case 'agendado':
      return { 
        icon: CalendarClock, 
        color: 'text-blue-600', 
        bg: 'bg-blue-50', 
        borderColor: 'border-blue-200', 
        label: 'Agendado' 
      };
  }
}
```

### Fase 4: Redesenhar Item da Lista com Informacoes de Pagamento

Novo layout visual para cada item:

```text
DESKTOP:
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ☐ │ 🔵 │ Aluguel Sede         │ Fixa │ Venc: 10/02 │ R$ 3.500  │ ⚡ Agendado   │
│   │    │ Imobiliária XYZ      │      │             │           │  15/02 (auto)  │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│ ☐ │ ✅ │ Internet Janeiro     │ Fixa │ Venc: 05/01 │ R$ 189    │ ✓ Pago        │
│   │    │ Provedor ABC         │      │             │ → R$ 189  │  12/01/2026    │
└──────────────────────────────────────────────────────────────────────────────────┘

MOBILE:
┌────────────────────────────────────────┐
│ ☐ Aluguel Sede                R$ 3.500│
│   [Fixa] [🔵 Agendado 15/02 ⚡]        │
│   📅 Vence: 10/02                      │
└────────────────────────────────────────┘
```

### Fase 5: Atualizar KPIs com Novo Status

Adicionar card para "Agendado":

```text
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total        │ │ Pago         │ │ Agendado     │ │ Pendente     │ │ Atrasado     │
│ R$ 45.000    │ │ R$ 28.000    │ │ R$ 8.500     │ │ R$ 3.500     │ │ R$ 5.000     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/admin/financeiro/ContasPagarPage.tsx` | Interface, fetchContas, getStatusConfig, KPIs, renderizacao da lista |

## Detalhes de Implementacao

### Nova Logica de Status
```typescript
// Prioridade do status:
// 1. Se status === 'pago' → pago
// 2. Se data_pagamento_agendado preenchida → agendado  
// 3. Se atrasado (vencimento < hoje) → atrasado
// 4. Senao → pendente
```

### Exibicao de Valor Pago vs Previsto
```typescript
// Se pago e valor_pago diferente de valor_previsto
{valor_pago !== valor_previsto && (
  <span className="text-xs text-slate-400 line-through">
    {formatCurrency(valor_previsto)}
  </span>
)}
<span className="font-bold">
  {formatCurrency(valor_pago > 0 ? valor_pago : valor_previsto)}
</span>
```

### Indicador de Agendamento
```typescript
{status === 'agendado' && data_pagamento_agendado && (
  <div className="flex items-center gap-1 text-xs text-blue-600">
    <CalendarClock className="h-3 w-3" />
    {format(new Date(data_pagamento_agendado), 'dd/MM')}
    {auto_pagar_na_data && <Zap className="h-3 w-3" title="Pagamento automatico" />}
  </div>
)}
```

### Indicador de Pagamento Efetuado
```typescript
{status === 'pago' && data_pagamento && (
  <div className="flex items-center gap-1 text-xs text-emerald-600">
    <CheckCircle2 className="h-3 w-3" />
    Pago em {format(new Date(data_pagamento), 'dd/MM')}
  </div>
)}
```

## Resultado Esperado

1. **Status visual claro** - Usuario ve imediatamente se conta esta paga, agendada, pendente ou atrasada
2. **Valores corretos** - Mostra valor pago vs previsto quando diferentes
3. **Datas de pagamento** - Exibe quando foi pago ou quando esta agendado
4. **Indicador de auto-pagamento** - Icone de raio mostra se sera pago automaticamente
5. **KPIs atualizados** - Totais separados por status incluindo "Agendado"
6. **Filtro por status** - Opcao "Agendado" no dropdown de filtro
