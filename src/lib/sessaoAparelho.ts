/**
 * "Manter conectado neste aparelho" (tela de login).
 * Importado PRIMEIRO no main.tsx, antes do cliente do Supabase ler a sessão guardada.
 * Se a pessoa entrou com a opção desligada e o app/aba foi fechado (sessionStorage zera),
 * apaga a sessão guardada no aparelho: ela precisa entrar de novo.
 */
const CHAVE_MANTER = 'exa-manter';
const CHAVE_VIVA = 'exa-sessao-viva';
const CHAVE_EMAIL = 'exa-ultimo-email';

try {
  if (localStorage.getItem(CHAVE_MANTER) === '0' && !sessionStorage.getItem(CHAVE_VIVA)) {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
      .forEach((k) => localStorage.removeItem(k));
  }
} catch { /* sem armazenamento: segue o padrão (sessão mantida) */ }

export function lembrarEscolha(manter: boolean, email: string) {
  try {
    localStorage.setItem(CHAVE_MANTER, manter ? '1' : '0');
    sessionStorage.setItem(CHAVE_VIVA, '1');
    if (manter && email.trim()) localStorage.setItem(CHAVE_EMAIL, email.trim());
    if (!manter) localStorage.removeItem(CHAVE_EMAIL);
  } catch { /* ignora */ }
}

export function escolhaSalva(): { manter: boolean; email: string } {
  try {
    return { manter: localStorage.getItem(CHAVE_MANTER) !== '0', email: localStorage.getItem(CHAVE_EMAIL) || '' };
  } catch { return { manter: true, email: '' }; }
}
