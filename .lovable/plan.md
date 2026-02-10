

# Corrigir Flickering e Travamento ao Ajustar Escala de Logos

## Causa raiz

Cada movimento do slider dispara uma cadeia destrutiva:

1. `handlePreviewScaleChange` chama `updateLogo` que faz UPDATE no banco
2. `updateLogo` depois chama `fetchAllLogos()` -- refetch completo, `loading=true`
3. Real-time subscription do `useLogosAdmin` detecta a mudanca -- chama `fetchAllLogos()` de novo
4. `LogoTicker` usa `useLogos()` que tem seu PROPRIO real-time -- chama edge function de novo

Resultado: 3+ refetches por tick do slider, cada um setando `loading=true`, fazendo o ticker sumir e reaparecer.

## Solucao: Optimistic Updates + Debounce

### Arquivo 1: `src/hooks/useLogos.ts` -- updateLogo com optimistic update

No `updateLogo` do `useLogosAdmin`:
- Atualizar o state LOCAL imediatamente (sem refetch)
- Nao chamar `fetchAllLogos()` apos o update
- Remover o refetch automatico do real-time para updates de scale (usar flag `skipNextRealtime`)

Mudanca principal:
```
const updateLogo = async (id, updates) => {
  // 1. Optimistic: atualizar state local imediatamente
  setLogos(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  
  // 2. DB update (sem refetch depois)
  const { error } = await supabase.from('logos').update(updates).eq('id', id);
  
  // 3. Se erro, reverter
  if (error) {
    fetchAllLogos(); // rollback
    throw error;
  }
}
```

Para o real-time, adicionar um `useRef` que ignora o proximo evento se foi disparado pelo proprio usuario (para evitar o refetch duplicado durante ajuste de escala).

### Arquivo 2: `src/components/admin/LogosAdmin.tsx` -- Debounce no slider

O slider `onValueChange` dispara a cada pixel. Precisamos:
- Usar state LOCAL para o valor do slider (atualiza instantaneamente na UI)
- Debounce o update real para o banco (so salva apos 300ms sem movimento)
- Mostrar o valor em tempo real no badge sem esperar o banco

Mudancas:
- Adicionar `localScale` state e `debounceTimer` ref
- Slider controla `localScale` (instantaneo)
- `useEffect` com debounce de 300ms envia para o banco
- Badge mostra `localScale` em vez de `selectedLogo.scale_factor`

### Arquivo 3: `src/components/exa/LogoTicker.tsx` -- Nao piscar no refetch

O `LogoTicker` usa `useLogos()` que seta `loading=true` no refetch, fazendo o ticker sumir. Precisamos:
- So mostrar loading na PRIMEIRA carga (quando `logos` esta vazio)
- Refetches subsequentes mantem as logos anteriores visiveis

Mudanca: trocar `if (loading)` por `if (loading && logos.length === 0)` para so mostrar skeleton na primeira vez.

## Arquivos modificados

1. `src/hooks/useLogos.ts` -- optimistic update no `updateLogo`, skip realtime duplicado
2. `src/components/admin/LogosAdmin.tsx` -- debounce no slider, state local para escala
3. `src/components/exa/LogoTicker.tsx` -- nao esconder logos durante refetch

Nenhuma outra funcionalidade sera alterada.

