

# Correção: Valores do Resumo Não Multiplicam por Posições em Modo Edição

## Problema Identificado

Na imagem você mostra:
- **Tabela de Detalhamento**: Valores corretos (R$ 378,00 para 2x posições)
- **Resumo Fidelidade/PIX À Vista**: Valores SEM multiplicação (Por local/mês = R$ 157,80)

### Causa Raiz

O `useEffect` de auto-sync (linha 1118) bloqueia **qualquer** atualização em modo edição:

```typescript
useEffect(() => {
  if (isEditMode) return; // ← PROBLEMA: bloqueia mesmo quando usuário altera posições
  // ...
  setFidelValue(valorSugeridoMensal.toFixed(2));
}, [valorSugeridoMensal, ...]);
```

Quando você muda de 1 para 2 posições no slider:
- `valorSugeridoMensal` recalcula corretamente (dobra)
- Mas `fidelValue` **não atualiza** porque `isEditMode = true`
- O resumo usa `fidelMonthly = parseFloat(fidelValue)` que continua com valor antigo

---

## Solução

### Mudança 1: Criar estado para rastrear mudança de posições pelo usuário

Adicionar um estado `posicoesChangedByUser` que detecta quando o usuário alterou manualmente a quantidade de posições após o carregamento inicial.

```typescript
const [posicoesChangedByUser, setPosicoesChangedByUser] = useState(false);
```

### Mudança 2: Marcar quando usuário altera posições

No slider de posições, marcar que foi alterado pelo usuário:

```typescript
<Slider
  value={[quantidadePosicoes]}
  onValueChange={(v) => {
    setQuantidadePosicoes(v[0]);
    // Se já carregou os dados e está alterando, marcar como mudança do usuário
    if (isEditMode && dataLoaded) {
      setPosicoesChangedByUser(true);
    }
  }}
  ...
/>
```

### Mudança 3: Permitir auto-sync quando usuário altera posições

Atualizar o `useEffect` para permitir recálculo quando posições mudam:

```typescript
useEffect(() => {
  // Em modo edição, só bloquear se:
  // 1. Dados ainda não carregaram completamente, OU
  // 2. Usuário NÃO alterou posições (manter valor do banco)
  if (isEditMode && !posicoesChangedByUser) return;
  
  if (fidelValueManuallyEdited) return;
  if (modalidadeProposta === 'permuta') return;
  if (isCustomPayment) return;
  
  if (valorSugeridoMensal > 0) {
    console.log('🔄 Auto-sync fidelValue (posições alteradas pelo usuário):', valorSugeridoMensal);
    setFidelValue(valorSugeridoMensal.toFixed(2));
  }
}, [valorSugeridoMensal, fidelValueManuallyEdited, modalidadeProposta, isCustomPayment, isEditMode, posicoesChangedByUser]);
```

### Mudança 4: Resetar flag quando carregar nova proposta

No useEffect de reset de estado (linha 502):

```typescript
useEffect(() => {
  if (editProposalId) {
    setDataLoaded(false);
    setPosicoesChangedByUser(false); // Resetar flag
    // ...
  }
}, [editProposalId]);
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Adicionar estado `posicoesChangedByUser` |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Atualizar `onValueChange` do Slider |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Atualizar lógica do useEffect de auto-sync |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Resetar flag no useEffect de reset |

---

## Código Específico

### Passo 1: Novo estado (após linha 188)

```typescript
// Estado para rastrear se usuário alterou posições após carregar proposta
const [posicoesChangedByUser, setPosicoesChangedByUser] = useState(false);
```

### Passo 2: Atualizar Slider (linha 2582)

```typescript
<Slider
  value={[quantidadePosicoes]}
  onValueChange={(v) => {
    setQuantidadePosicoes(v[0]);
    // Se em modo edição e dados já carregaram, marcar como mudança do usuário
    if (isEditMode && dataLoaded) {
      setPosicoesChangedByUser(true);
    }
  }}
  min={1}
  max={tipoProduto === 'horizontal' ? maxPosicoes : Math.min(3, maxPosicoes)}
  step={1}
  className="flex-1"
/>
```

### Passo 3: Atualizar useEffect de auto-sync (linha 1115-1127)

```typescript
// Auto-sincronizar fidelValue com valor sugerido
useEffect(() => {
  // Em modo edição:
  // - Bloquear se dados ainda não carregaram
  // - Bloquear se usuário NÃO alterou posições (preservar valor do banco)
  // - PERMITIR se usuário ALTEROU posições manualmente
  if (isEditMode && !posicoesChangedByUser) {
    console.log('🛡️ Modo edição: preservando fidelValue do banco (posições não alteradas)');
    return;
  }
  
  if (fidelValueManuallyEdited) return;
  if (modalidadeProposta === 'permuta') return;
  if (isCustomPayment) return;
  
  if (valorSugeridoMensal > 0) {
    console.log('🔄 Auto-sync fidelValue:', valorSugeridoMensal, 
      isEditMode ? '(posições alteradas pelo usuário)' : '(nova proposta)');
    setFidelValue(valorSugeridoMensal.toFixed(2));
  }
}, [valorSugeridoMensal, fidelValueManuallyEdited, modalidadeProposta, isCustomPayment, isEditMode, posicoesChangedByUser]);
```

### Passo 4: Resetar flag no useEffect de reset (linha 506)

```typescript
useEffect(() => {
  if (editProposalId) {
    console.log('🔄 Reset de estado para nova edição:', editProposalId);
    setDataLoaded(false);
    setPosicoesChangedByUser(false); // Resetar flag de posições
    // ... resto do código
  }
}, [editProposalId]);
```

---

## Resultado Esperado

### Cenário: Editar proposta com 1 posição → Mudar para 2

**ANTES (bug):**
1. Carrega proposta: fidelValue = R$ 3.945,00 (1 posição)
2. Muda slider para 2 posições
3. fidelValue continua R$ 3.945,00 ❌
4. Resumo mostra valores sem multiplicação ❌

**DEPOIS (corrigido):**
1. Carrega proposta: fidelValue = R$ 3.945,00 (1 posição)
2. Muda slider para 2 posições
3. fidelValue atualiza para R$ 7.890,00 ✅
4. Resumo mostra valores multiplicados ✅
5. Por local/mês = R$ 7.890,00 / 50 prédios = R$ 157,80 (correto para 2x posições)

---

## Fluxo de Dados Corrigido

```
Usuário altera posições (2x)
       ↓
setQuantidadePosicoes(2)
setPosicoesChangedByUser(true)  ← NOVO
       ↓
valorSugeridoMensal recalcula (dobra)
       ↓
useEffect detecta:
  - isEditMode? SIM
  - posicoesChangedByUser? SIM → PERMITE atualização
       ↓
setFidelValue(valorSugeridoMensal)  ← AGORA FUNCIONA
       ↓
fidelMonthly = parseFloat(fidelValue) → Valor correto
       ↓
Resumo exibe valores multiplicados ✅
```

