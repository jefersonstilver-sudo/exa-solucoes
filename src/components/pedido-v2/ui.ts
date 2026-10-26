/**
 * EXA 2.0 — tokens visuais da página do pedido (linguagem do protótipo aprovado).
 * Vermelho da marca SEMPRE fixo (#9C1E1E): a variável CSS da marca não existe na área do anunciante.
 */
export const CARD =
  'rounded-[20px] bg-white shadow-[0_1px_2px_rgba(30,15,18,.05),0_8px_24px_-14px_rgba(30,15,18,.16)]';
export const CARD_LG =
  'rounded-[20px] bg-white shadow-[0_2px_6px_rgba(30,15,18,.06),0_24px_48px_-22px_rgba(30,15,18,.3)]';

/** Rótulo pequeno acima dos títulos ("Seu pedido", "Programação"…). */
export const EYEBROW = 'text-[11px] font-bold uppercase tracking-[0.11em] text-[#9e1b34]';
export const H_SEC = 'text-lg font-extrabold tracking-tight text-[#1b1719]';

export const BTN =
  'inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#9C1E1E] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#7c1428] disabled:opacity-40';
export const BTN_SOFT =
  'inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#f7f5f6] px-3.5 py-2 text-sm font-bold text-[#9C1E1E] transition hover:bg-[#f8e9ec] disabled:opacity-40';
export const INPUT =
  'w-full rounded-xl border border-[#ebe6e7] bg-[#f7f5f6] px-3 py-2.5 text-sm text-[#1b1719] outline-none transition focus:border-[#9C1E1E] focus:bg-white';

/** Badges de estado (verde no ar · vinho principal · azul agendado · âmbar aprovação). */
export const BADGE = {
  ar: 'bg-[#e6f6ec] text-[#13a24a]',
  principal: 'bg-[#f8e9ec] text-[#9e1b34]',
  agendado: 'bg-[#e8eefd] text-[#2563eb]',
  aprovacao: 'bg-[#fbefda] text-[#c2740a]',
  parado: 'bg-[#f0ecea] text-[#8b8285]',
} as const;
