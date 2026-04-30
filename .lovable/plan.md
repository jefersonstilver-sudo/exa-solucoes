# Vaga de Videomaker — Nova Rota Pública

Adicionar a página de vaga (`HTML_Vaga_Premium.html`) como rota pública standalone em `/vagadevideomaker`, preservando 100% do design, scripts inline e responsividade originais.

## Arquivos a criar / editar

1. **`public/vaga-videomaker.html`** (novo)
   - Copiar o HTML enviado para a pasta `public/` (servido diretamente como asset estático pelo Vite/hosting Lovable).
   - Ajustes mínimos no arquivo:
     - Trocar os dois links da logo (topbar + footer) de `https://www.examidia.com.br` (com `target="_blank"`) para `/` (navegação interna, sem `target`).
     - Inserir no `<head>` o bloco completo de SEO solicitado: `<title>`, meta description/keywords/author/robots, Open Graph, Twitter Card, `<link rel="canonical">` e o `<script type="application/ld+json">` do Schema.org JobPosting.
   - Não tocamos no CSS, SVGs nem no JS do botão "Copiar e-mail".

2. **`src/pages/VagaVideomaker.tsx`** (novo)
   - Componente React mínimo que faz `window.location.replace('/vaga-videomaker.html')` no `useEffect`, garantindo que a rota client-side `/vagadevideomaker` entregue o HTML estático puro (sem React/Header/Footer global, sem reload visível para quem chega via link direto pois o servidor já serve o HTML diretamente — ver passo 3).
   - Renderiza apenas um `<div />` em branco como fallback enquanto redireciona.

3. **`src/App.tsx`** (editar)
   - Registrar a nova rota antes do catch-all de building slug (`/:buildingSlug/:buildingCode`), para evitar colisão:
     ```tsx
     <Route path="/vagadevideomaker" element={
       <Suspense fallback={<GlobalLoadingPage />}>
         {React.createElement(lazy(() => import('./pages/VagaVideomaker')))}
       </Suspense>
     } />
     ```

## Como o standalone funciona

- Acesso direto via `https://www.examidia.com.br/vagadevideomaker`:
  - O hosting Lovable serve o SPA (`index.html`) → React monta → rota casa → componente faz redirect imediato para `/vaga-videomaker.html` que é servido como arquivo estático puro (sem React, sem Header/Footer global, sem Layout).
- Acesso direto via `/vaga-videomaker.html`: serve o arquivo estático diretamente (mais rápido ainda).
- Resultado: página exibida em 100% da viewport, com seu próprio topbar/footer, fontes Google e JS do botão "Copiar e-mail" intactos.

## Critérios de aceite cobertos

- URL `/vagadevideomaker` funcional, pública, sem login.
- Sem header/footer global do site sobre o conteúdo (HTML estático puro).
- Logos do topbar/footer apontam para `/` sem `target="_blank"`.
- Meta tags SEO + Open Graph + Twitter + canonical + JSON-LD JobPosting no `<head>`.
- Botão "Copiar e-mail" funciona (JS inline preservado).
- Fontes Google Fonts carregam (links preservados).
- Mobile sem overflow horizontal (CSS original preservado).
- Nenhum UI/funcionalidade existente é alterado.
