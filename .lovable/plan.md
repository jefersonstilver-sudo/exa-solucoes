## Mudanças

### 1. `supabase/functions/catalogo-predios/index.ts`
- Status mantidos exatamente como hoje (`Ativo`, `Instalação`, `Instalação Internet`, `Interesse`) — nenhuma mudança no filtro.
- Adicionar suporte a `?nocache=1`: quando presente, responder com `Cache-Control: no-store` em vez de `public, max-age=600, s-maxage=600`.

### 2. `src/pages/embed/LogosTickerEmbed.tsx`
- Ler `bg` da query string (`?bg=07070c` ou `?bg=transparent`).
- Default: `#7D1818` (atual).
- `transparent` → fundo transparente do wrapper e do body.
- Hex sem `#` (3 ou 6 chars, validado por regex) → aplica `#<hex>`.

## Arquivos
- Editar: `supabase/functions/catalogo-predios/index.ts`
- Editar: `src/pages/embed/LogosTickerEmbed.tsx`

Nenhuma mudança em UI/funcionalidade existente.