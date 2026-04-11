/**
 * CORS Configuration — EXA Soluções
 * Restrito apenas ao domínio oficial. Nunca usar '*' em produção.
 */

const ALLOWED_ORIGINS = [
  'https://examidia.com.br',
  'https://www.examidia.com.br',
  'https://sistema.examidia.com.br',
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin',
  };
}

/** Headers para funções internas (webhooks, cron) que não precisam de CORS */
export const internalHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
};
