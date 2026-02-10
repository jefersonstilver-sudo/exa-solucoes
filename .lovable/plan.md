

# Fix: Logos Nao Escalam -- Causa Raiz Real Encontrada

## Diagnostico Definitivo

O problema NAO e CSS. O CSS esta correto (`transform: scale(scaleFactor)` no div, sem conflitos).

O problema e que existem **DOIS hooks completamente separados** com estados independentes:

```text
LogosAdmin.tsx
  |-- useLogosAdmin() --> state A (recebe optimistic updates)
  |-- LogoTicker (preview)
        |-- useLogos() --> state B (NUNCA recebe os updates!)
```

Quando o slider muda a escala:
1. `handlePreviewScaleChange` chama `updateLogo` do `useLogosAdmin`
2. `useLogosAdmin` faz optimistic update no SEU state (state A)
3. Mas o `LogoTicker` usa `useLogos()` que tem seu PROPRIO state (state B)
4. State B so atualiza quando o real-time dispara e chama a Edge Function
5. Mas o `skipNextRealtime` no `useLogosAdmin` impede o refetch no admin...
6. ...enquanto o `useLogos` dentro do LogoTicker tem SEU PROPRIO real-time que chama `fetchLogos()` com `setLoading(true)` -- causando flicker

**Resultado**: O slider mexe, o banco atualiza, mas o ticker NUNCA recebe o novo valor de escala porque usa um hook diferente.

## Solucao

Passar os logos diretamente como prop para o `LogoTicker` quando usado no contexto admin. Assim o ticker usa os mesmos dados com optimistic updates.

### Arquivo 1: `src/components/exa/LogoTicker.tsx`

Adicionar prop opcional `logos` ao componente. Quando fornecida, usar esses logos ao inves de chamar `useLogos()`:

- Adicionar `logos?: Logo[]` na interface de props
- Usar logica condicional: se `logos` prop existe, usar ela; senao, usar o hook `useLogos()`
- Isso garante que no admin, o ticker ve os mesmos dados otimisticamente atualizados

### Arquivo 2: `src/components/admin/LogosAdmin.tsx`

Passar a prop `logos` (filtrada por `is_active`) para o `LogoTicker`:

```
<LogoTicker
  speed={60}
  contained={true}
  logos={logos.filter(l => l.is_active)}
  onLogoClick={...}
  selectedLogoId={selectedPreviewLogo}
/>
```

Isso faz com que quando `updateLogo` faz o optimistic update no state do `useLogosAdmin`, o `LogoTicker` receba imediatamente os novos valores (incluindo `scale_factor`), sem esperar real-time ou Edge Function.

### Arquivo 3: `src/hooks/useLogos.ts` (useLogos hook)

Remover o `setLoading(true)` do `fetchLogos` quando ja existem logos carregadas (refetch silencioso), para evitar flicker no ticker publico tambem:

- Mudar para: `if (logos.length === 0) setLoading(true);`
- Refetches subsequentes mantem as logos visiveis

## Arquivos Modificados

1. `src/components/exa/LogoTicker.tsx` -- aceitar prop `logos` opcional
2. `src/components/admin/LogosAdmin.tsx` -- passar logos filtradas como prop
3. `src/hooks/useLogos.ts` -- refetch silencioso (sem loading flicker)

Nenhuma outra funcionalidade sera alterada.

