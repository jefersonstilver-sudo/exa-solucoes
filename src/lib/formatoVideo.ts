// Formato que o painel do elevador realmente exibe.
// Horizontal: área de 1080×890 (6:5). Vertical premium: tela cheia 1080×1920 (9:16).
// O painel ESTICA o vídeo para preencher a área: qualquer proporção diferente aparece distorcida.
export const FORMATO_PAINEL = {
  horizontal: { w: 1080, h: 890, nome: '1080×890' },
  vertical: { w: 1080, h: 1920, nome: '1080×1920' },
} as const;

export interface ChecagemFormato {
  conhecido: boolean;
  ok: boolean;
  real?: string;
  esperado: string;
  /** quanto o conteúdo fica mais estreito (negativo) ou mais largo (positivo) no painel, em % */
  distorcao?: number;
  mensagem?: string;
}

const TOLERANCIA = 0.03; // 3%: diferença que ninguém percebe

export function checarFormatoVideo(largura?: number | null, altura?: number | null, vertical = false): ChecagemFormato {
  const esp = vertical ? FORMATO_PAINEL.vertical : FORMATO_PAINEL.horizontal;
  if (!largura || !altura) return { conhecido: false, ok: true, esperado: esp.nome };
  const rReal = largura / altura;
  const rEsp = esp.w / esp.h;
  const ok = Math.abs(rReal / rEsp - 1) <= TOLERANCIA;
  const distorcao = Math.round((rEsp / rReal - 1) * 100);
  const real = `${largura}×${altura}`;
  if (ok) return { conhecido: true, ok, real, esperado: esp.nome, distorcao: 0 };
  const sentido = distorcao < 0 ? `${Math.abs(distorcao)}% mais estreito (achatado)` : `${distorcao}% mais largo (esticado)`;
  return {
    conhecido: true,
    ok,
    real,
    esperado: esp.nome,
    distorcao,
    mensagem: `Formato fora do padrão do painel: este vídeo é ${real} e o painel exibe ${esp.nome}. Na tela ele aparece ${sentido}. Envie uma versão em ${esp.nome}.`,
  };
}

/** Lê largura e altura de um arquivo de vídeo no navegador (antes do envio). */
export function lerDimensoesArquivo(file: File): Promise<{ largura: number; altura: number } | null> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const v = document.createElement('video');
      const fim = (r: { largura: number; altura: number } | null) => { try { URL.revokeObjectURL(url); } catch (_) { /* nada */ } resolve(r); };
      const t = window.setTimeout(() => fim(null), 8000);
      v.preload = 'metadata';
      v.muted = true;
      v.onloadedmetadata = () => { window.clearTimeout(t); fim(v.videoWidth && v.videoHeight ? { largura: v.videoWidth, altura: v.videoHeight } : null); };
      v.onerror = () => { window.clearTimeout(t); fim(null); };
      v.src = url;
    } catch (_) {
      resolve(null);
    }
  });
}
