
# Auditoria Financeira Completa + Plano de Correção

## 1. Problemas Identificados na Auditoria

### 1.1 Números Incorretos no Dashboard

**Problema Principal**: O card "Projeção do Mês" mostra `Saídas: R$ 44.244` quando o valor real é:
- **Janeiro/2026** (mês atual): R$ 8.720 (saídas projetadas)
- **90 dias**: R$ 35.524

**Causa Raiz**: O hook `useResultadoFinanceiro.ts` consome dados do `useFluxoCaixa`, que busca dados de 90 dias (data atual até +90 dias) em vez de filtrar apenas o mês corrente.

**Código Problemático** (useFluxoCaixa.ts linha 25-26):
```typescript
const inicio = dataInicio || format(startOfMonth(new Date()), 'yyyy-MM-dd');
const fim = dataFim || format(addDays(new Date(), 90), 'yyyy-MM-dd'); // <-- Busca 90 dias!
```

### 1.2 Cálculo de Projeção Inconsistente

O `useResultadoFinanceiro` usa `resumo.entradasProjetadas` e `resumo.saidasProjetadas` do `useFluxoCaixa`, que é um resumo de TODOS os dados buscados (90 dias), não apenas do mês.

### 1.3 Módulo de Investimentos Incompleto

**Status Atual**:
- Tabela `investimentos` existe com campos básicos
- ZERO investimentos cadastrados no banco
- Não há tabela de retornos de investimento
- Não há cálculo de ROI/Payback
- Não há vinculação com centro de custo personalizado

**Campos da Tabela `investimentos`**:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| descricao | text | Nome do investimento |
| valor | numeric | Valor investido |
| data | date | Data do investimento |
| categoria_id | uuid | FK para categoria (não utilizada) |
| tipo | ENUM | capex, infraestrutura, marketing, tecnologia, outros |
| building_id | uuid | FK para prédio |
| fornecedor_id | uuid | FK para fornecedor |
| previsao_retorno | date | Data prevista de retorno |
| retorno_esperado | numeric | Valor de retorno esperado |
| status | ENUM | planejado, em_execucao, concluido, cancelado |

**Faltando**:
- Tabela `retornos_investimento` para registrar receitas vinculadas
- Cálculo de ROI, Payback, ROIC
- Centro de custo personalizado para gestoras
- Categorização automática de lançamentos de retorno

### 1.4 Centros de Custo Vazios

A tabela `centros_custo` existe mas está **VAZIA** (0 registros).

### 1.5 Despesas Fixas com Duplicidade Potencial

Na view `vw_fluxo_caixa_real`, algumas despesas aparecem tanto como `asaas_saida` (realizado) quanto como `despesa_fixa` (projetado), causando potencial duplicidade:
- "Salario Joao" - R$ 3.200 (pago via ASAAS) + R$ 3.800 (projetado fev)
- Combustível - múltiplas entradas

---

## 2. Plano de Correção

### FASE 1: Corrigir Números do Dashboard (Prioridade Alta)

#### 2.1 Atualizar `useResultadoFinanceiro.ts`

Alterar a lógica para buscar dados do **mês atual** em vez de usar o resumo de 90 dias:

```typescript
export const useResultadoFinanceiro = (): ResultadoFinanceiro => {
  const { metricas, loading: loadingMetricas } = useFinanceiroData();
  const { fluxoCaixa, fetchFluxoCaixa, loading: loadingFluxo } = useFluxoCaixa();
  const { inadimplentes, fetchInadimplentes, loading: loadingInadimplentes } = useInadimplentes();

  useEffect(() => {
    // Buscar apenas o mês atual
    const inicioMes = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const fimMes = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    fetchFluxoCaixa(inicioMes, fimMes);
    fetchInadimplentes();
  }, [fetchFluxoCaixa, fetchInadimplentes]);

  const resultado = useMemo(() => {
    // Filtrar apenas registros do mês atual
    const mesAtual = format(new Date(), 'yyyy-MM');
    const fluxoMes = fluxoCaixa.filter(fc => fc.data.startsWith(mesAtual));
    
    // Projeções do MÊS (não 90 dias)
    const projetados = fluxoMes.filter(fc => fc.status === 'projetado');
    const entradasProjetadas = projetados
      .filter(fc => fc.tipo === 'entrada')
      .reduce((sum, fc) => sum + fc.valor, 0);
    const saidasProjetadas = projetados
      .filter(fc => fc.tipo === 'saida')
      .reduce((sum, fc) => sum + fc.valor, 0);
    
    // Resultado Atual do mês
    const receitaRealizada = metricas?.receita_realizada || 0;
    const despesasTotal = metricas?.despesas_total || 0;
    const resultadoAtual = receitaRealizada - despesasTotal;
    
    // Projeção do mês
    const resultadoProjetado = entradasProjetadas - saidasProjetadas;
    
    // Contas atrasadas
    const contasAtrasadasTotal = inadimplentes.reduce((sum, i) => sum + i.total_devido, 0);
    const contasAtrasadasCount = inadimplentes.length;

    return { /* ... */ };
  }, [metricas, fluxoCaixa, inadimplentes, ...]);
};
```

#### 2.2 Valores Esperados Após Correção

| Indicador | Atual (Errado) | Correto |
|-----------|----------------|---------|
| Entradas Projetadas | R$ 23.618 | R$ 21.814,37 |
| Saídas Projetadas | R$ 44.244 | R$ 8.720,00 |
| Resultado Projetado | -R$ 20.626 | +R$ 13.094,37 |

---

### FASE 2: Corrigir View de Fluxo de Caixa

A view `vw_fluxo_caixa_real` precisa ser auditada para evitar duplicidades entre:
- `asaas_saida` (pagamentos realizados)
- `despesa_fixa` (projeções)

**Regra**: Se uma despesa fixa foi paga (existe em `asaas_saida` com mesma descrição/período), não deve aparecer como "projetado".

---

### FASE 3: Módulo de Investimentos Completo

#### 3.1 Criar Tabela de Retornos

```sql
CREATE TABLE retornos_investimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investimento_id UUID REFERENCES investimentos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  data DATE NOT NULL,
  categoria TEXT, -- dividendo, juros, venda_ativo, operacional
  comprovante_url TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.2 Campos Adicionais na Tabela Investimentos

```sql
ALTER TABLE investimentos ADD COLUMN IF NOT EXISTS
  centro_custo_id UUID REFERENCES centros_custo(id),
  investidor_id UUID REFERENCES users(id), -- Gestora/Investidor
  roi_realizado NUMERIC(10,4) DEFAULT 0,
  payback_meses INTEGER,
  data_payback DATE;
```

#### 3.3 Interface de Investimentos Completa

**Novo Layout da Página `InvestimentosPage.tsx`**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           💼 GESTÃO DE INVESTIMENTOS                        │
├───────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Total        │  │ ROI Médio    │  │ Payback      │  │ Retorno      │   │
│  │ Investido    │  │ Realizado    │  │ Médio        │  │ Acumulado    │   │
│  │ R$ 50.000    │  │ 12.5%        │  │ 8 meses      │  │ R$ 6.250     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ + Novo Investimento                                                  │   │
│  │                                                                       │   │
│  │  Descrição: ___________________________                              │   │
│  │  Valor: R$ ___________                                               │   │
│  │  Investidor/Gestora: [Dropdown de usuários ou externo]              │   │
│  │  Centro de Custo: [Dropdown ou criar novo]                           │   │
│  │  Retorno Esperado: R$ ___________                                    │   │
│  │  Previsão de Retorno: [DatePicker]                                  │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ LISTA DE INVESTIMENTOS                                               │   │
│  │                                                                       │   │
│  │  [Expandir] Compra Servidor Dell - R$ 15.000 - ROI: 8.2%            │   │
│  │     └── Retornos: R$ 500 (jan), R$ 450 (fev), R$ 280 (mar)          │   │
│  │     └── Payback: 12 meses restantes                                  │   │
│  │                                                                       │   │
│  │  [Expandir] Marketing Campanha Q1 - R$ 5.000 - ROI: 45%             │   │
│  │     └── Retornos: R$ 2.250 (conversões atribuídas)                  │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.4 Métricas de Investimento

- **ROI** = ((Retorno Total - Investimento) / Investimento) × 100
- **Payback** = Investimento / (Retorno Mensal Médio)
- **ROIC** = Retorno Operacional / Capital Investido

---

### FASE 4: Centros de Custo Personalizados

#### 4.1 Popular Tabela Centros de Custo

```sql
INSERT INTO centros_custo (codigo, nome, departamento, orcamento_mensal, ativo) VALUES
('OPER', 'Operacional', 'Operações', 10000.00, true),
('ADMIN', 'Administrativo', 'Administração', 5000.00, true),
('MARK', 'Marketing', 'Comercial', 3000.00, true),
('TI', 'Tecnologia', 'TI', 8000.00, true),
('INV', 'Investimentos', 'Financeiro', 0.00, true),
('GEST', 'Gestoras Externas', 'Financeiro', 0.00, true);
```

#### 4.2 Vinculação com Investimentos

Ao registrar um investimento de uma gestora externa:
1. Criar ou selecionar centro de custo `GEST-[NOME_GESTORA]`
2. Registrar investimento vinculado ao centro de custo
3. Ao registrar retornos, categorizar automaticamente como "Retorno de Investimento"

---

### FASE 5: Categorização Automática

#### 5.1 Regras de Categorização

Criar trigger ou função que categoriza automaticamente lançamentos baseado em:

```typescript
const categorizarLancamento = (descricao: string): string => {
  const descLower = descricao.toLowerCase();
  
  if (descLower.includes('salário') || descLower.includes('salario')) return 'folha_pagamento';
  if (descLower.includes('aluguel')) return 'ocupacao';
  if (descLower.includes('combustível') || descLower.includes('combustivel')) return 'transporte';
  if (descLower.includes('internet') || descLower.includes('fibra')) return 'telecom';
  if (descLower.includes('energia') || descLower.includes('luz')) return 'utilidades';
  if (descLower.includes('retorno investimento')) return 'receita_investimento';
  if (descLower.includes('dividendo')) return 'receita_dividendo';
  
  return 'outros';
};
```

---

## 3. Arquivos a Modificar/Criar

| Arquivo | Ação | Prioridade |
|---------|------|------------|
| `src/hooks/financeiro/useResultadoFinanceiro.ts` | **MODIFICAR** - Corrigir cálculo do mês | ALTA |
| `src/hooks/financeiro/useFluxoCaixa.ts` | **MODIFICAR** - Adicionar função para buscar apenas mês atual | MÉDIA |
| `src/pages/admin/financeiro/InvestimentosPage.tsx` | **REESCREVER** - Interface completa com ROI/Payback | ALTA |
| `src/hooks/financeiro/useInvestimentos.ts` | **MODIFICAR** - Adicionar cálculos de ROI | ALTA |
| `supabase/migrations/xxx_retornos_investimento.sql` | **CRIAR** - Tabela de retornos | ALTA |
| `supabase/migrations/xxx_centros_custo_seed.sql` | **CRIAR** - Seed de centros de custo | MÉDIA |
| `src/components/admin/financeiro/NovoInvestimentoModal.tsx` | **CRIAR** - Modal de cadastro | ALTA |
| `src/components/admin/financeiro/RegistrarRetornoModal.tsx` | **CRIAR** - Modal de retorno | ALTA |

---

## 4. Resultado Esperado

Após implementação:

1. **Dashboard com números corretos**: Projeção do mês mostrando valores reais (~R$ 8.720 de saídas, não R$ 44k)

2. **Módulo de Investimentos funcional**:
   - Cadastro de investimentos com investidor/gestora
   - Registro de retornos
   - Cálculo automático de ROI e Payback
   - Vinculação com centro de custo

3. **Centros de Custo ativos**: Permitindo categorizar investimentos por departamento/gestora

4. **Categorização automática**: Lançamentos categorizados por regras de negócio

5. **Rastreabilidade completa**: Cada real investido pode ser rastreado até seu retorno
