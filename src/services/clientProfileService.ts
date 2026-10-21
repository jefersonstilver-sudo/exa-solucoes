import { supabase } from '@/integrations/supabase/client';

/**
 * Perfil do cliente — fonte única da verdade: public.users
 * (nome, primeiro_nome, sobrenome, telefone, ...). Campos de marca extras
 * vivem em users.dashboard_preferences->'marca'.
 */

export interface BrandExtras {
  instagram?: string;
  whatsapp_comercial?: string;
  site?: string;
  cores?: string[];
}

export const splitFullName = (full: string): { primeiro_nome: string | null; sobrenome: string | null } => {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { primeiro_nome: null, sobrenome: null };
  return { primeiro_nome: parts[0], sobrenome: parts.slice(1).join(' ') || null };
};

export const resolveDisplayName = (u: { nome?: string | null; primeiro_nome?: string | null; sobrenome?: string | null } | null | undefined): string | null => {
  if (!u) return null;
  return (u.nome && u.nome.trim()) || [u.primeiro_nome, u.sobrenome].filter(Boolean).join(' ').trim() || null;
};

/** Atualiza identidade do cliente e sincroniza pedidos.client_name. */
export const saveClientIdentity = async (
  userId: string,
  data: { nome?: string; telefone?: string | null; cpf?: string | null },
): Promise<void> => {
  const update: Record<string, any> = {};
  if (typeof data.nome === 'string') {
    const nome = data.nome.trim();
    update.nome = nome || null;
    Object.assign(update, splitFullName(nome));
  }
  if (data.telefone !== undefined) update.telefone = data.telefone;
  if (data.cpf !== undefined) update.cpf = data.cpf;
  if (Object.keys(update).length === 0) return;

  const { error } = await supabase.from('users').update(update as any).eq('id', userId);
  if (error) throw error;

  if (update.nome) {
    const { error: syncError } = await supabase
      .from('pedidos')
      .update({ client_name: update.nome } as any)
      .eq('client_id', userId);
    if (syncError) console.warn('[clientProfile] sincronização de pedidos.client_name falhou', syncError);
  }
};

export const loadBrandExtras = async (userId: string): Promise<BrandExtras> => {
  const { data } = await supabase.from('users').select('dashboard_preferences').eq('id', userId).maybeSingle();
  const prefs = ((data as any)?.dashboard_preferences || {}) as Record<string, any>;
  return (prefs.marca || {}) as BrandExtras;
};

export const saveBrandExtras = async (userId: string, marca: BrandExtras): Promise<void> => {
  const { data, error: readError } = await supabase.from('users').select('dashboard_preferences').eq('id', userId).maybeSingle();
  if (readError) throw readError;
  const prefs = ((data as any)?.dashboard_preferences || {}) as Record<string, any>;
  const next = { ...prefs, marca: { ...(prefs.marca || {}), ...marca } };
  const { error } = await supabase.from('users').update({ dashboard_preferences: next } as any).eq('id', userId);
  if (error) throw error;
};
