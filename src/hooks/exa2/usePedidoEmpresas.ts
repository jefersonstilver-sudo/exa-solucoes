import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Marca = Database['public']['Tables']['marcas_clientes']['Row'];
export type FichaCampo = Database['public']['Tables']['marca_ficha_campos']['Row'];
export type MarcaArquivo = Database['public']['Tables']['marca_arquivos']['Row'];
/** Campos da empresa que o cliente pode editar pelo portal (RLS: só as marcas dele). */
export type MarcaPatch = Partial<
  Pick<
    Database['public']['Tables']['marcas_clientes']['Update'],
    'empresa' | 'segmento' | 'slogan' | 'instagram' | 'site' | 'whatsapp_qr' | 'endereco' | 'notas' | 'tom_de_voz' | 'proibido' | 'cores' | 'fontes' | 'logo'
  >
>;

/** Tipos aceitos pela tabela marca_arquivos (mesmos que a Sofia/Lucas usam). */
export type TipoArquivo = 'logo' | 'pdf' | 'video' | 'foto' | 'referencia';

const PASTA: Record<TipoArquivo, string> = {
  logo: 'logo',
  pdf: 'pdfs',
  video: 'videos',
  foto: 'fotos',
  referencia: 'referencias',
};

const safeName = (n: string) =>
  n
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .slice(-80);

/**
 * Empresas (marcas) do pedido + ficha de conhecimento da Sofia + arquivos.
 * Regra: a marca da conta (nível cliente) + as marcas extras deste pedido (pedido_id), nessa ordem.
 */
export function usePedidoEmpresas(pedidoId: string, clientId: string | undefined) {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [ficha, setFicha] = useState<FichaCampo[]>([]);
  const [arquivos, setArquivos] = useState<MarcaArquivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!pedidoId) return;
    try {
      // Empresa da conta (vale para todos os pedidos) SEMPRE aparece primeiro; depois as empresas extras deste pedido
      // (ex.: o cliente da Baby Close que também anuncia a Harley Foz). Uma nunca substitui a outra.
      const [{ data: doPedido }, { data: daConta }] = await Promise.all([
        supabase.from('marcas_clientes').select('*').eq('pedido_id', pedidoId).order('created_at'),
        clientId
          ? supabase.from('marcas_clientes').select('*').eq('client_id', clientId).is('pedido_id', null).order('created_at')
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const lista = [...(daConta || []), ...(doPedido || []).filter((m: any) => !(daConta || []).some((c: any) => c.id === m.id))];
      setMarcas(lista);
      const ids = lista.map((m) => m.id);
      if (ids.length) {
        const [{ data: f }, { data: a }] = await Promise.all([
          supabase.from('marca_ficha_campos').select('*').in('marca_id', ids).order('ordem'),
          supabase.from('marca_arquivos').select('*').in('marca_id', ids).order('created_at', { ascending: false }),
        ]);
        setFicha(f || []);
        setArquivos(a || []);
      } else {
        setFicha([]);
        setArquivos([]);
      }
    } catch (e) {
      console.error('[EXA2][empresas] erro ao carregar', e);
    } finally {
      setLoading(false);
    }
  }, [pedidoId, clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const criarEmpresa = useCallback(
    async (empresa: string) => {
      if (!clientId) throw new Error('Cliente não identificado');
      setBusy(true);
      try {
        const { data, error } = await supabase
          .from('marcas_clientes')
          .insert({ client_id: clientId, pedido_id: pedidoId, empresa: empresa.trim() })
          .select('*')
          .single();
        if (error) throw error;
        await load(); // trigger do banco já criou a ficha padrão
        return data as Marca;
      } finally {
        setBusy(false);
      }
    },
    [clientId, pedidoId, load],
  );

  const atualizarEmpresa = useCallback(
    async (marcaId: string, patch: MarcaPatch) => {
      setBusy(true);
      try {
        const { error } = await supabase.from('marcas_clientes').update(patch).eq('id', marcaId);
        if (error) throw error;
        setMarcas((prev) => prev.map((m) => (m.id === marcaId ? ({ ...m, ...patch } as Marca) : m)));
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  /** Cliente edita um campo da ficha → origem passa a ser "cliente". */
  const salvarCampo = useCallback(async (campoId: string, valor: string) => {
    const { data: auth } = await supabase.auth.getUser();
    const v = valor.trim() || null;
    const { error } = await supabase
      .from('marca_ficha_campos')
      .update({ valor: v, origem: 'cliente', atualizado_por: auth.user?.id || null })
      .eq('id', campoId);
    if (error) throw error;
    setFicha((prev) => prev.map((c) => (c.id === campoId ? { ...c, valor: v, origem: 'cliente', updated_at: new Date().toISOString() } : c)));
  }, []);

  const adicionarCampo = useCallback(
    async (marcaId: string, campo: string, valor: string, categoria = 'Outros') => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from('marca_ficha_campos').insert({
        marca_id: marcaId,
        campo: campo.trim(),
        valor: valor.trim() || null,
        categoria,
        origem: 'cliente',
        ordem: 900,
        atualizado_por: auth.user?.id || null,
      });
      if (error) throw error;
      await load();
    },
    [load],
  );

  const enviarArquivo = useCallback(
    async (marcaId: string, tipo: TipoArquivo, file: File, legenda?: string): Promise<{ url: string; path: string }> => {
      setBusy(true);
      try {
        const path = `${marcaId}/${PASTA[tipo]}/${crypto.randomUUID()}-${safeName(file.name)}`;
        const { error: upErr } = await supabase.storage.from('marcas').upload(path, file, {
          contentType: file.type || undefined,
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('marcas').getPublicUrl(path);
        const { error } = await supabase.from('marca_arquivos').insert({
          marca_id: marcaId,
          tipo,
          url: pub.publicUrl,
          path,
          legenda: legenda || file.name,
          origem: 'portal',
          meta: { tamanho: file.size, mime: file.type, nome_original: file.name },
        });
        if (error) {
          await supabase.storage.from('marcas').remove([path]);
          throw error;
        }
        await load();
        return { url: pub.publicUrl, path };
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const removerArquivo = useCallback(
    async (arq: MarcaArquivo) => {
      setBusy(true);
      try {
        const { error } = await supabase.from('marca_arquivos').delete().eq('id', arq.id);
        if (error) throw error;
        if (arq.path) await supabase.storage.from('marcas').remove([arq.path]);
        setArquivos((prev) => prev.filter((a) => a.id !== arq.id));
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return {
    marcas,
    ficha,
    arquivos,
    loading,
    busy,
    reload: load,
    criarEmpresa,
    atualizarEmpresa,
    salvarCampo,
    adicionarCampo,
    enviarArquivo,
    removerArquivo,
  };
}
