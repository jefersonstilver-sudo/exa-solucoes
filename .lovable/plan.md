
# Correção: Tabela de Detalhamento Não Multiplica por Quantidade de Posições

## Problema Identificado

Na tabela de "Detalhamento por Local", os valores são exibidos SEM considerar `quantidadePosicoes`:

| Linha | Código Atual | Problema |
|-------|--------------|----------|
| 3198 | `const precoBase = (building as any).preco_base || 0;` | Não multiplica por posições |
| 3200 | `const precoPorTela = telas > 0 ? precoBase / telas : 0;` | Não multiplica por posições |

Enquanto isso, o `valorSugeridoMensal` (que alimenta `fidelValue`) **já multiplica** por `quantidadePosicoes` (linha 1102).

**Resultado:** A tabela de detalhamento mostra valores desatualizados, mas o total no resumo está correto.

---

## Solução Proposta

### Mudança 1: Multiplicar valores na tabela por `quantidadePosicoes`

Atualizar o cálculo na tabela para considerar a quantidade de posições:

```tsx
{selectedBuildingsData.map((building) => {
  const precoBasePorPosicao = (building as any).preco_base || 0;
  const precoBaseTotal = precoBasePorPosicao * quantidadePosicoes; // MULTIPLICAR!
  const telas = building.quantidade_telas || 1;
  const precoPorTela = telas > 0 ? precoBaseTotal / telas : 0;
  
  return (
    <div key={building.id} className="grid grid-cols-4 gap-2 p-2 text-[10px] bg-white">
      <span className="truncate">{building.nome}</span>
      <span className="text-center">{telas}</span>
      <span className="text-right font-medium">{formatCurrency(precoBaseTotal)}</span>
      <span className="text-right text-muted-foreground">{formatCurrency(precoPorTela)}</span>
    </div>
  );
})}
```

### Mudança 2: Adicionar indicador de posições no cabeçalho

Quando há múltiplas posições, adicionar um badge explicativo:

```tsx
<div className="flex items-center gap-2 mb-3">
  <Building2 className="h-4 w-4 text-slate-600" />
  <h3 className="font-semibold text-sm text-slate-800">Detalhamento por Local</h3>
  {quantidadePosicoes > 1 && (
    <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
      {quantidadePosicoes}x posições
    </span>
  )}
</div>
```

### Mudança 3: Atualizar cabeçalho da tabela

Quando há múltiplas posições, deixar claro que os valores já incluem a multiplicação:

```tsx
<div className="grid grid-cols-4 gap-2 p-2 bg-slate-100 text-[10px] font-medium text-slate-600">
  <span>Prédio</span>
  <span className="text-center">Telas</span>
  <span className="text-right">
    {quantidadePosicoes > 1 ? `R$/Local (${quantidadePosicoes}x)` : 'R$/Local'}
  </span>
  <span className="text-right">
    {quantidadePosicoes > 1 ? `R$/Tela (${quantidadePosicoes}x)` : 'R$/Tela'}
  </span>
</div>
```

### Mudança 4: Adicionar linha de subtotal com breakdown

Após a tabela de prédios, adicionar um resumo que mostra a matemática claramente:

```tsx
{quantidadePosicoes > 1 && (
  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="flex items-center gap-2 text-xs text-blue-700">
      <Info className="h-3 w-3" />
      <span>
        <strong>Cálculo:</strong> Soma dos locais × {quantidadePosicoes} posições = 
        <strong> {formatCurrency(selectedBuildingsData.reduce((sum, b) => sum + ((b as any).preco_base || 0), 0) * quantidadePosicoes)}/mês</strong>
      </span>
    </div>
  </div>
)}
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Multiplicar preços na tabela por `quantidadePosicoes` |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Adicionar badge de posições no título |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Atualizar cabeçalhos para indicar multiplicação |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Adicionar linha de subtotal explicativo |

---

## Código Específico

### Linhas 3183-3212 - Atualizar seção de detalhamento

```tsx
{/* Cabeçalho com indicador de posições */}
<div className="flex items-center gap-2 mb-3">
  <Building2 className="h-4 w-4 text-slate-600" />
  <h3 className="font-semibold text-sm text-slate-800">Detalhamento por Local</h3>
  {quantidadePosicoes > 1 && (
    <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
      {quantidadePosicoes}x posições
    </span>
  )}
</div>

{/* Tabela de Prédios */}
<div className="rounded-lg border border-slate-200 overflow-hidden mb-3">
  <div className="grid grid-cols-4 gap-2 p-2 bg-slate-100 text-[10px] font-medium text-slate-600">
    <span>Prédio</span>
    <span className="text-center">Telas</span>
    <span className="text-right">
      {quantidadePosicoes > 1 ? `R$/Local (${quantidadePosicoes}x)` : 'R$/Local'}
    </span>
    <span className="text-right">
      {quantidadePosicoes > 1 ? `R$/Tela (${quantidadePosicoes}x)` : 'R$/Tela'}
    </span>
  </div>
  <div className="divide-y divide-slate-100 max-h-24 overflow-y-auto">
    {selectedBuildingsData.map((building) => {
      const precoBasePorPosicao = (building as any).preco_base || 0;
      const precoBaseTotal = precoBasePorPosicao * quantidadePosicoes;
      const telas = building.quantidade_telas || 1;
      const precoPorTela = telas > 0 ? precoBaseTotal / telas : 0;
      
      return (
        <div key={building.id} className="grid grid-cols-4 gap-2 p-2 text-[10px] bg-white">
          <span className="truncate">{building.nome}</span>
          <span className="text-center">{telas}</span>
          <span className="text-right font-medium">{formatCurrency(precoBaseTotal)}</span>
          <span className="text-right text-muted-foreground">{formatCurrency(precoPorTela)}</span>
        </div>
      );
    })}
  </div>
</div>

{/* Linha explicativa do cálculo - aparece com 2+ posições */}
{quantidadePosicoes > 1 && (
  <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg mb-3">
    <div className="flex items-center gap-2 text-xs text-blue-700">
      <Info className="h-3 w-3 flex-shrink-0" />
      <span>
        <strong>Cálculo:</strong> Valor base × {quantidadePosicoes} posições = valores acima
      </span>
    </div>
  </div>
)}
```

---

## Resultado Esperado

### Com 1 posição:
| Prédio | Telas | R$/Local | R$/Tela |
|--------|-------|----------|---------|
| Bella Vita | 1 | R$ 189,00 | R$ 189,00 |
| Royal Legacy | 5 | R$ 275,00 | R$ 55,00 |

### Com 2 posições:
| Prédio | Telas | R$/Local (2x) | R$/Tela (2x) |
|--------|-------|---------------|--------------|
| Bella Vita | 1 | R$ 378,00 | R$ 378,00 |
| Royal Legacy | 5 | R$ 550,00 | R$ 110,00 |

+ Badge "2x posições" no título
+ Linha explicativa do cálculo
