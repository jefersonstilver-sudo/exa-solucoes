

# Fix: alinhar nomes de colunas com o schema real

## Discrepâncias confirmadas

Após `SELECT ... FROM information_schema.columns WHERE table_name = 'sindicos_interessados'`, comparei com o payload e encontrei **exatamente 3 nomes de coluna divergentes**:

| Código (errado) | Schema real |
|---|---|
| `endereco_cep` | `cep` |
| `google_place_id` | `endereco_google_place_id` |
| `quantidade_unidades` | `quantidade_unidades_total` |

Todos os outros campos do payload estão corretos. Os legados (`nome_completo`, `endereco`, `numero_andares`, `numero_unidades`, `email`, `celular`, `status`) também conferem.

## Alterações

### 1. `src/utils/submitFormulario.ts` (3 linhas)
- linha 47: `endereco_cep:` → `cep:`
- linha 50: `google_place_id:` → `endereco_google_place_id:`
- linha 53: `quantidade_unidades:` → `quantidade_unidades_total:`

### 2. `supabase/functions/gerar-pdf-aceite-sindico/index.ts` (5 ocorrências)
- linha 499: `rec.endereco_cep` → `rec.cep`
- linha 504: `rec.quantidade_unidades` → `rec.quantidade_unidades_total`
- linha 687: `rec.endereco_cep` → `rec.cep`
- linha 693: `rec.quantidade_unidades` → `rec.quantidade_unidades_total`
- (não há referência a `rec.google_place_id` — não usada na renderização do PDF, ok)

## Validação

Após aplicar, rodarei o INSERT de teste em transação `BEGIN; ... ROLLBACK;` proposto pelo usuário e mostrarei o `RETURNING` confirmando id, protocolo, cep, endereco_logradouro e quantidade_unidades_total.

## Garantias

- Nenhuma coluna nova, nenhum trigger alterado, nenhuma mudança de UI/fluxo.
- Apenas renomeação de 3 chaves no payload TS e 4 ocorrências de leitura na edge function.
- Edge function será redepoiada automaticamente após o save.

