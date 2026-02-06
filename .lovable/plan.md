
# Correção: Valor de Quantidade de Posições Sendo Resetado na Edição

## Problema Identificado

O valor de `quantidade_posicoes` que você salvou (ex: 2) está sendo **sobrescrito para 1** por um `useEffect` que roda durante o carregamento.

### Fluxo do Bug

```
1. Usuário clica em "Editar Proposta"
2. Linha 625: setQuantidadePosicoes(2) ← Valor correto do banco
3. Linha 873-876: useEffect detecta que quantidadePosicoes (2) > maxPosicoes
4. Se maxPosicoes for calculado como 1 (baseado em disponibilidade real dos prédios)
5. setQuantidadePosicoes(1) ← VALOR RESETADO INCORRETAMENTE!
```

### Código Problemático (Linha 873-876)

```typescript
React.useEffect(() => {
  if (quantidadePosicoes > maxPosicoes) {
    setQuantidadePosicoes(Math.max(1, maxPosicoes));  // ← PROBLEMA!
  }
}, [maxPosicoes, quantidadePosicoes]);
```

Este `useEffect` foi criado para **novas propostas** (evitar selecionar mais posições do que disponível), mas está **afetando a edição** também, resetando valores já salvos.

---

## Solução

### Modificação 1: Proteger o valor salvo durante edição

Adicionar uma **guarda de modo edição** que impede o reset automático quando estamos editando uma proposta existente:

```typescript
// Resetar quantidade de posições se exceder o máximo disponível
// MAS APENAS para novas propostas, não durante edição
React.useEffect(() => {
  // NÃO resetar se estamos em modo edição - respeitar valor salvo no banco
  if (isEditMode) return;
  
  if (quantidadePosicoes > maxPosicoes) {
    setQuantidadePosicoes(Math.max(1, maxPosicoes));
  }
}, [maxPosicoes, quantidadePosicoes, isEditMode]);
```

### Modificação 2: Mostrar aviso se o valor salvo excede o disponível

Se a proposta foi salva com 2 posições mas agora só há 1 disponível, mostrar um **alerta visual** ao invés de resetar silenciosamente:

```typescript
// Na seção do slider de posições
{isEditMode && quantidadePosicoes > maxPosicoes && (
  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
    <div className="flex items-center gap-2 text-amber-700 text-sm">
      <AlertTriangle className="h-4 w-4" />
      <span>
        A proposta foi salva com <strong>{quantidadePosicoes} posições</strong>, 
        mas agora só há <strong>{maxPosicoes}</strong> disponível(is). 
        Ajuste se necessário.
      </span>
    </div>
  </div>
)}
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Adicionar guarda `isEditMode` no useEffect de reset |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Adicionar alerta visual para conflito de disponibilidade |

---

## Resultado Esperado

1. **Antes**: Editar proposta com 2 posições → slider mostra 1 (bug)
2. **Depois**: Editar proposta com 2 posições → slider mostra 2 (correto)
3. Se disponibilidade real mudou, usuário vê um aviso e pode ajustar manualmente

---

## Código Específico

### Linha 873-876 - Atualizar useEffect

**De:**
```typescript
React.useEffect(() => {
  if (quantidadePosicoes > maxPosicoes) {
    setQuantidadePosicoes(Math.max(1, maxPosicoes));
  }
}, [maxPosicoes, quantidadePosicoes]);
```

**Para:**
```typescript
// Resetar quantidade de posições se exceder o máximo disponível
// APENAS para novas propostas - em modo edição, preservar valor salvo
React.useEffect(() => {
  // Não resetar automaticamente em modo edição - respeitar valor do banco
  // O usuário verá um aviso e pode ajustar manualmente se necessário
  if (isEditMode) {
    console.log('🛡️ Modo edição: preservando quantidade_posicoes =', quantidadePosicoes);
    return;
  }
  
  if (quantidadePosicoes > maxPosicoes) {
    console.log('📉 Ajustando posições de', quantidadePosicoes, 'para', maxPosicoes);
    setQuantidadePosicoes(Math.max(1, maxPosicoes));
  }
}, [maxPosicoes, quantidadePosicoes, isEditMode]);
```

### Linha ~2580 - Adicionar alerta de conflito (após o slider)

```tsx
{/* Alerta se valor salvo excede disponibilidade atual */}
{isEditMode && quantidadePosicoes > maxPosicoes && (
  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
    <div className="flex items-start gap-2 text-amber-700">
      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-medium">Atenção: Disponibilidade alterada</p>
        <p className="mt-1">
          Esta proposta foi salva com <strong>{quantidadePosicoes} posições</strong>, 
          mas atualmente só há <strong>{maxPosicoes}</strong> disponível(is) nos prédios selecionados.
        </p>
        <button 
          type="button"
          onClick={() => setQuantidadePosicoes(Math.max(1, maxPosicoes))}
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          Ajustar para {maxPosicoes} posição(ões)
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Resumo Técnico

| Componente | Problema | Solução |
|------------|----------|---------|
| `useEffect` reset | Reseta valor mesmo em edição | Adicionar `if (isEditMode) return;` |
| UI | Usuário não sabe que valor foi alterado | Adicionar alerta visual |
| UX | Perda silenciosa de dados | Preservar + informar conflito |
