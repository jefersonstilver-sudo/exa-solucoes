

# Fix: remover colunas inexistentes do submit

## Causa
`src/utils/submitFormulario.ts` envia `elevadores_sociais` e `elevadores_servico` no INSERT, mas essas colunas não existem na tabela `sindicos_interessados`. A coluna correta (`quantidade_elevadores_sociais`) já é preenchida acima no payload.

## Alteração única
**Arquivo**: `src/utils/submitFormulario.ts`

Remover do bloco "Legados" as 2 linhas:
```ts
elevadores_sociais: predio.elevadoresSociais,
elevadores_servico: 0,
```

Manter apenas os legados confirmados no schema:
- `nome_completo`
- `endereco`
- `numero_andares`
- `numero_unidades`
- `email`
- `celular`
- `status`

## Garantias
- Não toco em nenhum outro arquivo.
- Não altero UI, fluxo, schema, edge functions, RLS, ou qualquer outro comportamento.
- Apenas removo 2 linhas do payload de INSERT para resolver o erro `Could not find the 'elevadores_servico' column`.

## Resultado esperado
Submit do formulário em `/interessesindico/formulario` (Etapa 3) passa sem erro de schema cache, INSERT é aceito, triggers preenchem `protocolo`, edge function gera PDF e usuário é redirecionado para `/interessesindico/sucesso`.

