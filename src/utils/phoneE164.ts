/**
 * Normalização e formatação de telefones brasileiros para padrão E.164.
 * Trigger `validate_sindico_lead` exige formato +55DDDXXXXXXXX(X).
 */

export function onlyDigits(input: string): string {
  return (input || '').replace(/\D/g, '');
}

/**
 * Aceita variações comuns:
 * - "(45) 99999-9999" → "+5545999999999"
 * - "45999999999"     → "+5545999999999"
 * - "5545999999999"   → "+5545999999999"
 * - "+5545999999999"  → "+5545999999999"
 * Retorna null se inválido.
 */
export function normalizeBRPhoneToE164(input: string): string | null {
  const digits = onlyDigits(input);
  if (!digits) return null;

  // Se já vem com 55 + DDD + número (12 ou 13 dígitos)
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    const ddd = digits.substring(2, 4);
    if (parseInt(ddd, 10) < 11) return null;
    return `+${digits}`;
  }

  // DDD + número (10 dígitos fixo, 11 dígitos celular)
  if (digits.length === 10 || digits.length === 11) {
    const ddd = digits.substring(0, 2);
    if (parseInt(ddd, 10) < 11) return null;
    return `+55${digits}`;
  }

  return null;
}

/**
 * Máscara visual brasileira: (45) 99999-9999 ou (45) 9999-9999.
 */
export function formatBRPhoneMask(input: string): string {
  let digits = onlyDigits(input);
  // Remove código do país se digitado
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.substring(2);
  }
  digits = digits.substring(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
  if (digits.length <= 10) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
  }
  return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
}

export function isValidBRPhone(input: string): boolean {
  return normalizeBRPhoneToE164(input) !== null;
}
