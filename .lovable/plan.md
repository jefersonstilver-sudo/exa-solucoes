

# Plano: Cards Selecionáveis com Texto Explicativo Dinâmico

## Objetivo

Permitir que o cliente escolha entre **Valor Monetário** ou **Acordo de Permuta**, com um texto explicativo que muda automaticamente conforme a opção selecionada.

---

## Design Visual

```text
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│  ○ VALOR MONETÁRIO              │  │  ● ACORDO DE PERMUTA ✓          │
│  ────────────────────           │  │  ────────────────────           │
│  R$ 10.234,00/mês               │  │  18 meses                       │
│  Total: R$ 184.212,00           │  │  90x Tablet Android 24"         │
│                                 │  │                                 │
│  [Clique para selecionar]       │  │  [Selecionado]                  │
└─────────────────────────────────┘  └─────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  💡 TEXTO DINÂMICO CONFORME SELEÇÃO                                     │
│                                                                         │
│  SE PERMUTA SELECIONADO:                                               │
│  "Você fornece equipamentos/serviços para a EXA Mídia. Esta opção      │
│   pode sair mais barata para sua empresa ao comparar com produtos       │
│   a preço de custo em vez do valor de mercado."                        │
│                                                                         │
│  SE MONETÁRIO SELECIONADO:                                             │
│  "Você paga R$ X por mês, totalizando R$ Y em Z meses. Ideal para      │
│   quem prefere uma relação comercial tradicional e direta."            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Alterações Técnicas

### Arquivo: `src/components/public/proposal/PermutaChoiceCard.tsx`

#### 1. Adicionar estado de seleção

```tsx
import { useState } from 'react';

const [selectedOption, setSelectedOption] = useState<'monetario' | 'permuta'>('permuta');
```

#### 2. Tornar os cards clicáveis

**Card Monetário (linha 95):**
```tsx
<div 
  onClick={() => setSelectedOption('monetario')}
  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
    ${selectedOption === 'monetario' 
      ? 'border-[#9C1E1E] bg-gradient-to-br from-red-50 to-white shadow-lg' 
      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
    }`}
>
```

**Card Permuta (linha 126):**
```tsx
<div 
  onClick={() => setSelectedOption('permuta')}
  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
    ${selectedOption === 'permuta' 
      ? 'border-[#9C1E1E] bg-gradient-to-br from-red-50 to-white shadow-lg' 
      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
    }`}
>
```

#### 3. Badge e Checkmark dinâmicos

Mover o badge "ESCOLHIDO" e o checkmark para aparecer apenas no card selecionado:

```tsx
{selectedOption === 'monetario' && (
  <>
    <div className="absolute -top-2 left-3 bg-gradient-to-r from-[#9C1E1E] to-[#7D1818] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
      <Check className="h-2.5 w-2.5" />
      ESCOLHIDO
    </div>
    <div className="absolute -top-2 -right-2 p-1 bg-[#9C1E1E] rounded-full">
      <Check className="h-3 w-3 text-white" />
    </div>
  </>
)}
```

#### 4. Remover texto de "Economia" (linhas 156-161)

Apagar completamente o bloco:
```tsx
// REMOVER:
<div className="mt-3 pt-3 border-t border-[#9C1E1E]/10">
  <p className="text-[10px] text-[#7D1818] flex items-center gap-1 font-medium">
    <Gift className="h-3 w-3" />
    Economia: {formatCurrency(valorTotalMonetario)}
  </p>
</div>
```

#### 5. Texto explicativo dinâmico (substituir linhas 194-210)

```tsx
{/* Texto Explicativo Dinâmico */}
<div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
  <div className="flex items-start gap-2">
    <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
    <div className="text-[10px] sm:text-xs text-slate-600 space-y-1">
      {selectedOption === 'permuta' ? (
        <>
          <p>
            <strong className="text-slate-700">Você escolheu o Acordo de Permuta.</strong>
          </p>
          <p>
            Em vez de pagamento em dinheiro, você fornece {contrapartidaTexto.toLowerCase()} para a EXA Mídia.
          </p>
          <p>
            <strong className="text-[#9C1E1E]">Esta opção pode sair mais barata para sua empresa</strong> ao comparar com produtos a preço de custo em vez do valor de mercado de {formatCurrency(valorTotalMonetario)}.
          </p>
        </>
      ) : (
        <>
          <p>
            <strong className="text-slate-700">Você escolheu o Valor Monetário.</strong>
          </p>
          <p>
            O investimento é de <strong className="text-[#9C1E1E]">{formatCurrency(valorReferenciaMonetaria)}/mês</strong>, totalizando <strong className="text-[#9C1E1E]">{formatCurrency(valorTotalMonetario)}</strong> em {periodoTexto}.
          </p>
          <p>
            Ideal para quem prefere uma relação comercial tradicional e direta, com pagamento via boleto, PIX ou cartão.
          </p>
        </>
      )}
    </div>
  </div>
</div>
```

---

## Resultado

| Seleção | Texto Exibido |
|---------|---------------|
| **Permuta** | "Você fornece materiais para a EXA Mídia. Esta opção pode sair mais barata para sua empresa ao comparar com produtos a preço de custo..." |
| **Monetário** | "O investimento é de R$ X/mês, totalizando R$ Y. Ideal para quem prefere uma relação comercial tradicional..." |

---

## Checklist

- [ ] Adicionar `useState` para controlar seleção
- [ ] Tornar ambos os cards clicáveis com `onClick`
- [ ] Adicionar hover states (`hover:border-slate-300`, `hover:shadow-md`)
- [ ] Mover badge "ESCOLHIDO" dinamicamente para o card selecionado
- [ ] Remover texto fixo de "Economia"
- [ ] Implementar texto explicativo dinâmico baseado na seleção
- [ ] Testar interatividade em mobile

