// Painel do síndico (Nando · EXA): examidia.com.br/nando/painel e os links /nando/predio/<token> que o Nando manda.
// Entrar: código de 6 dígitos no WhatsApp (12 h ou "lembrar este aparelho" 30 dias).
// Alterar qualquer aviso pelo site: pede um código novo na hora, mesmo com o aparelho lembrado.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Building2, CalendarClock, Check, ChevronRight, Clock, Eye, History, Layers, Loader2, LogOut, MessageCircle, Pencil, Repeat,
  Search, ShieldCheck, Smartphone, Timer, Trash2, X,
} from 'lucide-react';

type Hist = { em: string; quem: string; acao: string };
type Aviso = {
  id: string; tipo: 'nando' | 'imagem' | 'pdf'; titulo: string; segundos: number; inicio: string; fim: string | null;
  status: 'no_ar' | 'agendado'; criado_por: string; criado_em?: string | null; dados: any; url: string | null; antigo: boolean;
  em_grupo?: boolean; grupo_predios?: string[]; repete?: boolean; serie?: string | null; historico?: Hist[];
};
type Grupo = { id: string; predio: string; codigo?: string; avisos: Aviso[] };
type Dados = {
  ok: boolean; pessoa: string; primeiro_nome: string; admin: boolean; telefone: string; expira_em: string; lembrar: boolean;
  alterar_ate: string | null; aparelhos: number; foco: string | null; predios: Grupo[]; whatsapp_nando: string;
};
type Acao =
  | { op: 'remover' } | { op: 'datas'; fim: string; sem_fim: boolean; inicio?: string } | { op: 'tempo'; segundos: number }
  | { op: 'texto'; titulo: string; quando: string; texto: string; itens: string[] };

const CHAVE = 'nando_sessao';
const lerSessao = () => { try { const s = JSON.parse(localStorage.getItem(CHAVE) || 'null'); return s && new Date(s.expira) > new Date() ? s.token as string : null; } catch { return null; } };
const salvarSessao = (token: string, expira: string) => { try { localStorage.setItem(CHAVE, JSON.stringify({ token, expira })); } catch { /* */ } };
const limparSessao = () => { try { localStorage.removeItem(CHAVE); } catch { /* */ } };

async function api(acao: string, body: Record<string, unknown> = {}): Promise<any> {
  const { data, error } = await supabase.functions.invoke('nando-painel', { body: { acao, ...body } });
  if (!error) return data;
  try { const r = (error as any).context; if (r?.json) return await r.json(); } catch { /* */ }
  return { ok: false, erro: 'Sem conexão. Tente de novo.' };
}

const fmt = (d?: string | null, comAno = false) => d
  ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: '2-digit', ...(comAno ? { year: 'numeric' } : {}), hour: '2-digit', minute: '2-digit' }).format(new Date(d))
  : '';
const paraInput = (d?: string | null) => {
  if (!d) return '';
  const p = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(d));
  return p.replace(' ', 'T');
};
const emDias = (d?: string | null) => (d ? (new Date(d).getTime() - Date.now()) / 86400000 : Infinity);

function carregarScript(src: string) {
  return new Promise<void>((ok, erro) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const s = document.createElement('script'); s.src = src; s.onload = () => ok(); s.onerror = () => erro(new Error(src));
    document.head.appendChild(s);
  });
}
function carregarCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
}

// --------------------------------------------------------------------------------------------- tela do aviso
function TelaAviso({ a, grande = false }: { a: Aviso; grande?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let m: { remover: () => void } | null = null, vivo = true;
    (async () => {
      if (a.tipo === 'nando' && a.dados) {
        carregarCss('/nando/aviso-nando.css'); await carregarScript('/nando/aviso-nando.js');
        if (vivo && (window as any).NandoAviso) m = (window as any).NandoAviso.montar(el, a.dados);
      }
      if (a.tipo === 'pdf' && a.url) {
        try {
          await carregarScript('https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.min.js');
          const lib = (window as any).pdfjsLib;
          lib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js';
          const doc = await lib.getDocument({ url: a.url, isEvalSupported: false }).promise;
          const pg = await doc.getPage(1); const v = pg.getViewport({ scale: grande ? 1.6 : 0.8 });
          const cv = document.createElement('canvas'); cv.width = v.width; cv.height = v.height;
          cv.style.cssText = 'position:absolute;inset:0;margin:auto;max-width:100%;max-height:100%';
          if (vivo) { el.appendChild(cv); await pg.render({ canvasContext: cv.getContext('2d'), viewport: v }).promise; }
        } catch (e) { console.error('pdf', e); }
      }
    })().catch(() => {});
    return () => { vivo = false; m?.remover(); el.querySelectorAll('canvas').forEach((c) => c.remove()); };
  }, [a.id, a.tipo, a.url, a.dados, grande]);
  return (
    <div className="relative w-full overflow-hidden rounded-[14px] bg-[#140a1c]" style={{ aspectRatio: '502 / 882' }}>
      <div ref={ref} className="absolute inset-0">
        {a.tipo === 'imagem' && a.url && (<>
          <img src={a.url} alt="" className="absolute inset-[-10%] h-[120%] w-[120%] object-cover blur-2xl brightness-50" />
          <img src={a.url} alt={a.titulo} loading="lazy" className="absolute inset-0 h-full w-full object-contain" />
        </>)}
        {!a.url && a.tipo !== 'nando' && <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-white/60">Aviso na tela</div>}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------------------------- entrada com código
function Entrar({ link, aoEntrar }: { link: string | null; aoEntrar: (token: string, expira: string) => void }) {
  const carteira = !!link && link.length === 48;
  const [tel, setTel] = useState('');
  const [etapa, setEtapa] = useState<'tel' | 'cod'>('tel');
  const [destino, setDestino] = useState('');
  const [cod, setCod] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const telEnviado = useRef('');

  const pedir = async () => {
    setErro(''); setCarregando(true);
    const r = await api('pedir_codigo', { finalidade: 'acesso', link, telefone: tel });
    setCarregando(false);
    if (!r?.ok) return setErro(r?.erro || 'Não foi possível enviar o código.');
    telEnviado.current = r.telefone || tel; setDestino(r.destino); setEtapa('cod'); setCod('');
  };
  const verificar = async (c = cod) => {
    if (c.replace(/\D/g, '').length !== 6) return;
    setErro(''); setCarregando(true);
    const r = await api('verificar', { finalidade: 'acesso', link, telefone: telEnviado.current || tel, codigo: c, lembrar, aparelho: navigator.userAgent });
    setCarregando(false);
    if (!r?.ok) { setCod(''); return setErro(r?.erro || 'Código inválido.'); }
    aoEntrar(r.sessao, r.expira_em);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,#3b0d4f_0%,#120617_62%)] px-4 py-10 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"><ShieldCheck className="h-7 w-7 text-fuchsia-300" /></div>
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50">Nando · EXA</div>
          <h1 className="mt-1 text-2xl font-extrabold">Painel do síndico</h1>
          <p className="mt-2 text-sm text-white/65">Para proteger os avisos do seu prédio, o acesso é confirmado com um código que o Nando manda no seu WhatsApp.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
          {etapa === 'tel' ? (
            <>
              {!carteira && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/70">Seu celular (o cadastrado no prédio)</span>
                  <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 focus-within:border-fuchsia-400">
                    <Smartphone className="h-4 w-4 text-white/40" />
                    <input inputMode="tel" autoComplete="tel" placeholder="(45) 99999-9999" value={tel} onChange={(e) => setTel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && pedir()} className="w-full bg-transparent py-3 text-base outline-none placeholder:text-white/30" />
                  </div>
                </label>
              )}
              {carteira && <p className="text-sm text-white/75">Vamos mandar o código para o WhatsApp que recebeu este link.</p>}
              <button onClick={pedir} disabled={carregando || (!carteira && tel.replace(/\D/g, '').length < 10)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-3 font-bold shadow-lg transition hover:brightness-110 disabled:opacity-40">
                {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />} Receber código no WhatsApp
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-white/75">Mandamos um código de 6 dígitos para o WhatsApp <b className="text-white">{destino}</b>.</p>
              <input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={cod}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setCod(v); if (v.length === 6) verificar(v); }}
                placeholder="••••••" className="mt-4 w-full rounded-xl border border-white/15 bg-black/30 py-3 text-center text-3xl font-extrabold tracking-[0.5em] outline-none placeholder:text-white/20 focus:border-fuchsia-400" />
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-white/[0.04] p-3 text-sm">
                <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} className="mt-0.5 h-4 w-4 accent-fuchsia-500" />
                <span><b>Lembrar este aparelho por 30 dias</b><br /><span className="text-xs text-white/55">Sem marcar, o acesso vale 12 horas. Para alterar avisos pelo site, sempre pedimos um código novo.</span></span>
              </label>
              <button onClick={() => verificar()} disabled={carregando || cod.length !== 6}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-3 font-bold shadow-lg transition hover:brightness-110 disabled:opacity-40">
                {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Entrar
              </button>
              <button onClick={() => { setEtapa('tel'); setErro(''); }} className="mt-3 w-full text-center text-xs text-white/55 hover:text-white">Não chegou? Pedir outro código</button>
            </>
          )}
          {erro && <div className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{erro}</div>}
        </div>
        <p className="mt-5 text-center text-xs text-white/40">A EXA nunca pede esse código por telefone ou mensagem.</p>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------------------------- confirmação de alteração
function ConfirmarCodigo({ sessao, aoConfirmar, aoFechar }: { sessao: string; aoConfirmar: () => void; aoFechar: () => void }) {
  const [destino, setDestino] = useState(''); const [cod, setCod] = useState('');
  const [erro, setErro] = useState(''); const [carregando, setCarregando] = useState(true);
  const pedir = useCallback(async () => {
    setErro(''); setCarregando(true);
    const r = await api('pedir_codigo', { finalidade: 'alterar', sessao });
    setCarregando(false);
    if (!r?.ok) setErro(r?.erro || 'Não consegui mandar o código.'); else setDestino(r.destino);
  }, [sessao]);
  useEffect(() => { pedir(); }, [pedir]);
  const verificar = async (c: string) => {
    setCarregando(true); setErro('');
    const r = await api('verificar', { finalidade: 'alterar', sessao, codigo: c });
    setCarregando(false);
    if (!r?.ok) { setCod(''); return setErro(r?.erro || 'Código inválido.'); }
    aoConfirmar();
  };
  return (
    <Modal aoFechar={aoFechar} titulo="Confirme pelo WhatsApp">
      <p className="text-sm text-white/75">Para alterar avisos pelo site, o Nando manda um código novo{destino ? <> para <b className="text-white">{destino}</b></> : ''}. Ele libera alterações por 15 minutos.</p>
      <input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={cod}
        onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setCod(v); if (v.length === 6) verificar(v); }}
        placeholder="••••••" className="mt-4 w-full rounded-xl border border-white/15 bg-black/30 py-3 text-center text-3xl font-extrabold tracking-[0.5em] outline-none placeholder:text-white/20 focus:border-fuchsia-400" />
      {carregando && <div className="mt-3 flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Aguarde…</div>}
      {erro && <div className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{erro}</div>}
      <button onClick={pedir} className="mt-3 text-xs text-white/55 hover:text-white">Pedir outro código</button>
    </Modal>
  );
}

function Modal({ titulo, children, aoFechar, largo = false }: { titulo: string; children: ReactNode; aoFechar: () => void; largo?: boolean }) {
  useEffect(() => { const f = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [aoFechar]);
  return (
    <div onClick={aoFechar} className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4">
      <div onClick={(e) => e.stopPropagation()} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#1b0f22] p-5 text-white shadow-2xl sm:rounded-3xl ${largo ? 'sm:max-w-3xl' : 'sm:max-w-md'}`}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg font-extrabold">{titulo}</h2>
          <button onClick={aoFechar} className="rounded-full bg-white/10 p-1.5 hover:bg-white/20"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------------------------- painel
export default function NandoPainel() {
  const partes = window.location.pathname.split('/').filter(Boolean);
  const link = partes[1] === 'predio' ? (partes[2] || null) : null;
  const [sessao, setSessao] = useState<string | null>(() => lerSessao());
  const [d, setD] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [predioSel, setPredioSel] = useState<string>('todos');
  const [filtro, setFiltro] = useState<'todos' | 'no_ar' | 'agendado' | 'saindo'>('todos');
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState<{ a: Aviso; g: Grupo } | null>(null);
  const [editar, setEditar] = useState<'datas' | 'tempo' | 'texto' | 'remover' | null>(null);
  const [pendente, setPendente] = useState<{ acao: Acao; a: Aviso; todos: boolean } | null>(null);
  const [pedirCodigo, setPedirCodigo] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => { document.title = 'Painel do síndico · Nando · EXA'; }, []);

  const carregar = useCallback(async (s = sessao) => {
    if (!s) { setCarregando(false); return; }
    setCarregando(true); setErro('');
    const r = await api('dados', { sessao: s, link });
    setCarregando(false);
    if (r?.precisa_login) { limparSessao(); setSessao(null); return; }
    if (!r?.ok) return setErro(r?.erro || 'Não consegui carregar os avisos.');
    setD(r);
    if (r.foco && r.predios.some((g: Grupo) => g.id === r.foco)) setPredioSel(r.foco);
    else if (r.predios.length === 1) setPredioSel(r.predios[0].id);
  }, [sessao, link]);
  useEffect(() => { carregar(); }, [carregar]);

  const todos = useMemo(() => (d?.predios || []).flatMap((g) => g.avisos.map((a) => ({ a, g }))), [d]);
  const kpi = useMemo(() => ({
    predios: d?.predios.length || 0,
    noAr: todos.filter((x) => x.a.status === 'no_ar').length,
    agendados: todos.filter((x) => x.a.status === 'agendado').length,
    saindo: todos.filter((x) => emDias(x.a.fim) <= 7).length,
    vazios: (d?.predios || []).filter((g) => !g.avisos.some((a) => a.status === 'no_ar')).length,
  }), [d, todos]);
  const grupos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (d?.predios || [])
      .filter((g) => predioSel === 'todos' || g.id === predioSel)
      .filter((g) => !q || g.predio.toLowerCase().includes(q) || g.avisos.some((a) => a.titulo.toLowerCase().includes(q)))
      .map((g) => ({ ...g, avisos: g.avisos.filter((a) => (filtro === 'todos' || (filtro === 'saindo' ? emDias(a.fim) <= 7 : a.status === filtro)) && (!q || g.predio.toLowerCase().includes(q) || a.titulo.toLowerCase().includes(q))) }));
  }, [d, predioSel, filtro, busca]);

  const executarAcao = useCallback(async (p: { acao: Acao; a: Aviso; todos: boolean }) => {
    if (!sessao) return;
    const { op, ...resto } = p.acao as any;
    const r = await api('alterar', { sessao, aviso: p.a.id, operacao: op, todos_os_predios: p.todos, ...resto });
    if (r?.precisa_codigo) { setPendente(p); setPedirCodigo(true); return; }
    if (r?.precisa_login) { limparSessao(); setSessao(null); return; }
    setPendente(null); setEditar(null); setAberto(null);
    setAviso({ ok: !!r?.ok, texto: r?.resultado || r?.erro || 'Pronto.' });
    carregar();
  }, [sessao, carregar]);

  const sair = async (todosAparelhos: boolean) => {
    if (sessao) await api('sair', { sessao, todos: todosAparelhos });
    limparSessao(); setSessao(null); setD(null); setMenu(false);
  };

  if (!sessao) return <Entrar link={link} aoEntrar={(t, e) => { salvarSessao(t, e); setSessao(t); }} />;

  const whats = `https://wa.me/${d?.whatsapp_nando || '554591132351'}?text=${encodeURIComponent('Oi Nando! Quero criar um aviso.')}`;
  const umSo = (d?.predios.length || 0) === 1;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,#3b0d4f_0%,#120617_55%)] pb-28 text-white">
      {/* topo */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#140a1c]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Nando · EXA · Painel do síndico</div>
            <div className="truncate text-lg font-extrabold">{d ? `Olá, ${d.primeiro_nome || d.pessoa || 'síndico'}` : 'Carregando…'}</div>
          </div>
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15">
              <ShieldCheck className="h-4 w-4 text-emerald-300" /> <span className="hidden sm:inline">Acesso protegido</span>
            </button>
            {menu && d && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/10 bg-[#1b0f22] p-3 text-sm shadow-2xl">
                <div className="text-white/70">WhatsApp {d.telefone}</div>
                <div className="mt-1 text-xs text-white/50">{d.lembrar ? 'Aparelho lembrado' : 'Acesso de 12 horas'} até {fmt(d.expira_em)} · {d.aparelhos} aparelho{d.aparelhos > 1 ? 's' : ''} com acesso</div>
                <button onClick={() => sair(false)} className="mt-3 flex w-full items-center gap-2 rounded-xl bg-white/5 px-3 py-2 hover:bg-white/10"><LogOut className="h-4 w-4" /> Sair deste aparelho</button>
                <button onClick={() => sair(true)} className="mt-2 flex w-full items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-red-200 hover:bg-red-500/20"><LogOut className="h-4 w-4" /> Sair de todos os aparelhos</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        {carregando && !d && <div className="flex items-center justify-center gap-2 py-24 text-white/70"><Loader2 className="h-5 w-5 animate-spin" /> Conferindo as telas dos prédios…</div>}
        {erro && <div className="mt-6 rounded-xl bg-red-500/15 p-4 text-red-200">{erro} <button onClick={() => carregar()} className="ml-2 underline">Tentar de novo</button></div>}

        {d && (
          <>
            {/* números */}
            <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { t: umSo ? 'Prédio' : 'Prédios', v: umSo ? d.predios[0].predio : kpi.predios, s: !umSo && kpi.vazios ? `${kpi.vazios} sem aviso no ar` : d.predios[0]?.codigo ? `código ${d.predios[0].codigo}` : '', i: Building2, f: null },
                { t: 'No ar agora', v: kpi.noAr, s: 'aparecendo nas telas', i: Eye, f: 'no_ar' as const },
                { t: 'Agendados', v: kpi.agendados, s: 'vão entrar sozinhos', i: CalendarClock, f: 'agendado' as const },
                { t: 'Saem em 7 dias', v: kpi.saindo, s: 'confira se ainda valem', i: Timer, f: 'saindo' as const },
              ].map((k) => (
                <button key={k.t} onClick={() => k.f && setFiltro(filtro === k.f ? 'todos' : k.f)}
                  className={`rounded-2xl border p-4 text-left transition ${k.f && filtro === k.f ? 'border-fuchsia-400/60 bg-fuchsia-500/15' : 'border-white/10 bg-white/[0.05] hover:bg-white/[0.08]'}`}>
                  <div className="flex items-center gap-2 text-xs font-semibold text-white/60"><k.i className="h-4 w-4" /> {k.t}</div>
                  <div className={`mt-1 font-extrabold ${typeof k.v === 'string' ? 'truncate text-lg' : 'text-3xl'}`}>{k.v}</div>
                  {k.s && <div className="truncate text-xs text-white/45">{k.s}</div>}
                </button>
              ))}
            </section>

            {/* prédios e busca */}
            {!umSo && (
              <section className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 sm:w-72">
                  <Search className="h-4 w-4 text-white/40" />
                  <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar prédio ou aviso" className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-white/35" />
                </div>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                  {[{ id: 'todos', predio: `Todos (${d.predios.length})` }, ...d.predios].map((g) => {
                    const n = 'avisos' in g ? (g as Grupo).avisos.filter((a) => a.status === 'no_ar').length : null;
                    return (
                      <button key={g.id} onClick={() => setPredioSel(g.id)}
                        className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${predioSel === g.id ? 'bg-white text-[#1b0f22]' : 'bg-white/10 text-white/80 hover:bg-white/15'}`}>
                        {g.predio}{n !== null && <span className={`ml-1.5 ${predioSel === g.id ? 'text-[#1b0f22]/60' : 'text-white/45'}`}>{n}</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* avisos por prédio */}
            {grupos.map((g) => {
              const noAr = g.avisos.filter((a) => a.status === 'no_ar');
              const volta = (d.predios.find((x) => x.id === g.id)?.avisos || []).filter((a) => a.status === 'no_ar').reduce((s, a) => s + (a.segundos || 15), 0);
              const totalNoAr = (d.predios.find((x) => x.id === g.id)?.avisos || []).filter((a) => a.status === 'no_ar').length;
              return (
                <section key={g.id} className="mt-8">
                  <div className="mb-3 flex items-end justify-between gap-3 border-b border-white/10 pb-2">
                    <div>
                      <h2 className="text-xl font-extrabold">{g.predio} {g.codigo && <span className="text-sm font-semibold text-white/40">· {g.codigo}</span>}</h2>
                      <div className="text-xs text-white/55">{totalNoAr === 0 ? 'Nenhum aviso no ar' : totalNoAr === 1 ? '1 aviso no ar, fixo na tela' : `${totalNoAr} avisos no rodízio · volta completa a cada ${volta}s`}</div>
                    </div>
                  </div>
                  {g.avisos.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-white/55">
                      {filtro === 'todos' ? 'O quadro de avisos deste prédio está vazio.' : 'Nenhum aviso neste filtro.'}{' '}
                      <a href={whats} target="_blank" rel="noreferrer" className="font-semibold text-fuchsia-300 hover:underline">Criar um aviso com o Nando</a>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                      {g.avisos.map((a) => (
                        <button key={a.id} onClick={() => { setAberto({ a, g }); setEditar(null); }} className="group text-left">
                          <div className="rounded-[18px] bg-gradient-to-b from-[#4b4b52] to-[#1c1c20] p-[5px] shadow-xl transition group-hover:-translate-y-0.5 group-hover:shadow-fuchsia-900/40">
                            <TelaAviso a={a} />
                          </div>
                          <div className="mt-2 px-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 shrink-0 rounded-full ${a.status === 'no_ar' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              <span className="line-clamp-2 text-sm font-bold leading-snug">{a.titulo}</span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-white/55">
                              {a.status === 'agendado' ? `Começa ${fmt(a.inicio)}` : noAr.length > 1 || totalNoAr > 1 ? `${a.segundos}s no rodízio` : 'Fixo na tela'}
                              {' · '}{a.fim ? `sai ${fmt(a.fim)}` : 'sem saída'}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {a.em_grupo && <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-200">vários prédios</span>}
                              {a.repete && <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-200">se repete</span>}
                              {a.antigo && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">antes do Nando</span>}
                              {emDias(a.fim) <= 7 && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">sai em breve</span>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </>
        )}
      </main>

      {/* criar pelo WhatsApp */}
      <a href={whats} target="_blank" rel="noreferrer"
        className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-3.5 text-sm font-bold shadow-2xl shadow-emerald-900/50 transition hover:brightness-110">
        <MessageCircle className="h-5 w-5" /> Criar aviso com o Nando
      </a>

      {/* detalhes do aviso */}
      {aberto && !pedirCodigo && (
        <Modal titulo={aberto.a.titulo} aoFechar={() => { setAberto(null); setEditar(null); }} largo>
          <div className="grid gap-5 sm:grid-cols-[230px_1fr]">
            <div className="mx-auto w-full max-w-[230px]">
              <div className="rounded-[18px] bg-gradient-to-b from-[#4b4b52] to-[#1c1c20] p-[5px]"><TelaAviso a={aberto.a} grande /></div>
              {aberto.a.url && <a href={aberto.a.url} target="_blank" rel="noreferrer" className="mt-2 block text-center text-xs text-fuchsia-300 hover:underline">Abrir arquivo original</a>}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-widest text-white/45">{aberto.g.predio}{aberto.a.serie ? ` · cartão ${aberto.a.serie}` : ''}</div>
              <dl className="mt-3 grid gap-2 text-sm">
                <Linha i={Eye} t="Situação" v={aberto.a.status === 'no_ar' ? 'No ar agora' : `Agendado · começa ${fmt(aberto.a.inicio)}`} />
                <Linha i={Clock} t="Tempo na tela" v={aberto.g.avisos.length > 1 ? `${aberto.a.segundos}s a cada volta do rodízio` : `${aberto.a.segundos}s (fixo enquanto for o único)`} />
                <Linha i={Timer} t="Sai da tela" v={aberto.a.fim ? fmt(aberto.a.fim, true) : 'Sem data de saída'} />
                <Linha i={Pencil} t="Cadastrado por" v={`${aberto.a.criado_por || 'não informado'}${aberto.a.criado_em ? ` · ${fmt(aberto.a.criado_em, true)}` : ''}`} />
                {aberto.a.repete && <Linha i={Repeat} t="Repetição" v="O Nando coloca e tira sozinho em cada vez" />}
                {!!aberto.a.grupo_predios?.length && <Linha i={Layers} t="Também está em" v={aberto.a.grupo_predios.filter((n) => n !== aberto.g.predio).join(', ') || '—'} />}
              </dl>

              {!editar && (
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <BotaoAcao i={CalendarClock} t="Mudar saída" onClick={() => setEditar('datas')} />
                  <BotaoAcao i={Clock} t="Tempo na tela" onClick={() => setEditar('tempo')} />
                  {aberto.a.tipo === 'nando' && <BotaoAcao i={Pencil} t="Editar texto" onClick={() => setEditar('texto')} />}
                  <BotaoAcao i={Trash2} t="Tirar do ar" perigo onClick={() => setEditar('remover')} />
                </div>
              )}
              {editar && <FormAcao tipo={editar} a={aberto.a} aoCancelar={() => setEditar(null)} aoEnviar={(acao, todos) => executarAcao({ acao, a: aberto.a, todos })} />}

              {!!aberto.a.historico?.length && (
                <div className="mt-6">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/45"><History className="h-3.5 w-3.5" /> Histórico</div>
                  <ol className="space-y-1.5 border-l border-white/10 pl-3 text-xs">
                    {[...aberto.a.historico].reverse().map((h, i) => (
                      <li key={i} className="text-white/70"><span className="text-white/40">{fmt(h.em, true)}</span> · <b className="text-white/85">{h.quem}</b> {h.acao}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {pedirCodigo && sessao && (
        <ConfirmarCodigo sessao={sessao} aoFechar={() => { setPedirCodigo(false); setPendente(null); }}
          aoConfirmar={() => { setPedirCodigo(false); if (pendente) executarAcao(pendente); }} />
      )}

      {aviso && (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-[min(92%,460px)]">
          <div className={`flex items-start gap-3 rounded-2xl p-4 text-sm shadow-2xl ${aviso.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <div className="min-w-0 flex-1 whitespace-pre-line">{aviso.texto}</div>
            <button onClick={() => setAviso(null)}><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function Linha({ i: I, t, v }: { i: any; t: string; v: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <I className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" />
      <div><dt className="text-xs text-white/50">{t}</dt><dd className="font-medium">{v}</dd></div>
    </div>
  );
}
function BotaoAcao({ i: I, t, onClick, perigo = false }: { i: any; t: string; onClick: () => void; perigo?: boolean }) {
  return (
    <button onClick={onClick} className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${perigo ? 'bg-red-500/15 text-red-200 hover:bg-red-500/25' : 'bg-white/10 hover:bg-white/15'}`}>
      <span className="flex items-center gap-2"><I className="h-4 w-4" /> {t}</span><ChevronRight className="h-4 w-4 opacity-50" />
    </button>
  );
}

function FormAcao({ tipo, a, aoCancelar, aoEnviar }: { tipo: 'datas' | 'tempo' | 'texto' | 'remover'; a: Aviso; aoCancelar: () => void; aoEnviar: (acao: Acao, todos: boolean) => void }) {
  const [fim, setFim] = useState(paraInput(a.fim));
  const [semFim, setSemFim] = useState(!a.fim);
  const [seg, setSeg] = useState(a.segundos || 15);
  const [titulo, setTitulo] = useState(a.dados?.titulo || a.titulo);
  const [quando, setQuando] = useState(a.dados?.quando || '');
  const [texto, setTexto] = useState(a.dados?.texto || '');
  const [itens, setItens] = useState(((a.dados?.itens || []) as any[]).map((x) => x?.texto || '').join('\n'));
  const [todos, setTodos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const outros = (a.grupo_predios || []).length - 1;
  const enviar = (acao: Acao) => { setEnviando(true); aoEnviar(acao, todos); };
  const campo = 'w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-fuchsia-400';
  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      {tipo === 'datas' && (<>
        <div className="mb-2 text-sm font-bold">Quando o aviso sai da tela?</div>
        <input type="datetime-local" disabled={semFim} value={fim} onChange={(e) => setFim(e.target.value)} className={campo} />
        <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={semFim} onChange={(e) => setSemFim(e.target.checked)} className="accent-fuchsia-500" /> Sem data de saída</label>
      </>)}
      {tipo === 'tempo' && (<>
        <div className="mb-2 text-sm font-bold">Tempo na tela a cada volta: {seg}s</div>
        <input type="range" min={5} max={60} step={5} value={seg} onChange={(e) => setSeg(Number(e.target.value))} className="w-full accent-fuchsia-500" />
        <div className="mt-1 text-xs text-white/50">Avisos longos (listas, regras) pedem 20–30s.</div>
      </>)}
      {tipo === 'texto' && (<div className="grid gap-2">
        <label className="text-xs text-white/60">Título<input value={titulo} maxLength={60} onChange={(e) => setTitulo(e.target.value)} className={`${campo} mt-1`} /></label>
        <label className="text-xs text-white/60">Quando / onde<input value={quando} maxLength={60} onChange={(e) => setQuando(e.target.value)} className={`${campo} mt-1`} /></label>
        {(a.dados?.itens || []).length ? (
          <label className="text-xs text-white/60">Itens (um por linha)<textarea rows={6} value={itens} onChange={(e) => setItens(e.target.value)} className={`${campo} mt-1`} /></label>
        ) : (
          <label className="text-xs text-white/60">Texto<textarea rows={3} value={texto} maxLength={160} onChange={(e) => setTexto(e.target.value)} className={`${campo} mt-1`} /></label>
        )}
      </div>)}
      {tipo === 'remover' && <div className="text-sm">Tirar <b>“{a.titulo}”</b> da tela agora? Ele some do elevador em até 10 minutos.</div>}
      {outros > 0 && (
        <label className="mt-3 flex items-start gap-2 rounded-xl bg-violet-500/10 p-3 text-sm">
          <input type="checkbox" checked={todos} onChange={(e) => setTodos(e.target.checked)} className="mt-0.5 accent-fuchsia-500" />
          <span>Fazer o mesmo nos outros {outros} prédio{outros > 1 ? 's' : ''} onde esse aviso está<br /><span className="text-xs text-white/50">{(a.grupo_predios || []).join(', ')}</span></span>
        </label>
      )}
      <div className="mt-4 flex gap-2">
        <button onClick={aoCancelar} className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-semibold hover:bg-white/15">Cancelar</button>
        <button disabled={enviando}
          onClick={() => enviar(tipo === 'datas' ? { op: 'datas', fim, sem_fim: semFim } : tipo === 'tempo' ? { op: 'tempo', segundos: seg } : tipo === 'texto' ? { op: 'texto', titulo, quando, texto, itens: itens.split('\n') } : { op: 'remover' })}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold ${tipo === 'remover' ? 'bg-red-500 hover:bg-red-400' : 'bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:brightness-110'} disabled:opacity-50`}>
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} {tipo === 'remover' ? 'Tirar do ar' : 'Salvar'}
        </button>
      </div>
      <div className="mt-2 text-center text-[11px] text-white/45">Alterações pelo site são confirmadas com um código no WhatsApp.</div>
    </div>
  );
}
