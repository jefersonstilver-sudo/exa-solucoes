import { supabase } from '@/integrations/supabase/client';

// WhatsApps que podem administrar um pedido pela Sofia.
// Gestor = pedidos.whatsapp. Autorizados = tabela pedido_whatsapp_autorizados (ate 2).
// Todo acesso pelo WhatsApp exige o codigo de 6 digitos enviado ao e-mail do gestor da conta.

export const MAX_AUTORIZADOS = 2;

export interface WhatsappAutorizado {
  id: string;
  pedido_id: string;
  telefone: string;
  nome: string | null;
  created_at: string;
}

const db = supabase as any;

export const soDigitos = (v: string | null | undefined) => String(v || '').replace(/\D/g, '');

/** 55 + DDD + numero (aceita com ou sem o 55); null quando nao e um telefone brasileiro. Igual ao gatilho do banco. */
export const normalizarFone = (v: string | null | undefined): string | null => {
  const d = soDigitos(v);
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d;
  if (d.length === 10 || d.length === 11) return '55' + d;
  return null;
};

/** +55 (45) 99999-0000 */
export const formatarFone = (v: string | null | undefined): string => {
  const d = soDigitos(v);
  if (!d) return '';
  const n = d.startsWith('55') && d.length >= 12 ? d.slice(2) : d;
  if (n.length === 11) return `+55 (${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `+55 (${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return '+' + d;
};

export const listarAutorizados = async (pedidoId: string): Promise<WhatsappAutorizado[]> => {
  const { data, error } = await db
    .from('pedido_whatsapp_autorizados')
    .select('id, pedido_id, telefone, nome, created_at')
    .eq('pedido_id', pedidoId)
    .order('created_at');
  if (error) throw new Error(error.message);
  return (data || []) as WhatsappAutorizado[];
};

/** Quantos autorizados cada pedido tem (para o selo na lista). Falha silenciosa: devolve mapa vazio. */
export const contarAutorizados = async (pedidoIds: string[]): Promise<Map<string, number>> => {
  const mapa = new Map<string, number>();
  for (let i = 0; i < pedidoIds.length; i += 150) {
    const { data, error } = await db.from('pedido_whatsapp_autorizados').select('pedido_id').in('pedido_id', pedidoIds.slice(i, i + 150));
    if (error) { console.warn('[whatsapp autorizados] contagem indisponivel', error.message); return mapa; }
    for (const r of data || []) mapa.set(r.pedido_id, (mapa.get(r.pedido_id) || 0) + 1);
  }
  return mapa;
};

export const adicionarAutorizado = async (pedidoId: string, telefone: string, nome: string) => {
  const fone = normalizarFone(telefone);
  if (!fone) throw new Error('Telefone inválido: informe DDD + número');
  const { error } = await db.from('pedido_whatsapp_autorizados').insert({ pedido_id: pedidoId, telefone: fone, nome: nome.trim() || null });
  if (error) {
    if (String(error.code) === '23505') throw new Error('Este número já está autorizado neste pedido');
    throw new Error(error.message);
  }
};

export const removerAutorizado = async (id: string) => {
  const { error } = await db.from('pedido_whatsapp_autorizados').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

/** Troca o WhatsApp do gestor deste pedido (pedidos.whatsapp). */
export const salvarWhatsappGestor = async (pedidoId: string, telefone: string) => {
  const fone = normalizarFone(telefone);
  if (!fone) throw new Error('Telefone inválido: informe DDD + número');
  const { data, error } = await db.from('pedidos').update({ whatsapp: fone }).eq('id', pedidoId).select('id');
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error('Sem permissão para alterar este pedido');
  return fone;
};
