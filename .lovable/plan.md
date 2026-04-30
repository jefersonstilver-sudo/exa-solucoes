Plano de correção focado exclusivamente no favicon.

Diagnóstico feito em modo leitura:
- Os 12 arquivos oficiais de favicon existem em `public/` no projeto.
- No domínio publicado, os 12 arquivos principais já retornam HTTP 200.
- O `index.html` atual já tem referências para os favicons novos, mas o bloco não está exatamente no formato solicitado e ainda há risco de cache.
- Encontrei duas referências internas antigas a `/favicon.png`:
  - `src/pages/public/PropostaPublicaPage.tsx`
  - `src/pages/public/BuildingDisplayCommercial.tsx`
- Embora `public/favicon.png` não exista mais no projeto, `https://www.examidia.com.br/favicon.png` ainda retorna 200 no domínio publicado, provavelmente por cache/artefato legado do deploy/CDN. Isso precisa ser neutralizado no próximo deploy.

Implementação proposta, sem mexer em UI, fluxo ou funcionalidade não relacionada:

1. Ajustar o bloco global de favicons no `index.html`
- Substituir o comentário `<!-- Favicons -->` por `<!-- Favicons EXA Mídia -->`.
- Garantir o bloco solicitado no `<head>` com as referências oficiais.
- Adicionar versão nos hrefs dos favicons, como defesa contra cache, mantendo o mesmo arquivo físico:
  - `/favicon.ico?v=2`
  - `/favicon-16x16.png?v=2`
  - `/favicon-32x32.png?v=2`
  - `/favicon-48x48.png?v=2`
  - `/favicon-96x96.png?v=2`
  - `/apple-touch-icon.png?v=2`
  - `/site.webmanifest?v=2`
  - `/safari-pinned-tab.svg?v=2`
  - `/browserconfig.xml?v=2`

2. Remover referências antigas a `/favicon.png`
- Em `PropostaPublicaPage.tsx`, trocar o favicon do Helmet de `/favicon.png` para o favicon oficial novo, preferencialmente `/favicon.ico?v=2` ou o conjunto mínimo correto.
- Em `BuildingDisplayCommercial.tsx`, trocar o ícone do manifest dinâmico de `/favicon.png` para `/android-chrome-512x512.png?v=2`.
- Não alterar layout, texto, fluxo, lógica comercial ou comportamento dessas páginas além do caminho do ícone.

3. Reforçar cache headers dos arquivos de favicon
- Atualizar `public/_headers` apenas para os caminhos de favicon/manifest, adicionando `Cache-Control: no-cache, must-revalidate` ou equivalente para:
  - `/favicon.ico`
  - `/favicon-16x16.png`
  - `/favicon-32x32.png`
  - `/favicon-48x48.png`
  - `/favicon-96x96.png`
  - `/apple-touch-icon.png`
  - `/android-chrome-192x192.png`
  - `/android-chrome-512x512.png`
  - `/mstile-150x150.png`
  - `/safari-pinned-tab.svg`
  - `/browserconfig.xml`
  - `/site.webmanifest`
- Manter o restante dos headers intacto.

4. Verificar ausência de arquivos antigos no projeto
- Confirmar que `public/favicon.png` e `public/og-image.jpg` continuam inexistentes.
- Não recriar esses arquivos.

5. Validações antes da resposta final
- Confirmar novamente, via acesso direto, HTTP 200 para os 12 arquivos oficiais no domínio publicado após deploy.
- Confirmar no código-fonte publicado que aparecem as referências novas com `?v=2` e não aparece `/favicon.png`.
- Verificar que não há referências remanescentes a `/favicon.png` no código-fonte do projeto, exceto se houver alguma ocorrência não relacionada em texto/documentação que eu comunicarei antes.
- Fazer captura/screenshot da página publicada após o deploy. Observação técnica: eu consigo capturar a página, mas a ferramenta de screenshot normalmente não mostra a moldura/aba nativa do navegador. Se a ferramenta de navegador disponível permitir capturar a aba com favicon, farei isso; se não permitir, vou informar a limitação e anexar a validação técnica dos assets/fontes/requisições.

Ponto importante sobre deploy:
- Em Lovable, alterações de frontend precisam ser publicadas pelo fluxo de Publish/Update para refletirem em `www.examidia.com.br`.
- Após aplicar as mudanças no código, será necessário publicar/update. Se houver ferramenta de publicação disponível no modo de implementação, usarei; se não houver, vou deixar claro que o publish/update precisa ser acionado no editor antes da validação final em produção.