import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Building2, Loader2, MonitorPlay, RefreshCw, Search, Send, Trash2, UserCheck, AlertCircle, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { canDeleteSofiaContact } from '@/lib/deleteContactRules';

/**
 * CRM do Nando (síndicos). Lê tudo pela função nando-crm (só admin):
 * conversas agrupadas por telefone, vínculo com prédios pelos contatos cadastrados no prédio,
 * assumir/devolver atendimento, enviar como EXA e apagar a conversa (avisos do prédio nunca são apagados).
 */
type Conversa = {
  telefone: string;
  nome: string;
  nome_whatsapp: string | null;
  predios: { id: string; nome: string; papel: string }[];
  predio_atual: string | null;
  tipo: 'sindico' | 'contato' | 'sem_cadastro';
  modo: 'auto' | 'humano';
  humano_ate: string | null;
  assumido_por: string | null;
  ultima_em: string;
  preview: string;
  ultima_papel: string;
  aguardando: number;
  total: number;
};
type Mensagem = { id: number; papel: 'sindico' | 'nando' | 'humano' | 'sistema'; texto: string; autor: string | null; created_at: string };
type Ficha = {
  telefone: string;
  nome: string | null;
  predio_atual: string | null;
  primeira_conversa: string | null;
  sofia: { id: string; name: string | null; role: string | null } | null;
  interessado: { nome_predio: string | null; status: string | null; protocolo: string | null } | null;
  predios: {
    id: string; nome: string; codigo: string; tela_id: string; papel: string; endereco: string | null; status: string | null;
    telas: number; telas_online: number; avisos_ativos: number; pausado: boolean;
    avisos_recentes: { titulo: string | null; status: string; inicio: string | null; fim: string | null }[];
  }[];
};

async function call(action: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('nando-crm', { body: { action, ...body } });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
}

const FILTROS = [
  { v: 'todos', l: 'Todas' },
  { v: 'sindico', l: 'Síndicos' },
  { v: 'aguardando', l: 'Aguardando resposta' },
  { v: 'humano', l: 'Assumidas' },
  { v: 'sem_cadastro', l: 'Sem cadastro' },
] as const;

const quando = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const hoje = new Date();
  return d.toDateString() === hoje.toDateString()
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
const fone = (t: string) => {
  const d = t.replace(/\D/g, '');
  return d.length === 13 ? `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}` : `+${d}`;
};
const PAPEL_COR: Record<string, string> = {
  'síndico': 'bg-red-50 text-red-800 border-red-200',
  'vice-síndico': 'bg-orange-50 text-orange-800 border-orange-200',
  'contato do prédio': 'bg-gray-50 text-gray-700 border-gray-200',
};

export const NandoChatPanel: React.FC = () => {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['v']>('todos');
  const [busca, setBusca] = useState('');
  const [fichaAberta, setFichaAberta] = useState(false);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [apagar, setApagar] = useState<Conversa | null>(null);
  const [apagando, setApagando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<string | null>(null);
  selRef.current = sel;
  const { userProfile } = useAuth();
  const podeApagar = canDeleteSofiaContact(userProfile?.role);

  const carregar = useCallback(async () => {
    try {
      const d = await call('list');
      setConversas(d.conversas || []);
      setSel((cur) => cur ?? d.conversas?.[0]?.telefone ?? null);
    } catch (e: any) {
      console.error('[NANDO-CRM] lista', e);
      toast.error('Não foi possível carregar as conversas do Nando: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarMsgs = useCallback(async (tel: string) => {
    try {
      const d = await call('messages', { telefone: tel });
      if (selRef.current !== tel) return;
      setMsgs((prev) => {
        const next: Mensagem[] = d.mensagens || [];
        if (prev.length === next.length && prev[prev.length - 1]?.id === next[next.length - 1]?.id) return prev;
        return next;
      });
    } catch (e) {
      console.error('[NANDO-CRM] mensagens', e);
    }
  }, []);

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 8000);
    return () => clearInterval(t);
  }, [carregar]);

  useEffect(() => {
    if (!sel) return;
    setMsgs([]);
    setFicha(null);
    carregarMsgs(sel);
    call('ficha', { telefone: sel }).then((d) => selRef.current === sel && setFicha(d.ficha)).catch(() => {});
    const t = setInterval(() => carregarMsgs(sel), 4000);
    return () => clearInterval(t);
  }, [sel, carregarMsgs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return conversas.filter((c) => {
      if (filtro === 'sindico' && c.tipo === 'sem_cadastro') return false;
      if (filtro === 'aguardando' && !(c.aguardando > 0)) return false;
      if (filtro === 'humano' && c.modo !== 'humano') return false;
      if (filtro === 'sem_cadastro' && c.tipo !== 'sem_cadastro') return false;
      if (!q) return true;
      return [c.nome, c.nome_whatsapp, c.telefone, ...c.predios.map((p) => p.nome)].some((x) => (x || '').toLowerCase().includes(q));
    });
  }, [conversas, filtro, busca]);

  const atual = conversas.find((c) => c.telefone === sel) || null;
  const contagem = (v: string) =>
    v === 'todos' ? conversas.length
      : v === 'sindico' ? conversas.filter((c) => c.tipo !== 'sem_cadastro').length
      : v === 'aguardando' ? conversas.filter((c) => c.aguardando > 0).length
      : v === 'humano' ? conversas.filter((c) => c.modo === 'humano').length
      : conversas.filter((c) => c.tipo === 'sem_cadastro').length;

  const setModo = async (modo: 'auto' | 'humano') => {
    if (!sel) return;
    try {
      await call('set_mode', { telefone: sel, modo });
      toast.success(modo === 'humano' ? 'Você assumiu. O Nando não responde esta conversa por 12h (ou até devolver).' : 'O Nando voltou a atender.');
      carregar();
      carregarMsgs(sel);
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
  };

  const enviar = async () => {
    const t = texto.trim();
    if (!t || !sel || enviando) return;
    setEnviando(true);
    try {
      await call('send', { telefone: sel, texto: t });
      setTexto('');
      await carregarMsgs(sel);
      carregar();
    } catch (e: any) {
      toast.error('Falha ao enviar: ' + e.message);
    } finally {
      setEnviando(false);
    }
  };

  const confirmarApagar = async () => {
    if (!apagar) return;
    setApagando(true);
    try {
      const r = await call('apagar', { telefone: apagar.telefone, confirmar: 'apagar' });
      toast.success(`Conversa apagada (${r.apagadas} mensagens). Os avisos do prédio foram mantidos.`);
      setConversas((prev) => prev.filter((c) => c.telefone !== apagar.telefone));
      if (sel === apagar.telefone) { setSel(null); setMsgs([]); setFicha(null); }
      setApagar(null);
      carregar();
    } catch (e: any) {
      toast.error('Não foi possível apagar: ' + e.message);
    } finally {
      setApagando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[520px] rounded-2xl border border-gray-200 bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={!!apagar} onOpenChange={(o) => !o && setApagar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar a conversa com {apagar?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Apaga as {apagar?.total} mensagens e o prédio escolhido nesta conversa. <b>Os avisos do prédio não são apagados</b> e o cadastro do síndico no prédio continua igual.
              Se a pessoa escrever de novo, o Nando começa uma conversa nova. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={apagando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmarApagar(); }} disabled={apagando} className="bg-red-700 hover:bg-red-800">
              {apagando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apagar conversa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={fichaAberta} onOpenChange={setFichaAberta}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto h-dvh">
          <SheetHeader className="mb-4"><SheetTitle>Ficha do síndico</SheetTitle></SheetHeader>
          {!ficha ? <div className="flex items-center gap-2 py-10 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Carregando ficha…</div> : <FichaSindico f={ficha} />}
        </SheetContent>
      </Sheet>

      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] h-[calc(100vh-140px)] min-h-[520px] rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {/* Lista */}
        <div className="border-r border-gray-200 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b bg-gray-50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">Conversas do Nando · síndicos</span>
              <Button variant="ghost" size="sm" onClick={carregar}><RefreshCw className="w-4 h-4" /></Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, telefone ou prédio"
                className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTROS.map((f) => (
                <button key={f.v} onClick={() => setFiltro(f.v)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${filtro === f.v ? 'border-red-700 bg-red-700 text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100'}`}>
                  {f.l} <span className="opacity-70">{contagem(f.v)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {lista.length === 0 && <p className="p-4 text-sm text-gray-500">Nenhuma conversa neste filtro.</p>}
            {lista.map((c) => (
              <div key={c.telefone} className="relative group">
                <button onClick={() => setSel(c.telefone)}
                  className={`w-full text-left px-4 py-3 ${podeApagar ? 'pr-10' : ''} border-b hover:bg-gray-50 ${c.telefone === sel ? 'bg-red-50' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm text-gray-900 truncate">{c.nome}</span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{quando(c.ultima_em)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {c.modo === 'humano' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">Humano</span>}
                    {c.aguardando > 0 && c.modo !== 'humano' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">{c.aguardando} sem resposta</span>}
                    {c.tipo === 'sem_cadastro' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Sem cadastro</span>}
                    {c.predios.slice(0, 2).map((p) => (
                      <span key={p.id} className={`text-[10px] px-1.5 py-0.5 rounded border ${PAPEL_COR[p.papel] || PAPEL_COR['contato do prédio']}`}>{p.nome}</span>
                    ))}
                    {c.predios.length > 2 && <span className="text-[10px] text-gray-500">+{c.predios.length - 2}</span>}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 truncate">{c.ultima_papel === 'sindico' ? '' : c.ultima_papel === 'humano' ? 'Você: ' : 'Nando: '}{c.preview}</div>
                </button>
                {podeApagar && (
                  <Button variant="ghost" size="icon" className="absolute right-1 bottom-2 h-7 w-7 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-700"
                    aria-label="Apagar conversa" onClick={() => setApagar(c)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conversa */}
        <div className="flex flex-col min-h-0">
          {!atual ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Selecione uma conversa</div>
          ) : (
            <>
              <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3">
                <button className="min-w-0 text-left" onClick={() => setFichaAberta(true)}>
                  <div className="font-semibold text-gray-900 truncate">{atual.nome}</div>
                  <div className="text-xs text-gray-500">
                    {fone(atual.telefone)} · {atual.modo === 'humano'
                      ? `Atendimento humano${atual.assumido_por ? ` (${atual.assumido_por})` : ''} até ${quando(atual.humano_ate)} — Nando pausado`
                      : 'Nando atendendo'}
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setFichaAberta(true)}><Building2 className="w-4 h-4 mr-1.5" />Ficha do síndico</Button>
                  {atual.modo === 'auto' ? (
                    <Button size="sm" onClick={() => setModo('humano')} className="bg-red-700 hover:bg-red-800 text-white"><UserCheck className="w-4 h-4 mr-1.5" />Assumir</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setModo('auto')}><Bot className="w-4 h-4 mr-1.5" />Devolver ao Nando</Button>
                  )}
                  {podeApagar && (
                    <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => setApagar(atual)} aria-label="Apagar conversa"><Trash2 className="w-4 h-4" /></Button>
                  )}
                </div>
              </div>

              {atual.predios.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-b bg-gray-50/60 px-4 py-2">
                  {atual.predios.map((p) => (
                    <span key={p.id} className={`text-[11px] px-2 py-0.5 rounded-full border ${PAPEL_COR[p.papel] || PAPEL_COR['contato do prédio']}`}>
                      {p.papel} · {p.nome}
                    </span>
                  ))}
                  {atual.predio_atual && <span className="text-[11px] text-gray-500 py-0.5">conversando sobre: <b>{atual.predio_atual}</b></span>}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#faf8f5]">
                {msgs.map((m) => {
                  if (m.papel === 'sistema') {
                    return (
                      <div key={m.id} className="flex justify-center">
                        <div className="max-w-[85%] rounded-lg bg-gray-100 px-3 py-1.5 text-[11px] text-gray-500 whitespace-pre-wrap">{m.texto.slice(0, 400)}</div>
                      </div>
                    );
                  }
                  const minha = m.papel !== 'sindico';
                  return (
                    <div key={m.id} className={`flex ${minha ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words shadow-sm ${minha ? (m.papel === 'nando' ? 'bg-red-50' : 'bg-emerald-100') : 'bg-white'} text-gray-900`}>
                        {minha && <div className="text-[10px] font-semibold text-gray-500 mb-0.5">{m.papel === 'nando' ? 'Nando' : m.autor || 'Equipe EXA'}</div>}
                        {m.texto}
                        <div className="text-[10px] text-gray-400 text-right mt-0.5">{quando(m.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="p-3 border-t flex items-end gap-2">
                <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                  placeholder="Escreva como EXA (ao enviar, o Nando fica pausado nesta conversa)"
                  className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
                <Button onClick={enviar} disabled={enviando || !texto.trim()} className="bg-red-700 hover:bg-red-800 text-white">
                  {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const FichaSindico: React.FC<{ f: Ficha }> = ({ f }) => (
  <div className="space-y-5">
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="text-lg font-bold text-gray-900">{f.nome || 'Nome não cadastrado'}</div>
      <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-600"><Phone className="h-3.5 w-3.5" />{fone(f.telefone)}</div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-gray-50 p-2"><div className="text-xl font-extrabold">{f.predios.length}</div><div className="text-[11px] text-gray-500">prédios</div></div>
        <div className="rounded-xl bg-gray-50 p-2"><div className="text-xl font-extrabold">{f.predios.reduce((n, p) => n + p.telas_online, 0)}/{f.predios.reduce((n, p) => n + p.telas, 0)}</div><div className="text-[11px] text-gray-500">telas online</div></div>
        <div className="rounded-xl bg-gray-50 p-2"><div className="text-xl font-extrabold">{f.predios.reduce((n, p) => n + p.avisos_ativos, 0)}</div><div className="text-[11px] text-gray-500">avisos no ar</div></div>
      </div>
      <div className="mt-3 space-y-1 text-xs text-gray-500">
        {f.primeira_conversa && <div>Fala com o Nando desde {new Date(f.primeira_conversa).toLocaleDateString('pt-BR')}</div>}
        {f.sofia && <div className="flex items-center gap-1 text-amber-700"><AlertCircle className="h-3.5 w-3.5" />Também tem conversa com a Sofia (marcado como {f.sofia.role || 'sem papel'})</div>}
        {f.interessado && <div>Cadastro de interesse: {f.interessado.nome_predio || '—'} · {f.interessado.status || '—'}{f.interessado.protocolo ? ` · protocolo ${f.interessado.protocolo}` : ''}</div>}
      </div>
    </div>

    {f.predios.length === 0 ? (
      <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
        Este número não está cadastrado como síndico, vice ou contato de nenhum prédio ativo. Para vincular, cadastre o telefone no prédio (Prédios → contato do síndico).
      </div>
    ) : f.predios.map((p) => (
      <div key={p.id} className="rounded-2xl border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-bold text-gray-900">{p.nome}</div>
            <div className="text-xs text-gray-500">{p.endereco || 'Endereço não cadastrado'} · tela {p.tela_id}{p.codigo ? ` · cód. ${p.codigo}` : ''}</div>
          </div>
          <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${PAPEL_COR[p.papel] || PAPEL_COR['contato do prédio']}`}>{p.papel}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1"><MonitorPlay className="h-3.5 w-3.5" />{p.telas_online}/{p.telas} telas online</span>
          <span className="rounded-lg bg-gray-50 px-2 py-1">{p.avisos_ativos} aviso(s) no ar</span>
          {f.predio_atual === p.id && <span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-800">prédio da conversa atual</span>}
          {p.pausado && <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-800">Nando pausado neste prédio</span>}
        </div>
        {p.avisos_recentes.length > 0 && (
          <div className="mt-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Avisos recentes</div>
            <ul className="mt-1 space-y-1">
              {p.avisos_recentes.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-gray-700">{a.titulo || 'Aviso'}</span>
                  <span className={`shrink-0 ${a.status === 'no_ar' ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>{a.status === 'no_ar' ? 'no ar' : a.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ))}
  </div>
);

export default NandoChatPanel;
