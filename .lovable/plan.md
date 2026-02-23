
# Corrigir Exibicao de Logo Original + Background do Card

## Problemas Identificados

1. **Card "Original" no modal** mostra fundo xadrez (checkered) em vez do gradiente vermelho, tornando a visualizacao inconsistente com os outros cards
2. **Proposta publica sempre aplica `brightness-0 invert`** na logo, mesmo quando o usuario escolheu "Original" -- isso transforma a logo colorida em silhueta branca

## Causa Raiz

- No `PropostaPublicaPage.tsx` (linha 1840), o filtro `brightness-0 invert` e aplicado incondicionalmente: `className="w-full h-full object-contain filter brightness-0 invert"`
- Nao existe nenhum campo ou mecanismo para saber qual variante o usuario escolheu no modal
- O card Original usa checkered pattern em vez do gradiente vermelho

## Solucao

### 1. Card Original com fundo vermelho (ClientLogoUploadModal.tsx)

Trocar o fundo checkered do card "Original" pelo mesmo gradiente vermelho dos outros cards (`from-[#4a0f0f] via-[#6B1515] to-[#7D1818]`). Assim os 3 cards ficam visualmente consistentes e o usuario ve como a logo ficara no contexto real.

### 2. Convencao de URL para variante (ClientLogoUploadModal.tsx)

Quando o usuario seleciona "Original", o `handleConfirm` salvara a URL com um fragmento `#original` no final. Quando seleciona "CSS" ou "IA", a URL e salva normalmente (sem fragmento). Isso nao afeta o download da imagem (fragments nao sao enviados ao servidor).

### 3. Exibicao condicional do filtro (PropostaPublicaPage.tsx)

Na proposta publica, verificar se `client_logo_url` termina com `#original`. Se sim, exibir SEM filtro `brightness-0 invert`. Se nao, aplicar o filtro normalmente.

### 4. Mesma logica no ClientLogoPreview.tsx

No preview do admin, aplicar a mesma logica condicional para consistencia.

## Arquivos Alterados

- `src/components/admin/proposals/ClientLogoUploadModal.tsx` -- fundo vermelho no card Original + append `#original` na URL
- `src/pages/public/PropostaPublicaPage.tsx` -- condicional no filtro CSS
- `src/components/admin/proposals/ClientLogoPreview.tsx` -- condicional no filtro CSS

## Detalhes Tecnicos

**ClientLogoUploadModal.tsx:**
- Card 1: trocar `style={{ backgroundImage: 'repeating-conic-gradient(...)' }}` por `className="bg-gradient-to-r from-[#4a0f0f] via-[#6B1515] to-[#7D1818]"`
- No `handleConfirm`, quando `selectedVariant === 'original'`: `finalUrl = originalUrl.split('?')[0] + '#original'`

**PropostaPublicaPage.tsx (linha ~1840):**
```
const isOriginalLogo = proposal.client_logo_url?.includes('#original');
// className condicional: sem filtro se original, com filtro caso contrario
```

**ClientLogoPreview.tsx (linha ~99):**
- Mesma verificacao: se URL contem `#original`, nao aplicar `brightness-0 invert`
