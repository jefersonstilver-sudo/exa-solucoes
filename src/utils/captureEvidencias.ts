/**
 * Captura evidências técnicas para o aceite eletrônico do termo de interesse.
 * Retorna IP (via ipify), user-agent e timestamp ISO.
 *
 * IMPORTANTE: o fetch de IP é hardenizado com AbortController + timeout curto.
 * Se a chamada externa demorar ou falhar, retornamos ip='unknown' para não
 * bloquear o envio do formulário.
 */
export interface Evidencias {
  ip: string;
  user_agent: string;
  timestamp: string;
}

const IP_FETCH_TIMEOUT_MS = 2500;

export async function captureEvidencias(): Promise<Evidencias> {
  let ip = 'unknown';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IP_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      signal: controller.signal,
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.ip) ip = data.ip;
    }
  } catch (err) {
    console.warn('[captureEvidencias] IP indisponível (timeout/erro), seguindo sem bloquear:', err);
  } finally {
    clearTimeout(timer);
  }

  return {
    ip,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    timestamp: new Date().toISOString(),
  };
}
