import { expect, test } from 'bun:test';
import { activeOrdersFirst, crm360Params, crmDate, crmPhone, inconsistencyLookup } from '../src/services/crm360Rules';

test('ficha Sofia usa o ID do contato, não o da conversa', () => {
  expect(crm360Params({ contact: 'sofia-contact-id' })).toEqual({ p_contact: 'sofia-contact-id', p_user: null, p_phone: null, p_email: null });
});
test('ficha do usuário passa p_user', () => {
  expect(crm360Params({ user: 'account-id' }).p_user).toBe('account-id');
});
test('pedidos ativos vêm antes dos demais sem modificar os dados', () => {
  const rows = [{ id: 'inativo', ativo: false, criado_em: '2026-10-21' }, { id: 'ativo', ativo: true, criado_em: '2026-01-01' }];
  expect(activeOrdersFirst(rows).map(r => r.id)).toEqual(['ativo', 'inativo']);
  expect(rows[0].id).toBe('inativo');
});
test('telefone brasileiro com código de país ou local tem o mesmo formato', () => {
  expect(crmPhone('5545998323225')).toBe('+55 45 99832-3225');
  expect(crmPhone('45998323225')).toBe('+55 45 99832-3225');
});
test('datas usam dd/mm/aaaa sem deslocar datas de contrato', () => {
  expect(crmDate('2026-10-21')).toBe('21/10/2026');
});
test('a chave do contato sem conta na view é telefone, não UUID', () => {
  expect(inconsistencyLookup({ tipo: 'contato_sofia_sem_conta', chave: '5545998323225' })).toEqual({ phone: '5545998323225' });
});
test('inconsistência de pedido resolve o cliente pelo ID real do pedido', () => {
  expect(inconsistencyLookup({ tipo: 'pedido_sem_email', chave: 'pedido-id' })).toEqual({ order: 'pedido-id' });
});