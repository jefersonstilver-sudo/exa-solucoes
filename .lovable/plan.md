

# Plano: Adicionar Indicador "A Receber" de Propostas no Dashboard Financeiro

## Objetivo

Exibir no card "Contas a Receber" do `FinanceiroQuickNav` o valor das propostas aceitas, com um **HoverCard** mostrando:
1. Quantas propostas estao aceitas (aguardando pagamento)
2. Quantas propostas estao pendentes de aceitacao
3. Detalhes de forma de pagamento (PIX/Boleto/Cartao)

## Estrutura Visual do HoverCard

```text
┌─────────────────────────────────────────────────────────────┐
│  📊 PROPOSTAS - A RECEBER                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  VALOR TOTAL                                                │
│  R$ 45.000,00                                               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ✅ Aceitas (aguardando pagamento)           3 propostas    │
│  ⏳ Pendentes de aceitacao                  12 propostas    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  FORMAS DE PAGAMENTO (das aceitas)                          │
│  💳 PIX/Boleto: R$ 30.000  (2)                              │
│  💰 Parcelado:  R$ 15.000  (1)                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Alteracoes Tecnicas

### 1. Criar Hook para Buscar Dados de Propostas

Novo hook `usePropostasAReceber` que busca:
- Propostas com status `aceita` (aceitas mas nao pagas)
- Propostas pendentes (enviada, visualizada, pendente)
- Agrupa por forma de pagamento

```typescript
// src/hooks/financeiro/usePropostasAReceber.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PropostasAReceber {
  valorTotal: number;
  countAceitas: number;
  countPendentes: number;
  porFormaPagamento: {
    pix_boleto: { valor: number; count: number };
    parcelado: { valor: number; count: number };
  };
  loading: boolean;
}

export const usePropostasAReceber = () => {
  // Buscar propostas aceitas e pendentes
  // Agrupar por payment_type
  // Retornar metricas consolidadas
};
```

### 2. Atualizar FinanceiroQuickNav com HoverCard

Adicionar `HoverCard` no card "Contas a Receber" com:
- Badge mostrando valor total
- Conteudo expandido no hover

```typescript
// No card 'receber'
<HoverCard openDelay={200}>
  <HoverCardTrigger asChild>
    <Card className="...">
      <CardContent className="...">
        <div className="p-2 rounded-lg bg-gray-50">
          <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
        </div>
        <span className="text-xs font-medium">A Receber</span>
        {/* Badge com valor */}
        <Badge className="bg-emerald-100 text-emerald-700 text-xs">
          {formatCurrency(propostasData.valorTotal)}
        </Badge>
      </CardContent>
    </Card>
  </HoverCardTrigger>
  
  <HoverCardContent side="bottom" className="w-72">
    {/* Conteudo detalhado */}
  </HoverCardContent>
</HoverCard>
```

### 3. Estrutura do HoverCardContent

```typescript
<HoverCardContent side="bottom" className="w-80 p-4">
  <div className="space-y-3">
    {/* Header */}
    <div className="flex items-center gap-2">
      <FileText className="h-4 w-4 text-emerald-600" />
      <span className="font-semibold text-sm">Propostas - A Receber</span>
    </div>
    
    {/* Valor Total */}
    <div className="text-center py-2 bg-emerald-50 rounded-lg">
      <p className="text-2xl font-bold text-emerald-700">
        {formatCurrency(propostasData.valorTotal)}
      </p>
      <p className="text-xs text-emerald-600">Valor Total Aceito</p>
    </div>
    
    <Separator />
    
    {/* Contagem */}
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          Aceitas (aguardando pgto)
        </span>
        <Badge variant="outline" className="bg-emerald-50">
          {propostasData.countAceitas}
        </Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm flex items-center gap-1">
          <Clock className="h-3 w-3 text-amber-500" />
          Pendentes de aceitacao
        </span>
        <Badge variant="outline" className="bg-amber-50">
          {propostasData.countPendentes}
        </Badge>
      </div>
    </div>
    
    <Separator />
    
    {/* Formas de Pagamento */}
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase">
        Formas de Pagamento
      </p>
      <div className="flex justify-between text-sm">
        <span>PIX/Boleto:</span>
        <span className="font-medium">
          {formatCurrency(propostasData.porFormaPagamento.pix_boleto.valor)} 
          ({propostasData.porFormaPagamento.pix_boleto.count})
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Parcelado:</span>
        <span className="font-medium">
          {formatCurrency(propostasData.porFormaPagamento.parcelado.valor)} 
          ({propostasData.porFormaPagamento.parcelado.count})
        </span>
      </div>
    </div>
  </div>
</HoverCardContent>
```

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/hooks/financeiro/usePropostasAReceber.ts` | **CRIAR** - Hook para buscar dados de propostas |
| `src/components/admin/financeiro/FinanceiroQuickNav.tsx` | **MODIFICAR** - Adicionar HoverCard no card "A Receber" |

## Query do Supabase

```typescript
// Propostas aceitas (nao pagas ainda)
const { data: aceitas } = await supabase
  .from('proposals')
  .select('id, cash_total_value, payment_type')
  .eq('status', 'aceita');

// Propostas pendentes de aceitacao
const { data: pendentes } = await supabase
  .from('proposals')
  .select('id', { count: 'exact' })
  .in('status', ['enviada', 'visualizada', 'pendente', 'atualizada']);
```

## Resultado Esperado

1. Card "Contas a Receber" exibe badge com valor total das propostas aceitas
2. Ao passar o mouse, HoverCard mostra:
   - Valor total em destaque
   - Quantidade de propostas aceitas vs pendentes
   - Breakdown por forma de pagamento
3. Clique ainda navega para a pagina de contas a receber
4. Design consistente com outros HoverCards do sistema

