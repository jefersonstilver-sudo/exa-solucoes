// ============================================
// TEMA CLARO/ESCURO DOS E-MAILS EXA
// ============================================
// O iPhone (Apple Mail), o Gmail e o Outlook mudam o e-mail quando o aparelho está no modo escuro.
// Sem instrução, cada um "inverte" do seu jeito e o e-mail fica ilegível (texto escuro em fundo escuro,
// logo apagada). Aqui o e-mail declara que suporta os dois temas e traz as cores certas para o escuro.
//
// Uso: html = aplicarTemaEmail(html) logo antes de enviar. Funciona com qualquer HTML (com ou sem <head>).

const FUNDO_ESCURO = '#141014';
const CARTAO_ESCURO = '#201a1d';
const CAIXA_ESCURA = '#2a2226';
const TEXTO_ESCURO = '#f1ecee';
const TEXTO_SUAVE_ESCURO = '#c4bbbf';

// Fundos claros e textos escuros mais usados nos nossos templates (inline), para trocar no escuro.
const FUNDOS_CLAROS = ['#ffffff', '#fff', '#f3eeee', '#faf6f6', '#fafafa', '#f9f9f9', '#f8f8f8', '#f7f5f6', '#f5f5f5', '#f3f1f2', '#f4f4f5', '#faf7f8', '#fdf6f7', '#fbf7f8', '#f9fafb', '#f3f4f6', '#fbe9eb', '#f8e9ec', '#faf5f5', '#fdf2f2', '#fef2f2', '#fff5f5', '#fff7ed', '#fffbeb', '#fef3c7', '#f0fdf4', '#ecfdf5', '#eff6ff', '#f0f9ff', 'white'];
const TEXTOS_ESCUROS = ['#000', '#000000', '#2b2b2b', '#111', '#111111', '#1b1719', '#1a1a1a', '#1f2937', '#222', '#222222', '#333', '#333333', '#3b3030', '#374151', '#444', '#444444', '#554e50'];
const TEXTOS_MEDIOS = ['#555', '#555555', '#666', '#666666', '#6b7280', '#6f6669', '#777', '#777777', '#888', '#888888', '#8b8285'];

const VERMELHOS = ['#8b1a1a', '#8B1A1A', '#6b1414', '#6B1414', '#a52020', '#A52020', '#9c1e1e', '#9C1E1E', '#991b1b', '#b91c1c', '#7f1d1d', '#dc2626', '#c0392b', '#9e1b34'];
const AZUIS = ['#1e40af', '#1e3a8a', '#1d4ed8', '#2563eb', '#1e3a5f'];
const VERDES = ['#166534', '#15803d', '#065f46', '#047857', '#14532d'];
const sel = (prop: string, valores: string[]) =>
  valores
    .flatMap((v) => [`[style*="${prop}:${v}"]`, `[style*="${prop}: ${v}"]`, `[style*="${prop}:${v.toUpperCase()}"]`, `[style*="${prop}: ${v.toUpperCase()}"]`])
    .join(',');

export const CSS_TEMA_ESCURO = `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
@media (prefers-color-scheme: dark) {
  body, .email-wrapper, .exa-fundo { background: ${FUNDO_ESCURO} !important; background-color: ${FUNDO_ESCURO} !important; color: ${TEXTO_ESCURO} !important; }
  .email-container, .content, .exa-cartao { background: ${CARTAO_ESCURO} !important; background-color: ${CARTAO_ESCURO} !important; }
  .info-box, .warning-box, .success-box, .exa-caixa { background: ${CAIXA_ESCURA} !important; background-color: ${CAIXA_ESCURA} !important; }
  .greeting, .message, .message p, .footer-brand, .exa-texto { color: ${TEXTO_ESCURO} !important; }
  .footer, .footer-text, .footer-tagline, .exa-suave { color: ${TEXTO_SUAVE_ESCURO} !important; }
  .footer { background: ${FUNDO_ESCURO} !important; }
  .header, .header *, .cta-button, .cta-button *, .exa-manter, .exa-manter * { color: #ffffff !important; }
  a { color: #ff8a93 !important; }
  .cta-button, a.cta-button, .exa-botao { background: #b8292f !important; background-color: #b8292f !important; color: #ffffff !important; }
  ${sel('background', FUNDOS_CLAROS)}, ${sel('background-color', FUNDOS_CLAROS)} { background: ${CARTAO_ESCURO} !important; background-color: ${CARTAO_ESCURO} !important; }
  ${sel('color', TEXTOS_ESCUROS)} { color: ${TEXTO_ESCURO} !important; }
  ${sel('color', TEXTOS_MEDIOS)} { color: ${TEXTO_SUAVE_ESCURO} !important; }
  ${sel('color', VERMELHOS)} { color: #ff9aa2 !important; }
  ${sel('color', AZUIS)} { color: #93c5fd !important; }
  ${sel('color', VERDES)} { color: #86efac !important; }
  .info-box, .info-box p, .info-box li, .warning-box, .warning-box p, .warning-box li, .success-box, .success-box p, .success-box li { color: ${TEXTO_SUAVE_ESCURO} !important; }
  .info-box strong, .info-box b, .info-box h3, .info-box h4, .warning-box strong, .warning-box b, .warning-box h3, .warning-box h4, .success-box strong, .success-box b, .success-box h3, .success-box h4 { color: #ffb3b9 !important; }
  [bgcolor="#ffffff"], [bgcolor="#FFFFFF"], [bgcolor="#f5f5f5"], [bgcolor="#F5F5F5"], [bgcolor="#f9f9f9"] { background: ${CARTAO_ESCURO} !important; }
  img.exa-logo-claro { display: none !important; }
  img.exa-logo-escuro { display: inline-block !important; }
}
/* Outlook.com / app do Outlook no modo escuro */
[data-ogsc] .email-container, [data-ogsb] .email-container { background: ${CARTAO_ESCURO} !important; }
[data-ogsc] .greeting, [data-ogsc] .message { color: ${TEXTO_ESCURO} !important; }
`;

const META = '<meta name="color-scheme" content="light dark">\n<meta name="supported-color-schemes" content="light dark">';

export function aplicarTemaEmail(html: string): string {
  if (!html || html.includes('data-exa-tema')) return html;
  let out = html.replace(/<meta[^>]+name=["']color-scheme["'][^>]*>/gi, '').replace(/<meta[^>]+name=["']supported-color-schemes["'][^>]*>/gi, '');
  const bloco = `${META}\n<style data-exa-tema>${CSS_TEMA_ESCURO}</style>`;
  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, `${bloco}\n</head>`);
  else if (/<html[^>]*>/i.test(out)) out = out.replace(/<html([^>]*)>/i, `<html$1><head>${bloco}</head>`);
  else out = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">${bloco}</head><body>${out}</body></html>`;
  return out;
}
