import { expect, test } from 'bun:test';
import { styleWhatsAppUrl } from '../src/lib/videoStyleSelection';
test('sem w usa sempre o número padrão da Sofia', () => {
  expect(styleWhatsAppUrl(3, null)).toBe('https://wa.me/5545991415920?text=Escolho%20o%20estilo%203');
});
test('w somente com dígitos substitui o número', () => {
  expect(styleWhatsAppUrl(5, '5545999999999')).toBe('https://wa.me/5545999999999?text=Escolho%20o%20estilo%205');
});
test('w inválido não muda o destino padrão', () => {
  expect(styleWhatsAppUrl(1, '+55abc')).toBe('https://wa.me/5545991415920?text=Escolho%20o%20estilo%201');
});