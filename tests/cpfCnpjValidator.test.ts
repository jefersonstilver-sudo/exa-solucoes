import { describe, expect, test } from 'bun:test';
import { isValidCpfCnpj } from '../src/utils/cpfCnpjValidator';

describe('CPF/CNPJ do cliente no Novo Pedido', () => {
  test('aceita CPF com dígitos verificadores corretos', () => expect(isValidCpfCnpj('529.982.247-25')).toBe(true));
  test('rejeita CPF com dígito verificador errado', () => expect(isValidCpfCnpj('529.982.247-24')).toBe(false));
  test('aceita CNPJ válido (INDEXA)', () => expect(isValidCpfCnpj('38.142.638/0001-30')).toBe(true));
  test('rejeita CNPJ com dígito errado', () => expect(isValidCpfCnpj('38.142.638/0001-31')).toBe(false));
  test('rejeita sequência repetida', () => expect(isValidCpfCnpj('11111111111')).toBe(false));
});
