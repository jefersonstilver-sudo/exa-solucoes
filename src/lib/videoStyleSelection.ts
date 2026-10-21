export const SOFIA_STYLE_WHATSAPP = '5545991415920';
export function styleWhatsAppUrl(style: number, override: string | null) {
  const phone = override && /^\d+$/.test(override) ? override : SOFIA_STYLE_WHATSAPP;
  return `https://wa.me/${phone}?text=${encodeURIComponent(`Escolho o estilo ${style}`)}`;
}