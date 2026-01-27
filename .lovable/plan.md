

# Plano: Corrigir Indicador de Propostas + Adicionar Indicadores de Resultado

## Problemas Identificados

### 1. Erro React.Fragment
O console mostra:
```
Warning: Invalid prop `data-lov-id` supplied to `React.Fragment`
```

**Causa**: Na linha 252-254, o `React.Fragment` com `key` recebe props adicionais do editor visual que não são permitidas em Fragments.

**Solução**: Substituir `React.Fragment` por uma `div` simples.

### 2. Indicadores de Resultado Faltando
Não existem cards mostrando:
- **Resultado Projetado** (lucro/prejuízo esperado)
- **Resultado Atual** (lucro/prejuízo realizado)

## Estrutura Visual Proposta

Adicionar uma nova seção com 2 cards grandes antes do grid de navegação:

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│                           📊 INDICADORES DE RESULTADO                         │
├───────────────────────────────┬───────────────────────────────────────────────┤
│                               │                                               │
│  RESULTADO ATUAL              │  RESULTADO PROJETADO                          │
│  Lucro/Prejuízo Realizado     │  Lucro/Prejuízo Esperado (30 dias)            │
│                               │                                               │
│    R$ 45.230,00               │    R$ 62.500,00                               │
│    ▲ +12.5% vs mês anterior   │    ▲ +8.2% vs projeção anterior               │
│                               │                                               │
│  Receita: R$ 120.000          │  Entradas: R$ 150.000                         │
│  Despesas: R$ 74.770          │  Saídas: R$ 87.500                            │
│                               │                                               │
└───────────────────────────────┴───────────────────────────────────────────────┘

┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│A Rec│ │A Pag│ │Lanç.│ │Proj.│ │ DRE │ │Inv. │ │Aport│ │Alert│ ...
└─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘
```

## Alterações Técnicas

### 1. Corrigir React.Fragment (FinanceiroQuickNav.tsx)

```typescript
// ANTES (linha 251-255)
{navItems.map((item) => (
  <React.Fragment key={item.id}>
    {renderNavCard(item)}
  </React.Fragment>
))}

// DEPOIS - Usar div em vez de Fragment
{navItems.map((item) => (
  <div key={item.id}>
    {renderNavCard(item)}
  </div>
))}
```

### 2. Criar Hook para Dados de Resultado

Novo hook `useResultadoFinanceiro` que calcula:
- Resultado atual do mês (receita - despesas - impostos)
- Resultado projetado (entradas - saídas próximos 30 dias)

```typescript
// src/hooks/financeiro/useResultadoFinanceiro.ts
interface ResultadoFinanceiro {
  // Resultado Atual
  resultadoAtual: number;
  receitaRealizada: number;
  despesasTotal: number;
  variacaoMesAnterior: number;
  
  // Resultado Projetado
  resultadoProjetado: number;
  entradasProjetadas: number;
  saidasProjetadas: number;
  
  loading: boolean;
}
```

### 3. Adicionar Cards de Indicadores (FinanceiroQuickNav.tsx)

Antes do grid de navegação, adicionar uma seção de indicadores:

```typescript
<div className="space-y-4">
  {/* Cards de Resultado */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Resultado Atual */}
    <Card className="bg-gradient-to-br from-slate-50 to-white border shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Resultado Atual</p>
            <p className={`text-2xl font-bold ${resultado >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(resultado)}
            </p>
            <p className="text-xs text-gray-400">
              Receita: {formatCurrency(receita)} | Despesas: {formatCurrency(despesas)}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${resultado >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {resultado >= 0 ? (
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-600" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Resultado Projetado */}
    <Card className="bg-gradient-to-br from-blue-50 to-white border shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Projeção 30 dias</p>
            <p className={`text-2xl font-bold ${projetado >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
              {formatCurrency(projetado)}
            </p>
            <p className="text-xs text-gray-400">
              Entradas: {formatCurrency(entradas)} | Saídas: {formatCurrency(saidas)}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${projetado >= 0 ? 'bg-blue-100' : 'bg-amber-100'}`}>
            <Target className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  {/* Grid de navegação existente */}
  <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
    {navItems.map((item) => (...))}
  </div>
</div>
```

### 4. Fonte de Dados

Os dados virão do `useFinanceiroData` que já existe no dashboard:
- `metricas.resultado_liquido_mes` - Resultado atual
- `metricas.receita_realizada` - Receita
- `metricas.despesas_total` - Despesas
- `projecao30d` do `useFluxoCaixa` - Projeções

**Problema**: O `FinanceiroQuickNav` não recebe esses dados como props.

**Solução**: Adicionar props ao componente ou criar um hook unificado.

## Arquivos a Modificar/Criar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/financeiro/useResultadoFinanceiro.ts` | **CRIAR** - Hook para calcular resultados |
| `src/components/admin/financeiro/FinanceiroQuickNav.tsx` | **MODIFICAR** - Corrigir Fragment + Adicionar cards de resultado |

## Resultado Esperado

1. Erro de React.Fragment corrigido
2. 2 cards grandes mostrando resultado atual e projetado
3. Cores semânticas: verde = lucro, vermelho = prejuízo
4. Detalhamento de receitas/despesas e entradas/saídas
5. Indicador de propostas a receber continua funcionando com HoverCard
6. Grid de navegação mantido abaixo dos indicadores

