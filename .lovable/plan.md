

# Fix: Logos no Site e Propostas Nao Refletem Escala Ajustada

## Causa Raiz

A Edge Function `logos/index.ts` (linha 40) NAO inclui `scale_factor` no SELECT da query do banco:

```
.select('id, name, file_url, link_url, is_active, sort_order, storage_bucket, storage_key, color_variant')
```

O campo `scale_factor` simplesmente nao e retornado pela API. Entao no site publico e propostas, `logo.scale_factor` e sempre `undefined`, e o `TickerLogoItem` usa o default `1` -- ignorando completamente o ajuste feito no admin.

Alem disso, a `<img>` tem limites CSS fixos (`max-h-12 md:max-h-16 max-w-28 md:max-w-40`) que impedem logos maiores de expandir visualmente mesmo com `transform: scale()`.

## Solucao (3 arquivos)

### Arquivo 1: `supabase/functions/logos/index.ts`

Adicionar `scale_factor` no SELECT da query (linha 40):

```sql
.select('id, name, file_url, link_url, is_active, sort_order, storage_bucket, storage_key, color_variant, scale_factor')
```

E incluir `scale_factor` em TODOS os objetos de retorno das logos processadas (linhas 80-143), para que o valor chegue ao frontend.

### Arquivo 2: `src/components/exa/TickerLogoItem.tsx`

Remover os limites CSS fixos de max-height e max-width da `<img>`, e usar dimensoes base controladas pelo `scaleFactor` via inline style. Isso permite que logos com `scale_factor > 1` realmente aparecam maiores:

De:
```tsx
className="max-h-12 md:max-h-16 max-w-28 md:max-w-40 object-contain..."
```

Para: remover max-h/max-w do className e aplicar dimensoes dinamicas via style no container div, deixando a imagem expandir naturalmente dentro dele.

### Arquivo 3: `src/components/exa/LogoTicker.tsx`

Aumentar a altura do container do ticker para acomodar logos com scale_factor > 1:

De:
```
h-16 md:h-18 lg:h-20
```

Para:
```
h-20 md:h-24 lg:h-28
```

E adicionar `overflow-y-visible` para que logos maiores nao sejam cortadas.

## Resultado Esperado

- Logos no site principal e propostas publicas refletirao os tamanhos ajustados no admin
- O scale_factor salvo no banco sera retornado pela API e aplicado visualmente
- Sem alteracoes em nenhuma outra funcionalidade

## Arquivos Modificados

1. `supabase/functions/logos/index.ts` -- adicionar `scale_factor` no SELECT e nos objetos de retorno
2. `src/components/exa/TickerLogoItem.tsx` -- remover limites CSS fixos, usar dimensoes dinamicas
3. `src/components/exa/LogoTicker.tsx` -- aumentar altura do container do ticker

