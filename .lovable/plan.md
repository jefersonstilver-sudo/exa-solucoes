

# Sincronização Automática de Valores + Explicação de Vantagens de Múltiplas Posições

## 🔍 Problema Identificado

### Problema 1: Valores Não Atualizam Automaticamente

Quando você muda de 1 para 2 posições:
- ✅ `valorSugeridoMensal` é recalculado corretamente (dobra)
- ❌ `fidelValue` (campo do input) **permanece com o valor antigo**
- ❌ O resumo de valores mostra valor desatualizado

**Motivo:** O campo `fidelValue` só é atualizado quando o usuário clica manualmente em "Usar sugerido".

### Problema 2: Falta Explicação das Vantagens

Não existe nenhum bloco explicando para o cliente:
- Por que múltiplas posições são vantajosas
- Comparação Horizontal vs Vertical (Horizontal = ocupação parcial, pode ter mais marcas)
- Percentual de vantagem sobre concorrentes

---

## ✅ Solução Proposta

### Mudança 1: Auto-Sincronização do Valor de Fidelidade

Criar um `useEffect` que atualiza automaticamente o `fidelValue` quando:
- `quantidadePosicoes` muda
- `valorSugeridoMensal` muda
- Usuário **não editou manualmente** o campo

```typescript
// Novo estado para rastrear edição manual
const [fidelValueManuallyEdited, setFidelValueManuallyEdited] = useState(false);

// Auto-sync quando posições ou prédios mudam
useEffect(() => {
  // Não sincronizar se:
  // 1. Em modo edição (já carregou valor do banco)
  // 2. Usuário editou manualmente
  // 3. É permuta
  if (isEditMode && dataLoaded) return;
  if (fidelValueManuallyEdited) return;
  if (modalidadeProposta === 'permuta') return;
  
  if (valorSugeridoMensal > 0) {
    setFidelValue(valorSugeridoMensal.toFixed(2));
  }
}, [valorSugeridoMensal, fidelValueManuallyEdited, modalidadeProposta]);
```

### Mudança 2: Bloco de Vantagens de Múltiplas Posições

Quando `quantidadePosicoes > 1`, exibir um card explicativo com:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏆 VANTAGEM COMPETITIVA: 2 Posições                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📊 HORIZONTAL vs VERTICAL                                       │
│                                                                 │
│ ┌────────────────────┐  ┌────────────────────┐                  │
│ │   HORIZONTAL       │  │   VERTICAL         │                  │
│ │   Você escolheu ✓  │  │   Ocupação total   │                  │
│ │                    │  │                    │                  │
│ │ • 15 marcas por    │  │ • Apenas 3 marcas  │                  │
│ │   painel           │  │   por painel       │                  │
│ │ • Custo/exibição   │  │ • Custo/exibição   │                  │
│ │   menor            │  │   5x maior         │                  │
│ │ • Ideal para       │  │ • Para marcas de   │                  │
│ │   múltiplas marcas │  │   luxo exclusivo   │                  │
│ └────────────────────┘  └────────────────────┘                  │
│                                                                 │
│ 🎯 COM 2 POSIÇÕES VOCÊ GANHA:                                   │
│                                                                 │
│ • +100% de exibições (2x mais que 1 posição)                    │
│ • +400% de vantagem sobre Vertical Premium                      │
│ • Memorização 2x mais forte na mente dos moradores              │
│ • Possibilidade de intercalar 8 vídeos diferentes               │
│                                                                 │
│ 💡 Se um concorrente comprar 1 posição horizontal,              │
│    você terá 2x mais presença no mesmo prédio!                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Mudança 3: Alerta de Valor Desincronizado

Se o usuário editou manualmente e o valor difere do sugerido, mostrar aviso:

```tsx
{fidelValueManuallyEdited && valorSugeridoMensal > 0 && 
 Math.abs(parseFloat(fidelValue || '0') - valorSugeridoMensal) > 1 && (
  <div className="flex items-center gap-2 p-2 mt-1 bg-amber-50 border border-amber-200 rounded">
    <AlertTriangle className="h-4 w-4 text-amber-600" />
    <span className="text-xs text-amber-700">
      Valor difere do sugerido (R$ {valorSugeridoMensal.toFixed(2)})
    </span>
    <button onClick={() => {
      setFidelValue(valorSugeridoMensal.toFixed(2));
      setFidelValueManuallyEdited(false);
    }} className="text-xs text-primary hover:underline ml-auto">
      Sincronizar
    </button>
  </div>
)}
```

---

## 📋 Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | 1. Adicionar estado `fidelValueManuallyEdited` |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | 2. Adicionar useEffect de auto-sync |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | 3. Atualizar input para marcar edição manual |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | 4. Adicionar alerta de dessincronização |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | 5. Adicionar card de vantagens competitivas |

---

## 📝 Código Específico

### Passo 1: Novo estado (após linha 158)

```tsx
const [fidelValueManuallyEdited, setFidelValueManuallyEdited] = useState(false);
```

### Passo 2: useEffect de auto-sync (após linha 1112)

```tsx
// Auto-sincronizar fidelValue com valor sugerido quando não está em edição manual
useEffect(() => {
  // Condições para NÃO atualizar automaticamente:
  if (isEditMode && dataLoaded) return; // Em edição, manter valor do banco
  if (fidelValueManuallyEdited) return; // Usuário editou manualmente
  if (modalidadeProposta === 'permuta') return; // Permuta não usa fidelValue
  if (isCustomPayment) return; // Pagamento customizado usa outra lógica
  
  if (valorSugeridoMensal > 0) {
    console.log('🔄 Auto-sync fidelValue:', valorSugeridoMensal);
    setFidelValue(valorSugeridoMensal.toFixed(2));
  }
}, [valorSugeridoMensal, fidelValueManuallyEdited, modalidadeProposta, isCustomPayment, isEditMode, dataLoaded]);
```

### Passo 3: Card de Vantagens Competitivas (após linha 2594)

```tsx
{/* Card de Vantagens Competitivas - Aparece com 2+ posições */}
{quantidadePosicoes > 1 && (
  <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
    <div className="flex items-center gap-2 mb-3">
      <Trophy className="h-5 w-5 text-green-600" />
      <h4 className="font-bold text-green-800">
        Vantagem Competitiva: {quantidadePosicoes} Posições
      </h4>
    </div>
    
    {/* Comparação Horizontal vs Vertical */}
    {tipoProduto === 'horizontal' && (
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-white rounded-lg border-2 border-primary/30">
          <div className="flex items-center gap-1 mb-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary">HORIZONTAL</span>
          </div>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• Até 15 marcas/painel</li>
            <li>• Menor custo/exibição</li>
            <li>• {quantidadePosicoes * (specifications?.horizontal.maxVideosPorPedido || 4)} vídeos simultâneos</li>
          </ul>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-xs font-medium text-gray-500">VERTICAL</span>
          <ul className="text-xs space-y-1 text-gray-400 mt-2">
            <li>• Máximo 3 marcas</li>
            <li>• Custo 5x maior</li>
            <li>• Apenas 1 vídeo</li>
          </ul>
        </div>
      </div>
    )}
    
    {/* Benefícios das Posições */}
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-green-600">📈</span>
        <span className="text-green-800">
          <strong>+{((quantidadePosicoes - 1) * 100)}%</strong> de exibições vs 1 posição
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-green-600">🧠</span>
        <span className="text-green-800">
          Memorização <strong>{quantidadePosicoes}x mais forte</strong> na mente dos moradores
        </span>
      </div>
      {tipoProduto === 'horizontal' && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-600">🎬</span>
          <span className="text-green-800">
            <strong>{quantidadePosicoes * (specifications?.horizontal.maxVideosPorPedido || 4)}</strong> vídeos diferentes em rotação automática
          </span>
        </div>
      )}
    </div>
    
    {/* Alerta de vantagem sobre concorrentes */}
    <div className="mt-3 p-2 bg-green-100 rounded-lg">
      <p className="text-xs text-green-700">
        💡 <strong>Vantagem sobre concorrentes:</strong> Se outro anunciante comprar 1 posição, 
        você terá <strong>{quantidadePosicoes}x mais presença</strong> no mesmo prédio!
      </p>
    </div>
  </div>
)}
```

### Passo 4: Atualizar Input (linha 2981)

```tsx
<Input 
  type="number" 
  placeholder="0,00" 
  value={fidelValue} 
  onChange={e => {
    setFidelValue(e.target.value);
    setFidelValueManuallyEdited(true); // Marcar como editado manualmente
  }} 
  className="pl-10 h-12 text-base" 
/>
```

### Passo 5: Alerta de Dessincronização (após input, ~linha 2983)

```tsx
{/* Alerta se valor editado manualmente difere do sugerido */}
{fidelValueManuallyEdited && valorSugeridoMensal > 0 && 
 Math.abs(parseFloat(fidelValue || '0') - valorSugeridoMensal) > 1 && (
  <div className="flex items-center gap-2 p-2 mt-1 bg-amber-50 border border-amber-200 rounded-lg">
    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
    <span className="text-xs text-amber-700">
      Valor difere do sugerido ({formatCurrency(valorSugeridoMensal)})
    </span>
    <button 
      type="button"
      onClick={() => {
        setFidelValue(valorSugeridoMensal.toFixed(2));
        setFidelValueManuallyEdited(false);
      }} 
      className="text-xs font-medium text-primary hover:underline ml-auto"
    >
      Sincronizar
    </button>
  </div>
)}
```

### Passo 6: Adicionar import Trophy (linha 4)

```tsx
import { Trophy } from 'lucide-react';
```

---

## ✨ Resultado Esperado

### Cenário: Nova Proposta
1. Seleciona prédios → `fidelValue` preenche automaticamente com R$ 1.676,80
2. Muda para 2 posições → `fidelValue` **atualiza automaticamente** para R$ 3.353,60
3. Card de vantagens aparece explicando os benefícios

### Cenário: Edição
1. Carrega proposta existente → Mantém valor salvo no banco
2. Se alterar posições → Mostra alerta para sincronizar

### Cenário: Edição Manual
1. Usuário digita valor diferente → Sistema respeita
2. Se mudar posições → Mostra alerta que valor está desatualizado
3. Botão "Sincronizar" recalcula

---

## 📊 Checklist de Validação

- [ ] Nova proposta: valor sincroniza ao mudar posições
- [ ] Edição: valor carrega do banco e não reseta
- [ ] Card de vantagens aparece com 2+ posições
- [ ] Comparação Horizontal vs Vertical é clara
- [ ] Percentuais de vantagem são exibidos
- [ ] Alerta de dessincronização funciona

