

# Plano: Corrigir Contagem de Prédios na Proposta + Tela Branca

## Diagnóstico dos Prédios

Auditoria completa no banco de dados revelou a causa raiz:

```text
LOJA PÚBLICA (get_buildings_for_public_store):
  → WHERE status IN ('ativo', 'instalação', 'instalacao')
  → 11 ativos + 3 instalacao = 14 prédios ✅

SELETOR DA PROPOSTA (NovaPropostaPage.tsx linha 480):
  → .in('status', ['ativo', 'interno'])
  → 11 ativos + 3 internos = 14 prédios
  → MAS são os 14 ERRADOS! Inclui internos (0 telas) em vez de instalacao

PROPOSTA PÚBLICA (PropostaPublicaPage.tsx linha 1638):
  → Filtra: quantidade_telas > 0
  → 3 prédios internos têm 0 telas → são removidos
  → Resultado: apenas 11 prédios aparecem na proposta do cliente
```

Os 3 prédios `instalacao` (Bella Vita, Cheverny, Miró) que aparecem na loja **nunca entram na proposta** porque o seletor não os busca. Os 3 `interno` (COMERCIAL TABLET, ENTRADA, SALA REUNIÃO) entram no seletor mas são filtrados na proposta pública por terem 0 telas.

## Correção 1: Seletor de Prédios na Proposta

**Arquivo: `src/pages/admin/proposals/NovaPropostaPage.tsx` (linha 480)**

Alterar a query para incluir `instalacao` e `instalação`:
```
.in('status', ['ativo', 'interno', 'instalacao', 'instalação'])
```

Isso garantirá que os mesmos 14 prédios da loja estejam disponíveis + os internos para uso administrativo.

## Correção 2: Tela Branca

O preview está em branco sem erros no console — comportamento típico de problema transitório do dev server (503 proxy). Para mitigar:

**Arquivo: `src/main.tsx`**

O `clearTimeout(renderTimeout)` na linha 45 é chamado sincronamente após `ReactDOM.createRoot().render()`, mas o render do React é assíncrono. O timeout é limpo antes dos componentes montarem. Corrigir para limpar o timeout apenas quando o app realmente renderizar, movendo o `clearTimeout` para dentro do componente App via useEffect.

## Arquivos a Editar

1. `src/pages/admin/proposals/NovaPropostaPage.tsx` — adicionar `'instalacao', 'instalação'` à query de prédios
2. `src/main.tsx` — mover clearTimeout para garantir que o fallback funcione corretamente quando o render demora

