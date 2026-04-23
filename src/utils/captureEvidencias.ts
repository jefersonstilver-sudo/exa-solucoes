/**
 * Captura evidências técnicas para o aceite eletrônico do termo de interesse.
 * Retorna IP (via ipify), user-agent e timestamp ISO.
 */
export interface Evidencias {
  ip: string;
  user_agent: string;
  timestamp: string;
}

export async function captureEvidencias(): Promise<Evidencias> {
  let ip = 'unknown';
  try {
    const res = await fetch('https://api.ipify.org?format=json', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      if (data?.ip) ip = data.ip;
    }
  } catch (err) {
    console.warn('[captureEvidencias] falha ao obter IP via ipify:', err);
  }

  return {
    ip,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    timestamp: new Date().toISOString(),
  };
}
