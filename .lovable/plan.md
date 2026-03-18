

# Plano: Adicionar Slot de Vídeo Horizontal da Homepage

## Situação atual

- `HeroSection.tsx` usa dois vídeos hardcoded:
  - **Desktop**: `DESKTOP_VIDEO_URL` (vertical 9:16) — override via `video_homepage_url` no banco
  - **Mobile**: `MOBILE_VIDEO_URL` (horizontal 16:9) — **sem override no banco, sem slot no admin**
- `VideosSitePage.tsx` tem apenas 1 slot "Homepage (Vertical)" que salva em `video_homepage_url`
- `useHomepageVideo` retorna apenas `videoUrl` (vertical)

## Alterações

### 1. Migration — nova coluna
```sql
ALTER TABLE configuracoes_sindico 
ADD COLUMN IF NOT EXISTS video_homepage_horizontal_url text;
```

### 2. `src/hooks/useHomepageVideo.ts`
- Buscar também `video_homepage_horizontal_url`
- Retornar `{ videoUrl, horizontalVideoUrl, loading }`

### 3. `src/pages/admin/VideosSitePage.tsx`
- Adicionar novo card "Vídeo da Homepage (Horizontal)" com input URL, upload e preview — mesmo padrão do vertical existente
- Incluir estados: `homeHorizontalUrl`, `uploadingHomeHorizontal`, `uploadProgressHomeHorizontal`
- Salvar/carregar o novo campo junto com os demais no `handleSaveConfig`

### 4. `src/components/exa/home/HeroSection.tsx`
- Importar `horizontalVideoUrl` do hook
- Passar `horizontalVideoUrl` como `overrideUrl` para `HeroMobileLayout` (atualmente passa apenas o override vertical)

**4 alterações: 1 migration + 3 arquivos.**

