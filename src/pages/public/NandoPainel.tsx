// Painel do síndico (EXA Mídia): examidia.com.br/nando/painel e os links /nando/predio/<token> que o Nando manda.
// Entrar: código de 6 dígitos no WhatsApp (12 h ou "lembrar este aparelho" 30 dias).
// Alterar qualquer aviso pelo site: pede um código novo na hora, mesmo com o aparelho lembrado.
// Visual: identidade do site da EXA (cabeçalho vermelho #9C1E1E→#180A0A, logo branco, Montserrat, fundo claro).
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Building2, CalendarClock, ChevronRight, Clock, Eye, History, Layers, Loader2, Lock, LogOut, MessageCircle, Pencil, Repeat,
  Search, ShieldCheck, Timer, Trash2, X,
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
  | { op: 'remover' } | { op: 'datas'; fim: string; sem_fim: boolean } | { op: 'tempo'; segundos: number }
  | { op: 'texto'; titulo: string; quando: string; texto: string; itens: string[] };

const LOGO = '/exa-logo.png';
const FONTE = { fontFamily: 'Montserrat, Inter, system-ui, -apple-system, sans-serif' };
const CABECALHO = 'bg-gradient-to-r from-[#9C1E1E] to-[#180A0A]';
const BTN = 'inline-flex items-center justify-center gap-2 rounded-lg bg-[#9C1E1E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#7E1717] disabled:cursor-not-allowed disabled:opacity-40';
const BTN2 = 'inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50';
const CAMPO = 'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[#9C1E1E] focus:ring-2 focus:ring-[#9C1E1E]/15';

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
const mascaraTel = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

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

// ------------------------------------------------------------------------- a tela do aviso (como no elevador)
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
    <div className="rounded-xl bg-neutral-900 p-1 shadow-sm ring-1 ring-black/5">
      <div className="relative w-full overflow-hidden rounded-lg bg-[#140a1c]" style={{ aspectRatio: '502 / 882' }}>
        <div ref={ref} className="absolute inset-0">
          {a.tipo === 'imagem' && a.url && (<>
            <img src={a.url} alt="" className="absolute inset-[-10%] h-[120%] w-[120%] object-cover blur-2xl brightness-50" />
            <img src={a.url} alt={a.titulo} loading="lazy" className="absolute inset-0 h-full w-full object-contain" />
          </>)}
          {!a.url && a.tipo !== 'nando' && <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-white/60">Aviso na tela</div>}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------- campo de 6 dígitos
function CampoCodigo({ valor, aoMudar, aoCompletar, desativado }: { valor: string; aoMudar: (v: string) => void; aoCompletar: (v: string) => void; desativado?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const dig = valor.padEnd(6, ' ').slice(0, 6).split('');
  const definir = (v: string) => { const s = v.replace(/\D/g, '').slice(0, 6); aoMudar(s); if (s.length === 6) aoCompletar(s); };
  useEffect(() => { refs.current[0]?.focus(); }, []);
  return (
    <div className="flex justify-between gap-2" onPaste={(e) => { e.preventDefault(); definir(e.clipboardData.getData('text')); }}>
      {dig.map((c, i) => (
        <input key={i} ref={(r) => { refs.current[i] = r; }} disabled={desativado} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
          value={c.trim()} maxLength={6} aria-label={`Dígito ${i + 1}`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '');
            if (v.length > 1) { definir(v); return; }
            const arr = valor.padEnd(6, ' ').split(''); arr[i] = v || ' ';
            const novo = arr.join('').replace(/\s+$/, '').replace(/\s/g, '');
            aoMudar(novo); if (v && i < 5) refs.current[i + 1]?.focus();
            if (novo.length === 6) aoCompletar(novo);
          }}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !c.trim() && i > 0) refs.current[i - 1]?.focus(); }}
          className="h-14 w-full rounded-lg border border-neutral-300 bg-white text-center text-2xl font-bold text-neutral-900 outline-none transition focus:border-[#9C1E1E] focus:ring-2 focus:ring-[#9C1E1E]/15 disabled:bg-neutral-100" />
      ))}
    </div>
  );
}

// ------------------------------------------------------------------------- entrada com código
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
    if (c.replace(/\D/g, '').length !== 6 || carregando) return;
    setErro(''); setCarregando(true);
    const r = await api('verificar', { finalidade: 'acesso', link, telefone: telEnviado.current || tel, codigo: c, lembrar, aparelho: navigator.userAgent });
    setCarregando(false);
    if (!r?.ok) { setCod(''); return setErro(r?.erro || 'Código inválido.'); }
    aoEntrar(r.sessao, r.expira_em);
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 lg:flex-row" style={FONTE}>
      {/* marca */}
      <div className={`${CABECALHO} flex flex-col justify-between px-6 py-6 text-white lg:w-[44%] lg:px-14 lg:py-12`}>
        <img src={LOGO} alt="EXA Mídia" className="h-9 w-auto self-start lg:h-12" />
        <div className="hidden lg:block">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Área do síndico</div>
          <h1 className="mt-3 text-4xl font-bold leading-tight">Os avisos do seu condomínio,<br />sob seu controle.</h1>
          <p className="mt-4 max-w-md text-white/75">Veja tudo o que está passando nas telas dos elevadores, a programação de cada aviso e quem cadastrou. Ajuste datas, textos e tire avisos do ar com segurança.</p>
        </div>
        <div className="hidden text-xs text-white/50 lg:block">EXA Mídia · Publicidade inteligente em elevadores · Foz do Iguaçu/PR</div>
      </div>

      {/* formulário */}
      <div className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9C1E1E]"><Lock className="h-3.5 w-3.5" /> Acesso seguro</div>
            <h2 className="mt-2 text-2xl font-bold text-neutral-900">Painel do Síndico</h2>
            {etapa === 'tel' ? (
              <>
                <p className="mt-2 text-sm text-neutral-600">{carteira ? 'Vamos enviar um código de confirmação para o WhatsApp que recebeu este link.' : 'Informe o celular cadastrado no seu prédio. Enviaremos um código de confirmação pelo WhatsApp.'}</p>
                {!carteira && (
                  <label className="mt-6 block">
                    <span className="mb-1.5 block text-sm font-medium text-neutral-700">Celular com DDD</span>
                    <input inputMode="tel" autoComplete="tel" placeholder="(45) 99999-9999" value={tel} onChange={(e) => setTel(mascaraTel(e.target.value))}
                      onKeyDown={(e) => e.key === 'Enter' && pedir()} className={`${CAMPO} py-3 text-base`} />
                  </label>
                )}
                <button onClick={pedir} disabled={carregando || (!carteira && tel.replace(/\D/g, '').length < 10)} className={`${BTN} mt-5 w-full`}>
                  {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />} Enviar código pelo WhatsApp
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-neutral-600">Digite o código de 6 dígitos enviado para o WhatsApp <b className="text-neutral-900">{destino}</b>. Ele vale 10 minutos.</p>
                <div className="mt-6"><CampoCodigo valor={cod} aoMudar={setCod} aoCompletar={verificar} desativado={carregando} /></div>
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
                  <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#9C1E1E]" />
                  <span className="text-neutral-700"><b className="text-neutral-900">Lembrar este aparelho por 30 dias</b><br /><span className="text-xs text-neutral-500">Sem marcar, o acesso vale 12 horas. Alterações pelo site sempre pedem um novo código.</span></span>
                </label>
                <button onClick={() => verificar()} disabled={carregando || cod.length !== 6} className={`${BTN} mt-5 w-full`}>
                  {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Entrar
                </button>
                <button onClick={() => { setEtapa('tel'); setErro(''); }} className="mt-3 w-full text-center text-sm text-neutral-500 hover:text-neutral-800">Não recebeu? Enviar novo código</button>
              </>
            )}
            {erro && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{erro}</div>}
          </div>
          <p className="mt-4 text-center text-xs text-neutral-500">A EXA nunca pede este código por telefone, e-mail ou mensagem.</p>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------- janelas
function Modal({ titulo, sub, children, aoFechar, largo = false }: { titulo: string; sub?: string; children: ReactNode; aoFechar: () => void; largo?: boolean }) {
  useEffect(() => { const f = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [aoFechar]);
  return (
    <div onClick={aoFechar} className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/60 sm:items-center sm:p-4" style={FONTE}>
      <div onClick={(e) => e.stopPropagation()} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 text-neutral-900 shadow-2xl sm:rounded-2xl sm:p-6 ${largo ? 'sm:max-w-3xl' : 'sm:max-w-md'}`}>
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-neutral-100 pb-3">
          <div className="min-w-0">
            {sub && <div className="text-xs font-semibold uppercase tracking-wider text-[#9C1E1E]">{sub}</div>}
            <h2 className="text-lg font-bold leading-snug first-letter:uppercase">{titulo}</h2>
          </div>
          <button onClick={aoFechar} aria-label="Fechar" className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmarCodigo({ sessao, aoConfirmar, aoFechar }: { sessao: string; aoConfirmar: () => void; aoFechar: () => void }) {
  const [destino, setDestino] = useState(''); const [cod, setCod] = useState('');
  const [erro, setErro] = useState(''); const [carregando, setCarregando] = useState(true);
  const pedir = useCallback(async () => {
    setErro(''); setCarregando(true);
    const r = await api('pedir_codigo', { finalidade: 'alterar', sessao });
    setCarregando(false);
    if (!r?.ok) setErro(r?.erro || 'Não consegui enviar o código.'); else setDestino(r.destino);
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
    <Modal aoFechar={aoFechar} sub="Confirmação de segurança" titulo="Confirme a alteração">
      <p className="text-sm text-neutral-600">Enviamos um código para o WhatsApp {destino ? <b className="text-neutral-900">{destino}</b> : 'cadastrado'}. Depois de confirmado, você pode fazer alterações pelos próximos 15 minutos.</p>
      <div className="mt-5"><CampoCodigo valor={cod} aoMudar={setCod} aoCompletar={verificar} desativado={carregando && !destino} /></div>
      {carregando && <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Aguarde…</div>}
      {erro && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{erro}</div>}
      <button onClick={pedir} className="mt-4 text-sm text-neutral-500 hover:text-neutral-800">Enviar novo código</button>
    </Modal>
  );
}

// ------------------------------------------------------------------------- painel
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

  useEffect(() => { document.title = 'Painel do Síndico · EXA Mídia'; }, []);

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

  const whats = `https://wa.me/${d?.whatsapp_nando || '554591132351'}?text=${encodeURIComponent('Olá, Nando! Quero criar um aviso.')}`;
  const umSo = (d?.predios.length || 0) === 1;
  const inicial = (d?.primeiro_nome || d?.pessoa || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-100 pb-24 text-neutral-900" style={FONTE}>
      {/* cabeçalho no padrão do site */}
      <header className={`${CABECALHO} sticky top-0 z-30 shadow-lg`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <img src={LOGO} alt="EXA Mídia" className="h-8 w-auto sm:h-9" />
            <div className="hidden h-8 w-px bg-white/25 sm:block" />
            <div className="hidden text-sm font-semibold text-white sm:block">Painel do Síndico</div>
          </div>
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 text-white hover:bg-white/10">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-[#9C1E1E]">{inicial}</span>
              <span className="hidden text-sm font-medium sm:inline">{d ? (d.primeiro_nome || d.pessoa || 'Síndico') : '…'}</span>
            </button>
            {menu && d && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-2 text-sm text-neutral-800 shadow-xl">
                <div className="px-3 py-2">
                  <div className="font-semibold">{d.pessoa || 'Síndico'}</div>
                  <div className="text-xs text-neutral-500">WhatsApp {d.telefone}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> {d.lembrar ? 'Aparelho lembrado' : 'Acesso de 12 horas'} até {fmt(d.expira_em)}</div>
                </div>
                <div className="my-1 h-px bg-neutral-100" />
                <button onClick={() => sair(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-neutral-50"><LogOut className="h-4 w-4" /> Sair deste aparelho</button>
                <button onClick={() => sair(true)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-red-700 hover:bg-red-50"><LogOut className="h-4 w-4" /> Sair de todos os aparelhos ({d.aparelhos})</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        {carregando && !d && <div className="flex items-center justify-center gap-2 py-24 text-neutral-500"><Loader2 className="h-5 w-5 animate-spin" /> Consultando as telas dos prédios…</div>}
        {erro && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro} <button onClick={() => carregar()} className="ml-2 font-semibold underline">Tentar de novo</button></div>}

        {d && (
          <>
            <div className="mt-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold">Olá, {d.primeiro_nome || d.pessoa || 'síndico'}</h1>
                <p className="text-sm text-neutral-500">{umSo ? `Avisos do ${d.predios[0].predio}` : `Avisos dos seus ${d.predios.length} prédios`}, conferidos agora nas telas dos elevadores.</p>
              </div>
              <a href={whats} target="_blank" rel="noreferrer" className={`${BTN} mt-3 hidden sm:inline-flex`}><MessageCircle className="h-4 w-4" /> Criar aviso com o Nando</a>
            </div>

            {/* indicadores */}
            <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { t: umSo ? 'Prédio' : 'Prédios', v: umSo ? d.predios[0].predio : kpi.predios, s: !umSo && kpi.vazios ? `${kpi.vazios} sem aviso no ar` : d.predios[0]?.codigo ? `Código ${d.predios[0].codigo}` : '', i: Building2, f: null },
                { t: 'No ar agora', v: kpi.noAr, s: 'Passando nas telas', i: Eye, f: 'no_ar' as const },
                { t: 'Agendados', v: kpi.agendados, s: 'Entram automaticamente', i: CalendarClock, f: 'agendado' as const },
                { t: 'Saem em 7 dias', v: kpi.saindo, s: 'Confira se ainda valem', i: Timer, f: 'saindo' as const },
              ].map((k) => (
                <button key={k.t} onClick={() => k.f && setFiltro(filtro === k.f ? 'todos' : k.f)} disabled={!k.f}
                  className={`rounded-xl border bg-white p-4 text-left shadow-sm transition ${k.f && filtro === k.f ? 'border-[#9C1E1E] ring-2 ring-[#9C1E1E]/15' : 'border-neutral-200 enabled:hover:border-neutral-300'}`}>
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-neutral-500">{k.t}<k.i className="h-4 w-4 text-[#9C1E1E]" /></div>
                  <div className={`mt-2 font-bold text-neutral-900 ${typeof k.v === 'string' ? 'truncate text-lg' : 'text-3xl'}`}>{k.v}</div>
                  {k.s && <div className="mt-0.5 truncate text-xs text-neutral-500">{k.s}</div>}
                </button>
              ))}
            </section>

            {/* prédios e busca */}
            {!umSo && (
              <section className="mt-5 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 lg:w-72">
                    <Search className="h-4 w-4 text-neutral-400" />
                    <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar prédio ou aviso" className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-neutral-400" />
                  </div>
                  <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
                    {[{ id: 'todos', predio: `Todos os prédios` }, ...d.predios].map((g) => {
                      const n = 'avisos' in g ? (g as Grupo).avisos.filter((a) => a.status === 'no_ar').length : kpi.noAr;
                      const ativo = predioSel === g.id;
                      return (
                        <button key={g.id} onClick={() => setPredioSel(g.id)}
                          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${ativo ? 'bg-[#9C1E1E] text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>
                          {g.predio} <span className={ativo ? 'text-white/70' : 'text-neutral-400'}>{n}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* avisos por prédio */}
            {grupos.map((g) => {
              const original = d.predios.find((x) => x.id === g.id)?.avisos || [];
              const totalNoAr = original.filter((a) => a.status === 'no_ar').length;
              const volta = original.filter((a) => a.status === 'no_ar').reduce((s, a) => s + (a.segundos || 15), 0);
              return (
                <section key={g.id} className="mt-6 rounded-xl border border-neutral-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#9C1E1E]/10 text-[#9C1E1E]"><Building2 className="h-5 w-5" /></span>
                      <div>
                        <h2 className="text-base font-bold">{g.predio}{g.codigo && <span className="ml-1.5 text-sm font-medium text-neutral-400">· {g.codigo}</span>}</h2>
                        <div className="text-xs text-neutral-500">{totalNoAr === 0 ? 'Nenhum aviso no ar' : totalNoAr === 1 ? '1 aviso no ar · fixo na tela' : `${totalNoAr} avisos no rodízio · ciclo completo de ${volta}s`}</div>
                      </div>
                    </div>
                  </div>
                  {g.avisos.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-neutral-500">
                      {filtro === 'todos' ? 'O quadro de avisos deste prédio está vazio.' : 'Nenhum aviso neste filtro.'}{' '}
                      <a href={whats} target="_blank" rel="noreferrer" className="font-semibold text-[#9C1E1E] hover:underline">Criar um aviso com o Nando</a>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-6 p-5 sm:grid-cols-3 lg:grid-cols-5">
                      {g.avisos.map((a) => (
                        <button key={a.id} onClick={() => { setAberto({ a, g }); setEditar(null); }} className="group text-left">
                          <div className="transition group-hover:-translate-y-0.5 group-hover:drop-shadow-md"><TelaAviso a={a} /></div>
                          <div className="mt-2.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
                              <span className={`h-1.5 w-1.5 rounded-full ${a.status === 'no_ar' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span className={a.status === 'no_ar' ? 'text-emerald-700' : 'text-amber-700'}>{a.status === 'no_ar' ? 'No ar' : 'Agendado'}</span>
                            </div>
                            <div className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 first-letter:uppercase">{a.titulo}</div>
                            <div className="mt-0.5 text-xs text-neutral-500">
                              {a.status === 'agendado' ? `Começa ${fmt(a.inicio)}` : totalNoAr > 1 ? `${a.segundos}s por ciclo` : 'Fixo na tela'} · {a.fim ? `até ${fmt(a.fim)}` : 'sem data de saída'}
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {a.em_grupo && <Etiqueta>Vários prédios</Etiqueta>}
                              {a.repete && <Etiqueta>Recorrente</Etiqueta>}
                              {emDias(a.fim) <= 7 && <Etiqueta cor="amber">Sai em breve</Etiqueta>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
            <p className="mt-8 text-center text-xs text-neutral-400">EXA Mídia · Publicidade inteligente em elevadores · Foz do Iguaçu/PR</p>
          </>
        )}
      </main>

      {/* criar pelo WhatsApp (celular) */}
      <a href={whats} target="_blank" rel="noreferrer" className={`${BTN} fixed bottom-5 left-4 right-4 z-40 shadow-xl sm:hidden`}>
        <MessageCircle className="h-5 w-5" /> Criar aviso com o Nando
      </a>

      {/* detalhes do aviso */}
      {aberto && !pedirCodigo && (
        <Modal titulo={aberto.a.titulo} sub={`${aberto.g.predio}${aberto.a.serie ? ` · cartão ${aberto.a.serie}` : ''}`} aoFechar={() => { setAberto(null); setEditar(null); }} largo>
          <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
            <div className="mx-auto w-full max-w-[220px]">
              <TelaAviso a={aberto.a} grande />
              {aberto.a.url && <a href={aberto.a.url} target="_blank" rel="noreferrer" className="mt-2 block text-center text-xs font-semibold text-[#9C1E1E] hover:underline">Abrir arquivo original</a>}
            </div>
            <div className="min-w-0">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Linha i={Eye} t="Situação" v={aberto.a.status === 'no_ar' ? 'No ar agora' : `Agendado · começa ${fmt(aberto.a.inicio)}`} />
                <Linha i={Clock} t="Tempo na tela" v={aberto.g.avisos.length > 1 ? `${aberto.a.segundos}s por ciclo` : `${aberto.a.segundos}s · fixo`} />
                <Linha i={Timer} t="Sai da tela" v={aberto.a.fim ? fmt(aberto.a.fim, true) : 'Sem data de saída'} />
                <Linha i={Pencil} t="Cadastrado por" v={`${aberto.a.criado_por || 'Não informado'}${aberto.a.criado_em ? ` · ${fmt(aberto.a.criado_em, true)}` : ''}`} />
                {aberto.a.repete && <Linha i={Repeat} t="Recorrência" v="Publicado e retirado automaticamente a cada vez" />}
                {!!aberto.a.grupo_predios?.length && <Linha i={Layers} t="Também publicado em" v={aberto.a.grupo_predios.filter((n) => n !== aberto.g.predio).join(', ') || '—'} />}
              </dl>

              {!editar && (
                <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <BotaoAcao i={CalendarClock} t="Alterar data de saída" onClick={() => setEditar('datas')} />
                  <BotaoAcao i={Clock} t="Alterar tempo na tela" onClick={() => setEditar('tempo')} />
                  {aberto.a.tipo === 'nando' && <BotaoAcao i={Pencil} t="Editar texto" onClick={() => setEditar('texto')} />}
                  <BotaoAcao i={Trash2} t="Retirar do ar" perigo onClick={() => setEditar('remover')} />
                </div>
              )}
              {editar && <FormAcao key={editar} tipo={editar} a={aberto.a} aoCancelar={() => setEditar(null)} aoEnviar={(acao, todos) => executarAcao({ acao, a: aberto.a, todos })} />}

              {!!aberto.a.historico?.length && (
                <div className="mt-6">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500"><History className="h-3.5 w-3.5" /> Histórico</div>
                  <ol className="space-y-2 border-l-2 border-neutral-100 pl-3 text-xs">
                    {[...aberto.a.historico].reverse().map((h, i) => (
                      <li key={i} className="text-neutral-600"><span className="text-neutral-400">{fmt(h.em, true)}</span> · <b className="text-neutral-800">{h.quem}</b> {h.acao}</li>
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
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-[min(92%,480px)] sm:bottom-6" style={FONTE}>
          <div className={`flex items-start gap-3 rounded-xl border bg-white p-4 text-sm shadow-2xl ${aviso.ok ? 'border-emerald-200' : 'border-red-200'}`}>
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${aviso.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <div className="min-w-0 flex-1 whitespace-pre-line text-neutral-800">{aviso.texto}</div>
            <button onClick={() => setAviso(null)} aria-label="Fechar" className="text-neutral-400 hover:text-neutral-700"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function Etiqueta({ children, cor = 'neutro' }: { children: ReactNode; cor?: 'neutro' | 'amber' }) {
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${cor === 'amber' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-neutral-100 text-neutral-600'}`}>{children}</span>;
}
function Linha({ i: I, t, v }: { i: any; t: string; v: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-neutral-50 p-3">
      <I className="mt-0.5 h-4 w-4 shrink-0 text-[#9C1E1E]" />
      <div className="min-w-0"><dt className="text-xs text-neutral-500">{t}</dt><dd className="font-semibold text-neutral-900">{v}</dd></div>
    </div>
  );
}
function BotaoAcao({ i: I, t, onClick, perigo = false }: { i: any; t: string; onClick: () => void; perigo?: boolean }) {
  return (
    <button onClick={onClick} className={`flex items-center justify-between gap-2 rounded-lg border px-3.5 py-3 text-sm font-semibold transition ${perigo ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-neutral-200 text-neutral-800 hover:bg-neutral-50'}`}>
      <span className="flex items-center gap-2"><I className="h-4 w-4" /> {t}</span><ChevronRight className="h-4 w-4 opacity-40" />
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
  const enviar = (acao: Acao) => { setEnviando(true); aoEnviar(acao, todos); setTimeout(() => setEnviando(false), 4000); };
  return (
    <div className="mt-6 rounded-xl border border-neutral-200 p-4">
      {tipo === 'datas' && (<>
        <div className="mb-2 text-sm font-semibold">Quando o aviso deve sair da tela?</div>
        <input type="datetime-local" disabled={semFim} value={fim} onChange={(e) => setFim(e.target.value)} className={CAMPO} />
        <label className="mt-2 flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={semFim} onChange={(e) => setSemFim(e.target.checked)} className="accent-[#9C1E1E]" /> Sem data de saída</label>
      </>)}
      {tipo === 'tempo' && (<>
        <div className="mb-2 flex items-center justify-between text-sm font-semibold">Tempo na tela por ciclo <span className="text-[#9C1E1E]">{seg}s</span></div>
        <input type="range" min={5} max={60} step={5} value={seg} onChange={(e) => setSeg(Number(e.target.value))} className="w-full accent-[#9C1E1E]" />
        <div className="mt-1 text-xs text-neutral-500">Avisos com listas ou regras ficam melhores com 20 a 30 segundos.</div>
      </>)}
      {tipo === 'texto' && (<div className="grid gap-3">
        <label className="text-xs font-medium text-neutral-600">Título<input value={titulo} maxLength={60} onChange={(e) => setTitulo(e.target.value)} className={`${CAMPO} mt-1`} /></label>
        <label className="text-xs font-medium text-neutral-600">Data, horário ou local<input value={quando} maxLength={60} onChange={(e) => setQuando(e.target.value)} className={`${CAMPO} mt-1`} /></label>
        {(a.dados?.itens || []).length ? (
          <label className="text-xs font-medium text-neutral-600">Itens (um por linha)<textarea rows={6} value={itens} onChange={(e) => setItens(e.target.value)} className={`${CAMPO} mt-1`} /></label>
        ) : (
          <label className="text-xs font-medium text-neutral-600">Texto<textarea rows={3} value={texto} maxLength={160} onChange={(e) => setTexto(e.target.value)} className={`${CAMPO} mt-1`} /></label>
        )}
      </div>)}
      {tipo === 'remover' && <div className="text-sm text-neutral-700">Retirar <b className="text-neutral-900">“{a.titulo}”</b> das telas agora? Ele deixa de aparecer no elevador em até 10 minutos.</div>}
      {outros > 0 && (
        <label className="mt-4 flex items-start gap-2.5 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
          <input type="checkbox" checked={todos} onChange={(e) => setTodos(e.target.checked)} className="mt-0.5 accent-[#9C1E1E]" />
          <span>Aplicar também nos outros {outros} prédio{outros > 1 ? 's' : ''} onde este aviso está publicado<br /><span className="text-xs text-neutral-500">{(a.grupo_predios || []).join(', ')}</span></span>
        </label>
      )}
      <div className="mt-4 flex gap-2">
        <button onClick={aoCancelar} className={`${BTN2} flex-1`}>Cancelar</button>
        <button disabled={enviando}
          onClick={() => enviar(tipo === 'datas' ? { op: 'datas', fim, sem_fim: semFim } : tipo === 'tempo' ? { op: 'tempo', segundos: seg } : tipo === 'texto' ? { op: 'texto', titulo, quando, texto, itens: itens.split('\n') } : { op: 'remover' })}
          className={`${tipo === 'remover' ? BTN.replace('bg-[#9C1E1E]', 'bg-red-600').replace('hover:bg-[#7E1717]', 'hover:bg-red-700') : BTN} flex-1 py-2.5`}>
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} {tipo === 'remover' ? 'Retirar do ar' : 'Salvar alteração'}
        </button>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-neutral-500"><Lock className="h-3 w-3" /> Alterações são confirmadas com um código no WhatsApp.</div>
    </div>
  );
}
