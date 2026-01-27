
# Plano: Corrigir Contas Atrasadas + Adicionar Indicador de Total

## Problemas Identificados

### 1. Contas Atrasadas = R$ 0 (ERRO)
O hook `useInadimplentes` busca dados da tabela `cobrancas` que está **VAZIA**.

Os dados reais de inadimplência estão na tabela `transacoes_asaas`:
- **5 cobranças OVERDUE** totalizando **R$ 338,95**
- Cliente: Jeferson Stilver (jefi92@gmail.com)
- Vencidas em 11/01/2026

### 2. Falta Indicador de Total Consolidado
O usuário espera ver abaixo dos 3 cards um resumo total:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  RESULTADO ATUAL  │  PROJEÇÃO DO MÊS  │  CONTAS ATRASADAS                   │
│  R$ X.XXX         │  R$ X.XXX         │  R$ 338,95 (5)                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          RESUMO DO MÊS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Projeção do Mês (entradas)............... R$ 21.814,37                     │
│  + Contas Atrasadas a Recuperar........... R$    338,95                     │
│  - Saídas Projetadas...................... R$  8.720,00                     │
│  ─────────────────────────────────────────────────────────                  │
│  = SALDO ESPERADO......................... R$ 13.433,32                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Correções Necessárias

### FASE 1: Corrigir Hook useInadimplentes

Alterar a fonte de dados de `cobrancas` para `transacoes_asaas`:

```typescript
// ANTES - Busca de tabela vazia
const { data, error } = await supabase
  .from('cobrancas')
  .select(`*, users:client_id (...)`)
  .eq('status', 'vencido')

// DEPOIS - Busca de transações ASAAS reais
const { data, error } = await supabase
  .from('transacoes_asaas')
  .select('*')
  .eq('status', 'OVERDUE')  // Status do ASAAS
  .order('data_vencimento', { ascending: true })
```

**Mapeamento de campos**:
| Campo Antigo | Campo Novo (transacoes_asaas) |
|--------------|-------------------------------|
| client_id    | customer_id                   |
| users.full_name | customer_name              |
| users.email  | customer_email                |
| valor        | valor                         |
| data_vencimento | data_vencimento            |
| dias_atraso  | CALCULAR: NOW() - data_vencimento |

### FASE 2: Adicionar Card de Resumo Consolidado

Adicionar abaixo do grid 3x1 um card de resumo:

```typescript
// Novo card de resumo após os 3 indicadores
<Card className="bg-gradient-to-r from-slate-800 to-slate-700 text-white border-0 shadow-lg">
  <CardContent className="p-4">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-medium text-slate-300">Resumo do Mês</p>
      <Calculator className="h-5 w-5 text-slate-400" />
    </div>
    
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-slate-300">Projeção (entradas)</span>
        <span className="text-emerald-400 font-medium">
          + {formatCurrency(resultadoData.entradasProjetadas)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-300">Contas Atrasadas</span>
        <span className="text-amber-400 font-medium">
          + {formatCurrency(resultadoData.contasAtrasadasTotal)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-300">Saídas Projetadas</span>
        <span className="text-red-400 font-medium">
          - {formatCurrency(resultadoData.saidasProjetadas)}
        </span>
      </div>
      
      <Separator className="bg-slate-600 my-2" />
      
      <div className="flex justify-between text-lg font-bold">
        <span>Saldo Esperado</span>
        <span className={saldoEsperado >= 0 ? 'text-emerald-400' : 'text-red-400'}>
          {formatCurrency(saldoEsperado)}
        </span>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/financeiro/useInadimplentes.ts` | Alterar fonte de dados para `transacoes_asaas` |
| `src/hooks/financeiro/useResultadoFinanceiro.ts` | Adicionar campo `saldoEsperado` |
| `src/components/admin/financeiro/FinanceiroQuickNav.tsx` | Adicionar card de resumo consolidado |

---

## Valores Esperados Apos Correcao

| Indicador | Antes | Depois |
|-----------|-------|--------|
| Contas Atrasadas | R$ 0 | R$ 338,95 |
| Qtd Inadimplentes | 0 | 5 (agrupado = 1 cliente) |
| Saldo Esperado | N/A | R$ 13.433,32 |

---

## Resultado Visual

```text
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ RESULTADO ATUAL│ │PROJECAO DO MES │ │CONTAS ATRASADAS│
│                │ │                │ │                │
│  R$ -X.XXX     │ │  R$ 13.094     │ │  R$ 338,95     │
│  Receita: X    │ │  Ent: 21.814   │ │  1 cliente     │
│  Desp: X       │ │  Sai: 8.720    │ │  5 cobrancas   │
└────────────────┘ └────────────────┘ └────────────────┘

┌────────────────────────────────────────────────────────┐
│              📊 RESUMO CONSOLIDADO DO MES              │
├────────────────────────────────────────────────────────┤
│  Projecao (entradas)............... + R$ 21.814,37    │
│  Contas Atrasadas.................. + R$    338,95    │
│  Saidas Projetadas................. - R$  8.720,00    │
│  ──────────────────────────────────────────────────    │
│  SALDO ESPERADO.................... = R$ 13.433,32    │
└────────────────────────────────────────────────────────┘

┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│A Rec│ │A Pag│ │Lanc.│ │Proj.│ │ DRE │ │Inv. │ ...
└─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘
```
