# Correção definitiva do vídeo travado da home pública

## Causa raiz confirmada (via banco + browser real)

O banco `configuracoes_sindico` tem este registro ativo:

```
video_homepage_url            = .../storage/v1/object/public/videos/homepage/1774238437862.mp4
video_homepage_horizontal_url = .../storage/v1/object/public/videos/homepage-horizontal/1774238496065.mp4
```

Ambos retornam `net::ERR_ABORTED` ao tentar baixar (TUS upload corrompido / objeto incompleto no Storage). O hook `useResilientVideo` prioriza `overrideUrl` (banco) sobre o vídeo hardcoded que **funciona** (`arquivos exa/Videos Site/video vertical novo exa.mp4`, 11 MB, 200 OK), então o site fica eternamente "carregando" e nunca chega a tocar.

## Correção em duas frentes

### 1. Limpar o registro corrompido no banco (migração SQL)

Migration que zera somente as duas URLs específicas que estão quebradas:

```sql
UPDATE public.configuracoes_sindico
SET video_homepage_url = NULL,
    video_homepage_horizontal_url = NULL
WHERE video_homepage_url LIKE '%/videos/homepage/1774238437862.mp4'
   OR video_homepage_horizontal_url LIKE '%/videos/homepage-horizontal/1774238496065.mp4';
```

Efeito imediato: o site cai no fallback hardcoded (vídeo bom) e volta a tocar agora.

### 2. Fallback automático no código (proteção definitiva)

Refator no `src/hooks/useResilientVideo.ts`:

- Adicionar estado `overrideFailed`. Se o `<video>` disparar `error` ou esgotar `MAX_RETRIES` enquanto a URL ativa for o `overrideUrl` do banco, marcamos `overrideFailed = true` e o `activeSrc` passa a ignorar o override e usar `primaryUrl` (e depois `fallbackUrl` se também falhar).
- Resetar `overrideFailed` quando o `overrideUrl` mudar (admin re-upload pelo painel).
- Quando o site ainda assim entrar em estado `hasError`, mostrar o overlay "tentar novamente" como hoje — mas isso só vai acontecer agora se TODAS as fontes (DB + primário + fallback) falharem.

Resultado: nunca mais um upload ruim derruba o vídeo da home — o site se auto-recupera para o vídeo bom hardcoded.

## Detalhes técnicos

Arquivos:
- **NEW** `supabase/migrations/<timestamp>_clear_broken_homepage_video_urls.sql` — UPDATE acima.
- `src/hooks/useResilientVideo.ts` — adicionar `overrideFailed`, ajustar cálculo de `activeSrc`, marcar `overrideFailed` em `attemptRecovery` quando esgotar retries com `overrideUrl` ativo, e resetar via `useEffect([overrideUrl])`.

Não serão alterados:
- `HeroSection.tsx`, `useHomepageVideo.ts`, painel admin de configurações, layout, demais sections.
- A lógica do fluxo `primaryUrl → fallbackUrl` que já existe.

Após aplicar:
- Site público volta a tocar o vídeo institucional imediatamente.
- Você poderá re-fazer o upload do vídeo via painel admin quando quiser, sem risco de quebrar a home novamente.

Aprova?