import { describe, expect, test } from 'bun:test';
import { canDeleteSofiaContact, isDeleteConfirmationValid } from '../src/lib/deleteContactRules';

describe('apagar contato', () => {
  test('aceita deletar sem diferenciar maiúsculas', () => {
    expect(isDeleteConfirmationValid('DELETAR')).toBe(true);
    expect(isDeleteConfirmationValid('Deletar')).toBe(true);
    expect(isDeleteConfirmationValid('delet')).toBe(false);
    expect(isDeleteConfirmationValid('deletar agora')).toBe(false);
  });
  test('somente admin e super_admin', () => {
    expect(canDeleteSofiaContact('admin')).toBe(true);
    expect(canDeleteSofiaContact('super_admin')).toBe(true);
    expect(canDeleteSofiaContact('comercial')).toBe(false);
    expect(canDeleteSofiaContact(null)).toBe(false);
  });
});
