/**
 * Validação e máscara de CPF (algoritmo módulo 11).
 */

export function onlyDigitsCPF(input: string): string {
  return (input || '').replace(/\D/g, '').substring(0, 11);
}

export function formatCPFMask(input: string): string {
  const d = onlyDigitsCPF(input);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.substring(0, 3)}.${d.substring(3)}`;
  if (d.length <= 9) return `${d.substring(0, 3)}.${d.substring(3, 6)}.${d.substring(6)}`;
  return `${d.substring(0, 3)}.${d.substring(3, 6)}.${d.substring(6, 9)}-${d.substring(9)}`;
}

export function isValidCPF(input: string): boolean {
  const cpf = onlyDigitsCPF(input);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  let rev = (sum * 10) % 11;
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  rev = (sum * 10) % 11;
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(cpf.charAt(10), 10);
}
