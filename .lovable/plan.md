## Diagnóstico — por que os vídeos "voltaram para o antigo"

Os vídeos da home EXA têm **duas fontes de verdade**, com prioridade:

```text
overrideUrl (banco: configuracoes_sindico) > primaryUrl (hardcoded) > fallbackUrl
```

Arquivo: `src/components/exa/home/HeroSection.tsx`
- Desktop (vertical): `overrideUrl = videoUrl` (campo `video_homepage_url`)
- Mobile  (horizontal): `overrideUrl = horizontalVideoUrl` (campo `video_homepage_horizontal_url`)

Hook que decide a URL: `src/hooks/useResilientVideo.ts` (linha 55-56).

### O que descobri no Supabase agora

Tabela `configuracoes_sindico` (única linha, atualizada em 28/04/2026 14:54 UTC):

| Campo | Valor |
|---|---|
| `video_homepage_url` (desktop vertical) | **NULL** |
| `video_homepage_horizontal_url` (mobile horizontal) | **NULL** |

Ou seja, alguém (ou alguma rotina) zerou esses dois campos. Como estão NULL, o `useResilientVideo` cai no `primaryUrl` hardcoded — que aponta para os arquivos antigos do bucket:

- Desktop: `arquivos exa/Videos Site/video vertical novo exa.mp4` (enviado em 27/11/2025)
- Mobile:  `arquivos exa/Videos Site/institucional.mp4` (enviado em 25/11/2025)

Esses arquivos **ainda existem** no Storage, mas são as versões antigas. Os vídeos novos que estavam sendo exibidos vinham via override do banco — que agora está vazio.

### Onde estão os arquivos no Supabase

Bucket: **`arquivos exa`** → pasta **`Videos Site/`**
Único conteúdo atual:
- `video vertical novo exa.mp4` — 11.1 MB — 27/11/2025 (vertical, antigo)
- `institucional.mp4` — 16.4 MB — 25/11/2025 (horizontal, antigo)
- `Logo Branca - Exa.png`

Não há outro arquivo de vídeo mais recente nesse bucket. **Os vídeos novos não estão mais no Storage** — provavelmente o admin os removeu/substituiu, ou o upload novo foi feito em outro bucket/caminho e o link foi salvo só no campo do banco que agora está NULL.

### Possíveis causas do reset para NULL

1. Alguém editou o painel do síndico/configurações e salvou em branco.
2. Alguma migração ou script administrativo recente apagou os campos.
3. O upload novo gravou a URL no banco, mas o objeto no Storage foi removido depois — e em seguida algo limpou o campo (não há trigger que faça isso automaticamente; o mais provável é ação manual no painel).

## Plano de correção

### Etapa 1 — Confirmar com você qual vídeo restaurar
Preciso saber **onde estão os arquivos novos** que devem ser exibidos. Três cenários:

- **A)** Você ainda tem os arquivos MP4 novos no computador → faz upload pelo painel admin (`/admin` → Configurações do Síndico → Vídeo Homepage) e o sistema grava a URL automaticamente.
- **B)** Os arquivos novos estão em outro bucket/pasta do Supabase que eu não localizei → me passe o caminho e eu gravo a URL direta nos campos `video_homepage_url` e `video_homepage_horizontal_url`.
- **C)** Não há arquivos novos disponíveis → mantemos os atuais (`video vertical novo exa.mp4` e `institucional.mp4`) como definitivos, atualizando o hardcoded só se você quiser.

### Etapa 2 — Auditar quem zerou os campos
Adicionar log/trigger leve para registrar futuras alterações em `video_homepage_url` e `video_homepage_horizontal_url` (tabela de auditoria já existente). Evita que volte a acontecer sem rastro.

### Etapa 3 — Proteção de cache
Como já existe versionamento por `updated_at` em `useVideoConfig`, replicar o mesmo padrão de cache-buster em `useHomepageVideo` (que hoje retorna a URL sem `?v=`). Isso garante que assim que você reupload, o iPhone/Safari pega imediatamente a nova versão.

## Próximo passo

Me confirme o cenário (A, B ou C) e, se for B, me envie o caminho exato (bucket + nome do arquivo). Assim que aprovar este plano e responder, eu executo a restauração e aplico as etapas 2 e 3.
