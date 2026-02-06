
# Correção: Exibição de Valores no Resumo - Mostrar Totais por Local com Múltiplas Posições

## O Problema Identificado

Quando você seleciona **2 posições**, o cálculo está funcionando corretamente:
- `valorSugeridoMensal` = R$ 7.890,00 (já multiplicado por 2)
- `fidelTotal` = R$ 94.680,00 (correto)

**MAS o resumo está DIVIDINDO de volta:**
```
Por local/mês = R$ 7.890 / 50 prédios = R$ 157,80
```

Quando deveria mostrar:
```
Por local/mês = R$ 315,60 (2 posições × R$ 157,80 base)
```

**O problema:** O resumo mostra "por local" mas não indica que são 2 posições por local!

---

## Solução

### Mudança 1: Mostrar claramente os valores COM indicador de posições

Atualizar o resumo para mostrar que os valores já incluem as múltiplas posições:

```tsx
{/* Fidelidade */}
<div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
  <div className="text-[10px] font-medium text-slate-500 uppercase mb-1">
    Fidelidade ({durationMonths}x)
    {quantidadePosicoes > 1 && (
      <span className="ml-1 text-primary">• {quantidadePosicoes}x posições</span>
    )}
  </div>
  
  {/* Por local/mês - TOTAL (já com posições) */}
  <div className="flex justify-between text-[10px]">
    <span>Por local/mês {quantidadePosicoes > 1 ? `(${quantidadePosicoes}x)` : ''}:</span>
    <span className="font-medium">
      {formatCurrency((vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) > 0 
        ? fidelMonthly / (vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) 
        : 0)}
    </span>
  </div>
  
  {/* NOVA LINHA: Por posição/mês (valor unitário) - aparece só com múltiplas posições */}
  {quantidadePosicoes > 1 && (
    <div className="flex justify-between text-[10px] text-muted-foreground">
      <span className="italic">Por posição/mês:</span>
      <span className="italic">
        {formatCurrency((vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) > 0 
          ? (fidelMonthly / quantidadePosicoes) / (vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) 
          : 0)}
      </span>
    </div>
  )}
  
  {/* Por tela/mês */}
  <div className="flex justify-between text-[10px]">
    <span>Por tela/mês:</span>
    <span className="font-medium">
      {formatCurrency(totalPanels > 0 ? fidelMonthly / totalPanels : 0)}
    </span>
  </div>
  
  {/* Total Final */}
  <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
    <span className="font-medium">Total:</span>
    <span className="font-bold">{formatCurrency(fidelTotal)}</span>
  </div>
</div>
```

### Mudança 2: Atualizar também o bloco PIX À Vista

Aplicar a mesma lógica ao bloco verde de PIX À Vista, mostrando:
- Por local/mês (total com posições)
- Por posição/mês (valor unitário quando >1 posição)
- Indicador visual de quantas posições

### Mudança 3: Adicionar badge visual no cabeçalho do resumo

```tsx
{/* Indicador de Múltiplas Posições no topo do resumo */}
{quantidadePosicoes > 1 && (
  <div className="mb-2 p-1.5 bg-primary/10 rounded-lg flex items-center justify-center gap-1">
    <Layers className="h-3 w-3 text-primary" />
    <span className="text-[10px] font-medium text-primary">
      Valores calculados para {quantidadePosicoes} posições por local
    </span>
  </div>
)}
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Adicionar indicador de posições no título Fidelidade |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Adicionar linha "Por posição/mês" quando >1 posição |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Replicar mudanças no bloco PIX À Vista |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Adicionar badge explicativo no topo do grid de resumo |

---

## Código Específico

### Linhas 3265-3315 - Atualizar blocos de resumo

```tsx
{/* Resumo Consolidado por Modalidade */}
{quantidadePosicoes > 1 && (
  <div className="mb-2 p-1.5 bg-primary/10 rounded-lg flex items-center justify-center gap-1">
    <Layers className="h-3 w-3 text-primary" />
    <span className="text-[10px] font-medium text-primary">
      Valores calculados para {quantidadePosicoes} posições por local
    </span>
  </div>
)}

<div className="grid grid-cols-2 gap-3">
  {/* Fidelidade */}
  <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
    <div className="text-[10px] font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
      Fidelidade ({durationMonths}x)
      {quantidadePosicoes > 1 && (
        <span className="text-[8px] px-1 py-0.5 bg-primary/10 text-primary rounded">
          {quantidadePosicoes}x pos.
        </span>
      )}
    </div>
    
    {/* Por local/mês - TOTAL com todas as posições */}
    <div className="flex justify-between text-[10px]">
      <span>Por local/mês:</span>
      <span className="font-medium">
        {formatCurrency(
          (vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) > 0 
          ? fidelMonthly / (vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) 
          : 0
        )}
      </span>
    </div>
    
    {/* Por posição/mês - valor unitário (só aparece com 2+ posições) */}
    {quantidadePosicoes > 1 && (
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span className="italic text-[9px]">↳ cada posição:</span>
        <span className="italic text-[9px]">
          {formatCurrency(
            (vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) > 0 
            ? (fidelMonthly / quantidadePosicoes) / (vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) 
            : 0
          )}
        </span>
      </div>
    )}
    
    <div className="flex justify-between text-[10px]">
      <span>Por tela/mês:</span>
      <span className="font-medium">
        {formatCurrency(totalPanels > 0 ? fidelMonthly / totalPanels : 0)}
      </span>
    </div>
    
    <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
      <span className="font-medium">Total:</span>
      <span className="font-bold">{formatCurrency(fidelTotal)}</span>
    </div>
  </div>

  {/* PIX À Vista - mesma estrutura */}
  <div className="p-2 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-200 space-y-1">
    <div className="text-[10px] font-medium text-green-600 uppercase flex items-center gap-1 mb-1">
      PIX À Vista
      <span className="bg-green-100 text-green-700 text-[8px] px-1 rounded">-{discountPercent}%</span>
      {quantidadePosicoes > 1 && (
        <span className="text-[8px] px-1 py-0.5 bg-green-100 text-green-700 rounded">
          {quantidadePosicoes}x pos.
        </span>
      )}
    </div>
    
    {/* Por local/mês - TOTAL com todas as posições */}
    <div className="flex justify-between text-[10px]">
      <span>Por local/mês:</span>
      <span className="font-medium text-green-600">
        {formatCurrency(
          (vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) > 0 && durationMonths > 0 
          ? (cashTotal / durationMonths) / (vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) 
          : 0
        )}
      </span>
    </div>
    
    {/* Por posição/mês - valor unitário (só aparece com 2+ posições) */}
    {quantidadePosicoes > 1 && (
      <div className="flex justify-between text-[10px] text-green-600/70">
        <span className="italic text-[9px]">↳ cada posição:</span>
        <span className="italic text-[9px]">
          {formatCurrency(
            (vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) > 0 && durationMonths > 0 
            ? ((cashTotal / durationMonths) / quantidadePosicoes) / (vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) 
            : 0
          )}
        </span>
      </div>
    )}
    
    <div className="flex justify-between text-[10px]">
      <span>Por tela/mês:</span>
      <span className="font-medium text-green-600">
        {formatCurrency(totalPanels > 0 && durationMonths > 0 ? (cashTotal / durationMonths) / totalPanels : 0)}
      </span>
    </div>
    
    <div className="flex justify-between text-xs pt-1 border-t border-green-100">
      <span className="font-medium">Total:</span>
      <span className="font-bold text-green-600">{formatCurrency(cashTotal)}</span>
    </div>
  </div>
</div>
```

### Import adicional

Adicionar `Layers` aos imports do lucide-react.

---

## Resultado Esperado

### Com 1 posição:
```
Fidelidade (12x)
Por local/mês: R$ 78,90
Por tela/mês: R$ 15,78
Total: R$ 47.340,00
```

### Com 2 posições:
```
Fidelidade (12x) [2x pos.]

[Banner: Valores calculados para 2 posições por local]

Por local/mês: R$ 157,80      ← DOBROU!
  ↳ cada posição: R$ 78,90    ← Valor unitário para referência
Por tela/mês: R$ 31,56        ← DOBROU!
Total: R$ 94.680,00           ← DOBROU!
```

Agora fica **completamente claro** que os valores são para 2 posições!
