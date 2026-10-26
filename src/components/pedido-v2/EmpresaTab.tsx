import React, { useMemo, useRef, useState } from 'react';
import { Check, FileText, Film, Globe, Image as ImageIcon, Instagram, Loader2, MapPin, MessageCircle, Pencil, Plus, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import type { FichaCampo, Marca, MarcaArquivo, TipoArquivo } from '@/hooks/exa2/usePedidoEmpresas';

interface Props {
  marcas: Marca[];
  ficha: FichaCampo[];
  arquivos: MarcaArquivo[];
  loading: boolean;
  busy: boolean;
  disabled?: boolean;
  criarEmpresa: (nome: string) => Promise<Marca>;
  atualizarEmpresa: (id: string, patch: Partial<Marca>) => Promise<void>;
  salvarCampo: (id: string, valor: string) => Promise<void>;
  adicionarCampo: (marcaId: string, campo: string, valor: string) => Promise<void>;
  enviarArquivo: (marcaId: string, tipo: TipoArquivo, f: File) => Promise<void>;
  removerArquivo: (a: MarcaArquivo) => Promise<void>;
}

const quando = (iso?: string | null) => {
  if (!iso) return '';
  const d = (Date.now() - new Date(iso).getTime()) / 864e5;
  if (d < 1) return 'hoje';
  if (d < 2) return 'ontem';
  return `há ${Math.floor(d)} dias`;
};

export const EmpresaTab: React.FC<Props> = (p) => {
  const [selId, setSelId] = useState<string | null>(null);
  const [novaEmpresa, setNovaEmpresa] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const marca = p.marcas.find((m) => m.id === selId) || p.marcas[0] || null;

  const criar = async () => {
    if (!novaEmpresa.trim()) return;
    try {
      const m = await p.criarEmpresa(novaEmpresa);
      setSelId(m.id);
      setNovaEmpresa('');
      setAddOpen(false);
      toast.success('Empresa cadastrada! A Sofia já vai começar a completar a ficha.');
    } catch (e: any) {
      toast.error(e.message?.includes('duplicate') ? 'Essa empresa já está neste pedido' : e.message || 'Erro ao cadastrar');
    }
  };

  if (p.loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#9C1E1E]" /></div>;

  if (!marca) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center sm:p-10">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#9C1E1E] text-lg font-extrabold text-white">S</span>
        <h3 className="text-lg font-extrabold text-gray-900">Cadastre a empresa deste pedido</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          A Sofia usa tudo o que sabe sobre a sua empresa para criar vídeos melhores. Comece pelo nome — ela completa o resto conversando com você.
        </p>
        <div className="mx-auto mt-5 flex max-w-sm gap-2">
          <input value={novaEmpresa} onChange={(e) => setNovaEmpresa(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && criar()} placeholder="Nome da empresa" className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#9C1E1E] focus:outline-none" disabled={p.disabled} />
          <button onClick={criar} disabled={p.busy || p.disabled || !novaEmpresa.trim()} className="rounded-xl bg-[#9C1E1E] px-4 text-sm font-bold text-white disabled:opacity-40">
            {p.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cadastrar'}
          </button>
        </div>
        <p className="mt-3 text-[11px] text-gray-400">Tem mais de uma empresa neste pedido? Depois você adiciona as outras.</p>
      </div>
    );
  }

  const fichaDaMarca = p.ficha.filter((c) => c.marca_id === marca.id);
  const arquivosDaMarca = p.arquivos.filter((a) => a.marca_id === marca.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {p.marcas.map((m) => (
          <button key={m.id} onClick={() => setSelId(m.id)} className={`rounded-full border px-4 py-2 text-sm font-bold ${m.id === marca.id ? 'border-[#9C1E1E] bg-[#9C1E1E] text-white' : 'border-gray-200 bg-white text-gray-700'}`}>
            {m.empresa}
          </button>
        ))}
        {addOpen ? (
          <span className="flex items-center gap-1 rounded-full border border-[#9C1E1E] bg-white py-1 pl-3 pr-1">
            <input autoFocus value={novaEmpresa} onChange={(e) => setNovaEmpresa(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && criar()} placeholder="Nome da empresa" className="w-40 bg-transparent text-sm outline-none" />
            <button onClick={criar} disabled={p.busy} className="rounded-full bg-[#9C1E1E] p-1.5 text-white"><Check className="h-3.5 w-3.5" /></button>
            <button onClick={() => setAddOpen(false)} className="rounded-full p-1.5 text-gray-400"><X className="h-3.5 w-3.5" /></button>
          </span>
        ) : (
          <button disabled={p.disabled} onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#9C1E1E] px-4 py-2 text-sm font-bold text-[#9C1E1E] disabled:opacity-40">
            <Plus className="h-3.5 w-3.5" /> Adicionar empresa
          </button>
        )}
      </div>
      {!marca.pedido_id && (
        <p className="text-xs text-gray-500">Esta é a empresa da sua conta — vale para todos os seus pedidos. Se este pedido for de outra empresa, adicione acima.</p>
      )}

      <FichaCard key={marca.id} marca={marca} campos={fichaDaMarca} {...p} />

      <ContatosCard key={`c-${marca.id}`} marca={marca} disabled={p.disabled} atualizar={p.atualizarEmpresa} />

      <section>
        <h3 className="mb-2 text-base font-extrabold text-gray-900">Material da marca</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <UploadBox titulo="Logo sem fundo" sub="PNG transparente ou SVG" icon={ImageIcon} accept="image/png,image/svg+xml,image/webp" tipo="logo" marcaId={marca.id} arquivos={arquivosDaMarca} {...p} />
          <UploadBox titulo="Manual de marca" sub="PDF com cores, fontes e regras" icon={FileText} accept="application/pdf" tipo="pdf" marcaId={marca.id} arquivos={arquivosDaMarca} {...p} />
          <UploadBox titulo="Vídeos crus" sub="A Sofia monta os vídeos finais" icon={Film} accept="video/*" tipo="video" multiple marcaId={marca.id} arquivos={arquivosDaMarca} {...p} />
        </div>
      </section>
    </div>
  );
};

const FichaCard: React.FC<Props & { marca: Marca; campos: FichaCampo[] }> = ({ marca, campos, salvarCampo, adicionarCampo, disabled }) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [valor, setValor] = useState('');
  const [saving, setSaving] = useState(false);
  const [novo, setNovo] = useState<{ campo: string; valor: string } | null>(null);

  const obrig = campos.filter((c) => c.obrigatorio);
  const pctObrig = obrig.length ? Math.round((obrig.filter((c) => c.valor).length / obrig.length) * 100) : 0;
  const preenchidos = campos.filter((c) => c.valor).length;
  const grupos = useMemo(() => {
    const m = new Map<string, FichaCampo[]>();
    campos.forEach((c) => {
      const k = c.categoria || 'Outros';
      m.set(k, [...(m.get(k) || []), c]);
    });
    return [...m.entries()];
  }, [campos]);

  const salvar = async (c: FichaCampo) => {
    setSaving(true);
    try {
      await salvarCampo(c.id, valor);
      setEditId(null);
      toast.success('Ficha atualizada — a Sofia já vai usar essa informação');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#9C1E1E] font-extrabold text-white">S</span>
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-gray-900">Ficha da empresa · o que a Sofia sabe</div>
          <div className="text-xs text-gray-500">A Sofia preenche conversando com você e continua aprendendo. Toque em qualquer campo para corrigir.</div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${pctObrig >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{pctObrig}%</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-gradient-to-r from-[#9C1E1E] to-rose-500 transition-all" style={{ width: `${pctObrig}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-gray-400">{preenchidos} de {campos.length} campos preenchidos · essenciais {obrig.filter((c) => c.valor).length}/{obrig.length}</div>

      <div className="mt-3 space-y-4">
        {grupos.map(([cat, lista]) => (
          <div key={cat}>
            <div className="mb-1 text-[10.5px] font-extrabold uppercase tracking-wider text-gray-400">{cat}</div>
            <div className="divide-y divide-gray-100">
              {lista.map((c) => (
                <div key={c.id} className="py-2.5">
                  {editId === c.id ? (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-gray-500">{c.campo}</div>
                      <textarea autoFocus value={valor} onChange={(e) => setValor(e.target.value)} rows={2} className="w-full rounded-xl border border-[#9C1E1E] px-3 py-2 text-sm outline-none" />
                      <div className="flex gap-2">
                        <button disabled={saving} onClick={() => salvar(c)} className="rounded-lg bg-[#9C1E1E] px-3 py-1.5 text-xs font-bold text-white">{saving ? 'Salvando…' : 'Salvar'}</button>
                        <button onClick={() => setEditId(null)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button disabled={disabled} onClick={() => { setEditId(c.id); setValor(c.valor || ''); }} className="group flex w-full items-start gap-3 text-left">
                      <span className="w-36 flex-none pt-0.5 text-xs font-bold text-gray-500 sm:w-48">
                        {c.campo}
                        {c.obrigatorio && !c.valor && <span className="text-[#9C1E1E]"> *</span>}
                      </span>
                      <span className="min-w-0 flex-1 text-sm">
                        {c.valor ? (
                          <>
                            <span className="font-semibold text-gray-900">{c.valor}</span>
                            <span className={`ml-2 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 align-middle text-[10px] font-bold ${c.origem === 'cliente' ? 'bg-blue-50 text-blue-700' : c.origem === 'exa' ? 'bg-gray-100 text-gray-600' : 'bg-[#9C1E1E]/10 text-[#9C1E1E]'}`}>
                              {c.origem === 'cliente' ? '✎ você' : c.origem === 'exa' ? 'EXA' : <><Sparkles className="h-2.5 w-2.5" /> preenchido pela Sofia</>}
                              {c.updated_at && <span className="font-medium opacity-70">· {quando(c.updated_at)}</span>}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400">a preencher — <b className="font-semibold">a Sofia vai perguntar</b></span>
                        )}
                      </span>
                      <Pencil className="mt-0.5 h-3.5 w-3.5 flex-none text-gray-300 group-hover:text-[#9C1E1E]" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {novo ? (
        <div className="mt-3 space-y-2 rounded-xl border border-gray-200 p-3">
          <input value={novo.campo} onChange={(e) => setNovo({ ...novo, campo: e.target.value })} placeholder="Nome da informação (ex.: Estacionamento)" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          <textarea value={novo.valor} onChange={(e) => setNovo({ ...novo, valor: e.target.value })} placeholder="O que a Sofia precisa saber" rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!novo.campo.trim()) return;
                try { await adicionarCampo(marca.id, novo.campo, novo.valor); setNovo(null); toast.success('Informação adicionada'); } catch (e: any) { toast.error(e.message?.includes('duplicate') ? 'Essa informação já existe na ficha' : e.message); }
              }}
              className="rounded-lg bg-[#9C1E1E] px-3 py-1.5 text-xs font-bold text-white"
            >Adicionar</button>
            <button onClick={() => setNovo(null)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500">Cancelar</button>
          </div>
        </div>
      ) : (
        <button disabled={disabled} onClick={() => setNovo({ campo: '', valor: '' })} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#9C1E1E]"><Plus className="h-3.5 w-3.5" /> Adicionar outra informação</button>
      )}
    </div>
  );
};

const ContatosCard: React.FC<{ marca: Marca; disabled?: boolean; atualizar: Props['atualizarEmpresa'] }> = ({ marca, disabled, atualizar }) => {
  const [edit, setEdit] = useState<string | null>(null);
  const [v, setV] = useState('');
  const campos = [
    { k: 'instagram', l: 'Instagram', icon: Instagram, ph: '@suaempresa', link: (x: string) => `https://instagram.com/${x.replace(/^@|https?:\/\/(www\.)?instagram\.com\//g, '').split(/[/?]/)[0]}` },
    { k: 'whatsapp_qr', l: 'WhatsApp', icon: MessageCircle, ph: '(45) 99999-9999', link: (x: string) => `https://wa.me/${(x.replace(/\D/g, '').length <= 11 ? '55' : '') + x.replace(/\D/g, '')}` },
    { k: 'site', l: 'Site', icon: Globe, ph: 'www.suaempresa.com.br', link: (x: string) => (x.startsWith('http') ? x : `https://${x}`) },
    { k: 'endereco', l: 'Endereço', icon: MapPin, ph: 'Rua, número, bairro', link: (x: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x)}` },
  ] as const;
  return (
    <section>
      <h3 className="mb-2 text-base font-extrabold text-gray-900">Contato & links</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {campos.map(({ k, l, icon: I, ph, link }) => {
          const val = (marca as any)[k] as string | null;
          return (
            <div key={k} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[#9C1E1E]/10 text-[#9C1E1E]"><I className="h-4 w-4" /></span>
              {edit === k ? (
                <div className="flex min-w-0 flex-1 gap-1.5">
                  <input autoFocus value={v} onChange={(e) => setV(e.target.value)} placeholder={ph} className="min-w-0 flex-1 rounded-lg border border-[#9C1E1E] px-2 py-1.5 text-sm outline-none" />
                  <button onClick={async () => { try { await atualizar(marca.id, { [k]: v.trim() || null } as any); setEdit(null); } catch (e: any) { toast.error(e.message); } }} className="rounded-lg bg-[#9C1E1E] px-2.5 text-white"><Check className="h-4 w-4" /></button>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-gray-400">{l}</div>
                    {val ? (
                      <a href={link(val)} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-bold text-gray-900 hover:text-[#9C1E1E]">{val}</a>
                    ) : (
                      <span className="text-sm text-gray-400">adicionar</span>
                    )}
                  </div>
                  <button disabled={disabled} onClick={() => { setEdit(k); setV(val || ''); }} className="p-1.5 text-gray-300 hover:text-[#9C1E1E]"><Pencil className="h-3.5 w-3.5" /></button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

const UploadBox: React.FC<Props & {
  titulo: string; sub: string; icon: React.ElementType; accept: string; tipo: TipoArquivo; multiple?: boolean; marcaId: string; arquivos: MarcaArquivo[];
}> = ({ titulo, sub, icon: I, accept, tipo, multiple, marcaId, arquivos, enviarArquivo, removerArquivo, busy, disabled }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(0);
  const meus = arquivos.filter((a) => a.tipo === tipo);
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const lista = Array.from(files);
    setEnviando(lista.length);
    for (const f of lista) {
      if (f.size > 100 * 1024 * 1024) { toast.error(`${f.name}: máximo 100 MB`); setEnviando((n) => n - 1); continue; }
      try { await enviarArquivo(marcaId, tipo, f); toast.success(`${f.name} enviado`); } catch (e: any) { toast.error(`${f.name}: ${e.message || 'erro no envio'}`); }
      setEnviando((n) => n - 1);
    }
    if (ref.current) ref.current.value = '';
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3">
      <button disabled={disabled || busy} onClick={() => ref.current?.click()} className="w-full rounded-xl border-2 border-dashed border-[#9C1E1E]/30 bg-[#9C1E1E]/5 p-4 text-center text-[#9C1E1E] hover:border-[#9C1E1E] disabled:opacity-50">
        {enviando > 0 ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : <I className="mx-auto h-6 w-6" />}
        <div className="mt-1 text-sm font-extrabold">{titulo}</div>
        <div className="text-[11px] font-medium text-gray-500">{enviando > 0 ? `Enviando ${enviando}…` : sub}</div>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold"><Upload className="h-3 w-3" /> Enviar</span>
      </button>
      <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => onFiles(e.target.files)} />
      {meus.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {meus.slice(0, 6).map((a) => (
            <div key={a.id} className="flex items-center gap-2 rounded-lg bg-gray-50 p-1.5">
              {tipo === 'logo' ? <img src={a.url} alt="" className="h-8 w-8 rounded bg-[conic-gradient(#eee_25%,#fff_0_50%,#eee_0_75%,#fff_0)] bg-[length:8px_8px] object-contain" />
                : tipo === 'video' ? <video src={`${a.url}#t=1`} preload="metadata" muted className="h-8 w-12 rounded object-cover" />
                : <FileText className="h-6 w-6 text-gray-400" />}
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700 hover:text-[#9C1E1E]">{a.legenda || 'arquivo'}</a>
              <span className="text-[10px] text-gray-400">{a.origem === 'portal' ? 'você' : 'Sofia'}</span>
              {a.origem === 'portal' && (
                <button onClick={async () => { if (window.confirm('Remover este arquivo?')) { try { await removerArquivo(a); } catch (e: any) { toast.error(e.message); } } }} className="p-1 text-gray-300 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
          ))}
          {meus.length > 6 && <div className="text-center text-[11px] text-gray-400">+{meus.length - 6} arquivos</div>}
        </div>
      )}
    </div>
  );
};
