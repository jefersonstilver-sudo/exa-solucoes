
# Corrigir Favicon EXA + Meta Tags Dinamicas nas Propostas

## Problemas

1. **Favicon mostrando Lovable**: O arquivo `public/favicon.png` esta com o icone do Lovable em vez da EXA. Ja existe o icone correto em `public/icons/exa-icon-original.png`.
2. **Link sem dados do cliente**: Ao compartilhar no WhatsApp, aparece titulo generico. Precisa mostrar o nome da empresa do cliente.
3. **OG Image generica**: A imagem de preview do link nao identifica a EXA profissionalmente.
4. **theme-color incorreto**: O `index.html` usa `#FF4430` em vez do vermelho oficial `#9C1E1E`.

## Solucao

### 1. Substituir Favicon (`public/favicon.png`)

Copiar `public/icons/exa-icon-original.png` para `public/favicon.png`, substituindo o icone corrompido do Lovable. Tambem copiar para `public/apple-touch-icon.png` para consistencia em dispositivos Apple.

### 2. Corrigir `index.html`

- Atualizar `theme-color` de `#FF4430` para `#9C1E1E` (vermelho oficial EXA)
- Garantir que todos os favicons apontam para o arquivo correto
- Manter o og:image padrao apontando para `https://examidia.com.br/og-image.jpg`

### 3. Adicionar Helmet dinamico em `PropostaPublicaPage.tsx`

Importar `Helmet` de `react-helmet-async` e inserir no JSX da pagina publica, logo apos o carregamento da proposta:

```tsx
import { Helmet } from 'react-helmet-async';

// Dentro do return, antes do header:
<Helmet>
  <title>
    {proposal.client_company_name || proposal.client_name} | Proposta Comercial EXA
  </title>
  <meta name="description" content={`Proposta comercial de publicidade inteligente em elevadores para ${proposal.client_company_name || proposal.client_name}. ${proposal.total_panels} telas em ${proposal.selected_buildings?.length || 0} predios.`} />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <meta property="og:title" content={`${proposal.client_company_name || proposal.client_name} | Proposta EXA`} />
  <meta property="og:description" content={`Proposta comercial de publicidade inteligente em elevadores para ${proposal.client_company_name || proposal.client_name}`} />
  <meta property="og:image" content="https://examidia.com.br/og-image.jpg?v=2" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="EXA Publicidade Inteligente" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={`${proposal.client_company_name || proposal.client_name} | Proposta EXA`} />
  <meta name="twitter:image" content="https://examidia.com.br/og-image.jpg?v=2" />
</Helmet>
```

Isso garante que:
- A aba do navegador mostra "Nome da Empresa | Proposta Comercial EXA"
- O favicon na aba e o da EXA
- As meta tags OG sao atualizadas para o titulo da empresa

**Nota sobre WhatsApp/redes sociais**: Como o app e SPA (client-side rendering), crawlers como o WhatsApp leem o HTML estatico do `index.html` antes do React carregar. O Helmet corrige o titulo da aba e meta tags apos o carregamento. Para preview perfeito no WhatsApp com nome do cliente, seria necessario uma edge function de pre-rendering (escopo futuro). Mas o favicon e titulo da aba ficam corretos imediatamente.

### 4. Atualizar `site.webmanifest`

Confirmar que todos os icones do manifesto PWA apontam para icones da EXA (ja estao corretos).

## Arquivos modificados

1. `public/favicon.png` -- copiar de `public/icons/exa-icon-original.png`
2. `public/apple-touch-icon.png` -- copiar de `public/icons/exa-icon-original.png`
3. `index.html` -- corrigir theme-color para `#9C1E1E`
4. `src/pages/public/PropostaPublicaPage.tsx` -- adicionar `<Helmet>` com titulo dinamico do cliente e meta tags OG completas
