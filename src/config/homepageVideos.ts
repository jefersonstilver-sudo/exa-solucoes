/**
 * 🔒 Configuração centralizada dos vídeos institucionais da Homepage (/).
 *
 * REGRA DE EXIBIÇÃO (CRÍTICA — não alterar sem aprovação explícita):
 *  - Mobile  (< 1024px) → vídeo HORIZONTAL (16:9)
 *  - Tablet  (< 1024px) → vídeo HORIZONTAL (16:9)
 *  - Desktop (≥ 1024px) → vídeo VERTICAL  (9:16)
 *
 * URLs públicas (sem token expirando) — não precisam ser renovadas.
 * Para trocar os vídeos, edite SOMENTE este arquivo.
 */

export const HOMEPAGE_VIDEO_BREAKPOINT = 1024;

export const HOMEPAGE_VIDEOS = {
  /** Vídeo HORIZONTAL — usado em mobile e tablet (< 1024px) */
  horizontal:
    'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/public-assets/VIDEOS%20HOME%20PAGE/Exa%20-%20Institucional%20(horizontal)%20-%20Compactado.mp4',

  /** Vídeo VERTICAL — usado em desktop (≥ 1024px) */
  vertical:
    'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/public-assets/VIDEOS%20HOME%20PAGE/Exa%20-%20Institucional%20(vertical)%20-%20Compactado.mp4',
} as const;
