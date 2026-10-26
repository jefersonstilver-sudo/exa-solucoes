// Painel do síndico (EXA Mídia): examidia.com.br/paineldosindico (oficial) e os links /paineldosindico/<token> que o Nando manda.
// Entrar: código de 6 dígitos no WhatsApp (12 h ou "lembrar este aparelho" 30 dias).
// Alterar qualquer aviso pelo site: pede um código novo na hora, mesmo com o aparelho lembrado.
// Visual: identidade do site da EXA (cabeçalho vermelho #9C1E1E→#180A0A, logo branco, Montserrat, fundo claro).
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Building2, CalendarClock, ChevronRight, Clock, Eye, History, Layers, Loader2, Lock, LogOut, MessageCircle, Pencil, Repeat,
  Search, ShieldCheck, Timer, Trash2, X, Maximize2, MonitorPlay, LayoutGrid,
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
const FUNDO = { ...FONTE, backgroundColor: '#0d0b0c', backgroundImage: 'radial-gradient(1200px 520px at 15% -10%, rgba(196,32,38,.35), transparent 60%), radial-gradient(900px 500px at 110% 10%, rgba(120,20,24,.28), transparent 60%)', backgroundAttachment: 'fixed' };
const VIDRO = 'border border-white/10 bg-white/[0.06] shadow-[0_8px_30px_rgba(0,0,0,.35)] backdrop-blur-xl';
const BTN = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#D9262C] to-[#9C1E1E] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(200,30,36,.35)] ring-1 ring-white/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40';
const BTN2 = 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10';
const CAMPO = 'w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#E0282E] focus:ring-2 focus:ring-[#E0282E]/25 [color-scheme:dark]';

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
    <div className="rounded-2xl bg-gradient-to-b from-[#3a3a40] to-[#121214] p-[5px] shadow-[0_12px_30px_rgba(0,0,0,.5)] ring-1 ring-white/10">
      <div className="relative w-full overflow-hidden rounded-[12px] bg-[#140a1c]" style={{ aspectRatio: '502 / 882' }}>
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

// ------------------------------------------------------------------------- réplica da tela do elevador (ao vivo)
// A tela é a MESMA dos NUCs (public/painel-web/ui); o motor /painel-web/sw.js entrega a programação do prédio ao vivo.
function TelaAoVivo({ predioId, sessao, nome }: { predioId: string; sessao: string; nome: string }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.3);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState('');
  const [lida, setLida] = useState<number | null>(null);
  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!('serviceWorker' in navigator) || !('caches' in window)) throw new Error('Este navegador não mostra a tela ao vivo. Use Chrome, Safari ou Edge atualizados.');
      const c = await caches.open('replica');
      await c.put('/painel-web/__cfg', new Response(JSON.stringify({ sessao })));
      // (navigator.serviceWorker.ready nao serve aqui: esta pagina fica fora do escopo /painel-web/)
      const reg = await navigator.serviceWorker.register('/painel-web/sw.js', { scope: '/painel-web/' });
      if (!reg.active) {
        await new Promise<void>((ok) => {
          const w = reg.installing || reg.waiting;
          if (!w) return ok();
          w.addEventListener('statechange', () => { if (w.state === 'activated') ok(); });
        });
      }
      if (vivo) setPronto(true);
    })().catch((e) => vivo && setErro(e?.message || 'Não consegui abrir a tela.'));
    const msg = (e: MessageEvent) => { if (e.data?.tipo === 'replica-lida') setLida(e.data.em); };
    navigator.serviceWorker?.addEventListener('message', msg);
    return () => { vivo = false; navigator.serviceWorker?.removeEventListener('message', msg); };
  }, [sessao]);
  useEffect(() => { setLida(null); }, [predioId]);
  useEffect(() => {
    const el = caixa.current; if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / 1080));
    ro.observe(el); setK(el.clientWidth / 1080);
    return () => ro.disconnect();
  }, []);
  return (
    <div>
      <div className="rounded-[26px] bg-gradient-to-b from-[#3a3a40] to-[#111113] p-[7px] shadow-[0_24px_60px_rgba(0,0,0,.55)] ring-1 ring-white/10">
        <div ref={caixa} className="relative w-full overflow-hidden rounded-[20px] bg-black" style={{ aspectRatio: '1080 / 1920' }}>
          {pronto && (
            <iframe key={predioId} title={`Tela do elevador · ${nome}`} src={`/painel-web/ui/index.html?p=${encodeURIComponent(predioId)}`}
              allow="autoplay" className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
              style={{ width: 1080, height: 1920, transform: `scale(${k})` }} />
          )}
          {!pronto && !erro && <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-white/55"><Loader2 className="h-4 w-4 animate-spin" /> Ligando a tela…</div>}
          {erro && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-xs text-white/65">{erro}</div>}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 px-1 text-[11px] text-white/55">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.8)]" />
          {lida ? `Ao vivo · conferido às ${new Date(lida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Ao vivo'}
        </span>
        <a href={`/painel-web/tela.html?p=${encodeURIComponent(predioId)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold text-white/70 hover:text-white"><Maximize2 className="h-3.5 w-3.5" /> Tela cheia</a>
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
          className="h-14 w-full rounded-xl border border-white/15 bg-black/30 text-center text-2xl font-bold text-white outline-none transition focus:border-[#E0282E] focus:ring-2 focus:ring-[#E0282E]/25 disabled:opacity-50" />
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

  const passos = etapa === 'tel' ? 1 : 2;
  return (
    <div className="relative flex min-h-[100svh] flex-col text-white" style={{ ...FONTE, backgroundColor: '#0c0a0b', backgroundImage: 'radial-gradient(900px 420px at 50% -10%, rgba(156,30,30,.22), transparent 70%)' }}>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)] sm:px-8">
        <img src={LOGO} alt="EXA Mídia" className="h-7 w-auto sm:h-8" />
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pb-10 pt-12 sm:items-center sm:pt-0">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E0282E]">Painel do Síndico</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">{etapa === 'tel' ? 'Acesse sua conta' : 'Confirme o acesso'}</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              {etapa === 'tel'
                ? (carteira ? 'Enviaremos um código de verificação para o WhatsApp que recebeu este link.' : 'Informe o celular cadastrado no seu condomínio. Enviaremos um código de verificação pelo WhatsApp.')
                : <>Digite o código de 6 dígitos enviado para <span className="text-white">{destino}</span>. Válido por 10 minutos.</>}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,.45)] backdrop-blur-xl sm:p-7">
            <div className="mb-5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-white/40">
              <span className={passos === 1 ? 'text-white' : ''}>1. Celular</span><span className="h-px w-6 bg-white/15" /><span className={passos === 2 ? 'text-white' : ''}>2. Código</span>
            </div>
            {etapa === 'tel' ? (
              <>
                {!carteira && (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-white/60">Celular com DDD</span>
                    <input inputMode="tel" autoComplete="tel" placeholder="(45) 99999-9999" value={tel} onChange={(e) => setTel(mascaraTel(e.target.value))}
                      onKeyDown={(e) => e.key === 'Enter' && pedir()}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-3 text-base text-white outline-none transition placeholder:text-white/30 focus:border-white/30 focus:ring-2 focus:ring-white/10" />
                  </label>
                )}
                <button onClick={pedir} disabled={carregando || (!carteira && tel.replace(/\D/g, '').length < 10)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C7141A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#d61b21] disabled:cursor-not-allowed disabled:opacity-40">
                  {carregando && <Loader2 className="h-4 w-4 animate-spin" />} Receber código pelo WhatsApp
                </button>
              </>
            ) : (
              <>
                <CampoCodigo valor={cod} aoMudar={setCod} aoCompletar={verificar} desativado={carregando} />
                <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm text-white/70">
                  <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} className="h-4 w-4 accent-[#C7141A]" />
                  Manter conectado neste aparelho por 30 dias
                </label>
                <button onClick={() => verificar()} disabled={carregando || cod.length !== 6}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C7141A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#d61b21] disabled:cursor-not-allowed disabled:opacity-40">
                  {carregando && <Loader2 className="h-4 w-4 animate-spin" />} Entrar
                </button>
                <button onClick={() => { setEtapa('tel'); setErro(''); }} className="mt-3 w-full text-center text-xs text-white/45 hover:text-white/80">Reenviar código ou trocar número</button>
              </>
            )}
            {erro && <div className="mt-4 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">{erro}</div>}
          </div>

        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl justify-center px-5 pb-[calc(env(safe-area-inset-bottom,0px)+18px)] text-[11px] text-white/35 sm:flex-row sm:px-8">
        <span>© EXA Mídia · Foz do Iguaçu/PR</span>
      </footer>
    </div>
  );
}

// ------------------------------------------------------------------------- janelas
function Modal({ titulo, sub, children, aoFechar, largo = false }: { titulo: string; sub?: string; children: ReactNode; aoFechar: () => void; largo?: boolean }) {
  useEffect(() => { const f = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [aoFechar]);
  return (
    <div onClick={aoFechar} className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4" style={FONTE}>
      <div onClick={(e) => e.stopPropagation()} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-[#171214]/95 p-5 text-white shadow-2xl backdrop-blur-xl sm:rounded-2xl sm:p-6 ${largo ? 'sm:max-w-3xl' : 'sm:max-w-md'}`}>
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div className="min-w-0">
            {sub && <div className="text-xs font-semibold uppercase tracking-wider text-[#FF6B6B]">{sub}</div>}
            <h2 className="text-lg font-bold leading-snug first-letter:uppercase">{titulo}</h2>
          </div>
          <button onClick={aoFechar} aria-label="Fechar" className="rounded-lg p-1.5 text-white/55 hover:bg-white/10"><X className="h-5 w-5" /></button>
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
      <p className="text-sm text-white/65">Enviamos um código para o WhatsApp {destino ? <b className="text-white">{destino}</b> : 'cadastrado'}. Depois de confirmado, você pode fazer alterações pelos próximos 15 minutos.</p>
      <div className="mt-5"><CampoCodigo valor={cod} aoMudar={setCod} aoCompletar={verificar} desativado={carregando && !destino} /></div>
      {carregando && <div className="mt-3 flex items-center gap-2 text-sm text-white/55"><Loader2 className="h-4 w-4 animate-spin" /> Aguarde…</div>}
      {erro && <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/100/10 px-3 py-2.5 text-sm text-red-200">{erro}</div>}
      <button onClick={pedir} className="mt-4 text-sm text-white/55 hover:text-white/90">Enviar novo código</button>
    </Modal>
  );
}

// ------------------------------------------------------------------------- painel
export default function NandoPainel() {
  const partes = window.location.pathname.split('/').filter(Boolean);
  // endereço oficial: /paineldosindico (e /paineldosindico/<link> dos links do Nando); os antigos /nando/... continuam abrindo
  const link = partes[1] === 'predio' ? (partes[2] || null) : (partes[0]?.toLowerCase() === 'paineldosindico' ? (partes[1] || null) : null);
  useEffect(() => {
    if (partes[0] === 'nando') window.history.replaceState(null, '', `/paineldosindico${link ? '/' + link : ''}${window.location.search}`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
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
  const [telaId, setTelaId] = useState<string | null>(null);
  const [aba, setAba] = useState<'tela' | 'avisos'>('tela');

  useEffect(() => {
    document.title = 'Painel do Síndico · EXA Mídia';
    // barra de status do iPhone/Android no mesmo tom do fundo (evita a "segunda tarja" vermelha do site)
    const metas = [...document.querySelectorAll('meta[name="theme-color"]')] as HTMLMetaElement[];
    const antes = metas.map((m) => m.content);
    if (!metas.length) { const m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); metas.push(m); antes.push(''); }
    metas.forEach((m) => { m.content = '#0d0b0c'; });
    document.documentElement.style.backgroundColor = '#0d0b0c';
    return () => { metas.forEach((m, i) => { m.content = antes[i]; }); };
  }, []);

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
    setTelaId((atual) => (atual && r.predios.some((g: Grupo) => g.id === atual)) ? atual : (r.foco && r.predios.some((g: Grupo) => g.id === r.foco) ? r.foco : r.predios[0]?.id || null));
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

  if (!sessao) return <Entrar link={link} aoEntrar={(t, e) => {
    salvarSessao(t, e); setSessao(t);
    // veio da tela ao vivo: volta para ela depois de entrar
    const volta = new URLSearchParams(window.location.search).get('volta') || '';
    if (volta.startsWith('/painel-web/')) window.location.href = volta;
  }} />;

  const whats = `https://wa.me/${d?.whatsapp_nando || '554591132351'}?text=${encodeURIComponent('Olá, Nando! Quero criar um aviso.')}`;
  const umSo = (d?.predios.length || 0) === 1;
  const inicial = (d?.primeiro_nome || d?.pessoa || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className="nando-ui min-h-screen pb-[calc(env(safe-area-inset-bottom,0px)+96px)] text-white sm:pb-16" style={FUNDO}>
      <style>{`
        html{color-scheme:dark;scrollbar-color:rgba(255,255,255,.16) #0d0b0c}
        .nando-ui *{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.16) transparent}
        .nando-ui ::-webkit-scrollbar{width:8px;height:8px}
        .nando-ui ::-webkit-scrollbar-track{background:transparent}
        .nando-ui ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.16);border-radius:99px}
        .nando-ui .sem-barra{scrollbar-width:none;-webkit-overflow-scrolling:touch}
        .nando-ui .sem-barra::-webkit-scrollbar{display:none}
      `}</style>
      {/* cabeçalho no padrão do site */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0d0b0c]/75 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
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
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-white/10 bg-[#171214]/95 p-2 text-sm text-white shadow-2xl backdrop-blur-xl">
                <div className="px-3 py-2">
                  <div className="font-semibold">{d.pessoa || 'Síndico'}</div>
                  <div className="text-xs text-white/55">WhatsApp {d.telefone}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> {d.lembrar ? 'Aparelho lembrado' : 'Acesso de 12 horas'} até {fmt(d.expira_em)}</div>
                </div>
                <div className="my-1 h-px bg-white/10" />
                <button onClick={() => sair(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/[0.04]"><LogOut className="h-4 w-4" /> Sair deste aparelho</button>
                <button onClick={() => sair(true)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-red-300 hover:bg-red-500/100/10"><LogOut className="h-4 w-4" /> Sair de todos os aparelhos ({d.aparelhos})</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4">
        {carregando && !d && <div className="flex items-center justify-center gap-2 py-24 text-white/55"><Loader2 className="h-5 w-5 animate-spin" /> Consultando as telas dos prédios…</div>}
        {erro && <div className="mt-6 rounded-xl border border-red-400/30 bg-red-500/100/10 p-4 text-sm text-red-200">{erro} <button onClick={() => carregar()} className="ml-2 font-semibold underline">Tentar de novo</button></div>}

        {d && (() => {
          const telaG = d.predios.find((g) => g.id === telaId) || d.predios[0];
          const noArTela = telaG ? telaG.avisos.filter((a) => a.status === 'no_ar').length : 0;
          return (
          <>
            <div className="mt-4 flex items-end justify-between gap-3 sm:mt-6">
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Olá, {d.primeiro_nome || d.pessoa || 'síndico'}</h1>
                <p className="text-sm text-white/55">{umSo ? d.predios[0].predio : `${d.predios.length} prédios`} · tela e avisos ao vivo</p>
              </div>
              <a href={whats} target="_blank" rel="noreferrer" className={`${BTN} hidden shrink-0 sm:inline-flex`}><MessageCircle className="h-4 w-4" /> Criar aviso com o Nando</a>
            </div>

            {/* celular: alterna tela / avisos */}
            <div className="sticky top-[calc(env(safe-area-inset-top,0px)+57px)] z-20 -mx-4 mt-4 bg-[#0d0b0c]/80 px-4 py-2 backdrop-blur-xl lg:hidden">
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.06] p-1">
              {([['tela', 'Tela ao vivo', MonitorPlay], ['avisos', 'Avisos', LayoutGrid]] as const).map(([v, t, I]) => (
                <button key={v} onClick={() => { setAba(v); window.scrollTo({ top: 0 }); }} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${aba === v ? 'bg-white text-[#9C1E1E] shadow' : 'text-white/70'}`}>
                  <I className="h-4 w-4" /> {t}
                </button>
              ))}
            </div>
            </div>

            <div className="mt-3 grid gap-6 lg:mt-5 lg:grid-cols-[minmax(300px,360px)_1fr] lg:items-start">
              {/* tela ao vivo do prédio escolhido */}
              <aside className={`${aba === 'tela' ? 'block' : 'hidden'} lg:sticky lg:top-24 lg:block`}>
                {telaG && sessao && (
                  <div className={`rounded-2xl p-3 sm:p-4 ${VIDRO}`}>
                    <div className="mb-3 flex items-center gap-2">
                      <MonitorPlay className="h-4 w-4 shrink-0 text-[#FF6B6B]" />
                      {d.predios.length > 1 ? (
                        <select value={telaG.id} onChange={(e) => setTelaId(e.target.value)}
                          className="min-w-0 flex-1 truncate rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-base font-semibold sm:py-1.5 sm:text-sm text-white outline-none [color-scheme:dark]">
                          {d.predios.map((g) => <option key={g.id} value={g.id}>{g.predio}</option>)}
                        </select>
                      ) : <div className="min-w-0 flex-1 truncate text-sm font-semibold">{telaG.predio}</div>}
                    </div>
                    <div className="mx-auto w-full max-w-[min(340px,calc((100svh-370px)*0.5625))] lg:max-w-none">
                      <TelaAoVivo predioId={telaG.id} sessao={sessao} nome={telaG.predio} />
                    </div>
                    <p className="mt-3 hidden text-[11px] leading-relaxed text-white/45 lg:block">A mesma programação e os mesmos arquivos do elevador. Anúncios, avisos e trocas de vídeo aparecem aqui sozinhos; o vídeo não fica no mesmo segundo do elevador.</p>
                    <button onClick={() => { setPredioSel(telaG.id); setAba('avisos'); }} className={`${BTN2} mt-3 w-full lg:hidden`}>
                      <LayoutGrid className="h-4 w-4" /> {noArTela ? `Ver os ${noArTela} aviso${noArTela > 1 ? 's' : ''} deste prédio` : 'Avisos deste prédio'}
                    </button>
                  </div>
                )}
              </aside>

              {/* avisos */}
              <div className={`${aba === 'avisos' ? 'block' : 'hidden'} min-w-0 lg:block`}>
                <section className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
                  {[
                    { t: umSo ? 'Prédio' : 'Prédios', v: umSo ? d.predios[0].predio : kpi.predios, s: !umSo && kpi.vazios ? `${kpi.vazios} sem aviso no ar` : d.predios[0]?.codigo ? `Código ${d.predios[0].codigo}` : '', i: Building2, f: null },
                    { t: 'No ar agora', v: kpi.noAr, s: 'Passando nas telas', i: Eye, f: 'no_ar' as const },
                    { t: 'Agendados', v: kpi.agendados, s: 'Entram sozinhos', i: CalendarClock, f: 'agendado' as const },
                    { t: 'Saem em 7 dias', v: kpi.saindo, s: 'Confira se valem', i: Timer, f: 'saindo' as const },
                  ].map((k) => (
                    <button key={k.t} onClick={() => k.f && setFiltro(filtro === k.f ? 'todos' : k.f)} disabled={!k.f}
                      className={`rounded-2xl border p-3 text-left backdrop-blur-xl transition sm:p-4 ${k.f && filtro === k.f ? 'border-[#E0282E]/70 bg-[#E0282E]/15 ring-2 ring-[#E0282E]/25' : 'border-white/10 bg-white/[0.06] enabled:hover:bg-white/[0.09]'}`}>
                      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-white/55">{k.t}<k.i className="h-4 w-4 text-[#FF6B6B]" /></div>
                      <div className={`mt-1 font-bold text-white sm:mt-2 ${typeof k.v === 'string' ? 'truncate text-base sm:text-lg' : 'text-2xl sm:text-3xl'}`}>{k.v}</div>
                      {k.s && <div className="mt-0.5 hidden truncate text-xs text-white/55 sm:block">{k.s}</div>}
                    </button>
                  ))}
                </section>

                {!umSo && (
                  <section className={`mt-3 rounded-2xl p-2.5 sm:mt-4 sm:p-3 ${VIDRO}`}>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 rounded-lg border border-white/15 px-3">
                        <Search className="h-4 w-4 text-white/40" />
                        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar prédio ou aviso" className="w-full bg-transparent py-2.5 text-base sm:py-2 sm:text-sm outline-none placeholder:text-white/40" />
                      </div>
                      <div className="sem-barra -mx-2.5 flex snap-x gap-1.5 overflow-x-auto scroll-px-2.5 px-2.5 sm:-mx-1 sm:px-1">
                        {[{ id: 'todos', predio: 'Todos' }, ...d.predios].map((g) => {
                          const n = 'avisos' in g ? (g as Grupo).avisos.filter((a) => a.status === 'no_ar').length : kpi.noAr;
                          const ativo = predioSel === g.id;
                          return (
                            <button key={g.id} onClick={() => { setPredioSel(g.id); if (g.id !== 'todos') setTelaId(g.id); }}
                              className={`shrink-0 snap-start whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition sm:py-1.5 ${ativo ? 'bg-gradient-to-b from-[#D9262C] to-[#9C1E1E] text-white shadow-lg' : 'bg-white/[0.07] text-white/80 hover:bg-white/[0.12]'}`}>
                              {g.predio} <span className={ativo ? 'text-white/70' : 'text-white/40'}>{n}</span>
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
                    <section key={g.id} className={`mt-3 rounded-2xl sm:mt-5 ${VIDRO}`}>
                      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E0282E]/15 text-[#FF6B6B] sm:flex"><Building2 className="h-5 w-5" /></span>
                          <div className="min-w-0">
                            <h2 className="line-clamp-2 text-[15px] font-bold leading-tight sm:text-base">{g.predio}{g.codigo && <span className="ml-1.5 text-sm font-medium text-white/40">· {g.codigo}</span>}</h2>
                            <div className="text-xs text-white/55">{totalNoAr === 0 ? 'Nenhum aviso no ar' : totalNoAr === 1 ? '1 aviso no ar · fixo na tela' : `${totalNoAr} avisos no rodízio · ciclo completo de ${volta}s`}</div>
                          </div>
                        </div>
                        <button onClick={() => { setTelaId(g.id); setAba('tela'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${telaId === g.id ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-white/15 bg-white/[0.07] text-white hover:bg-white/[0.12]'}`}>
                          <MonitorPlay className="h-3.5 w-3.5" />
                          <span className="sm:hidden">{telaId === g.id ? 'Na tela' : 'Ver'}</span>
                          <span className="hidden sm:inline">{telaId === g.id ? 'Exibindo na tela' : 'Ver na tela'}</span>
                        </button>
                      </div>
                      {g.avisos.length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-white/55">
                          {filtro === 'todos' ? 'O quadro de avisos deste prédio está vazio.' : 'Nenhum aviso neste filtro.'}{' '}
                          <a href={whats} target="_blank" rel="noreferrer" className="font-semibold text-[#FF6B6B] hover:underline">Criar um aviso com o Nando</a>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-5 p-4 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 sm:p-5 xl:grid-cols-4">
                          {g.avisos.map((a) => (
                            <button key={a.id} onClick={() => { setAberto({ a, g }); setEditar(null); }} className="group flex h-full flex-col items-stretch justify-start text-left align-top">
                              <div className="transition group-hover:-translate-y-0.5 group-hover:drop-shadow-md"><TelaAviso a={a} /></div>
                              <div className="mt-2.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
                                  <span className={`h-1.5 w-1.5 rounded-full ${a.status === 'no_ar' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.8)]' : 'bg-amber-400'}`} />
                                  <span className={a.status === 'no_ar' ? 'text-emerald-300' : 'text-amber-300'}>{a.status === 'no_ar' ? 'No ar' : 'Agendado'}</span>
                                </div>
                                <div className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-white first-letter:uppercase">{a.titulo}</div>
                                <div className="mt-0.5 text-xs text-white/55">
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
              </div>
            </div>
            <p className="mt-10 text-center text-xs text-white/40">EXA Mídia · Publicidade inteligente em elevadores · Foz do Iguaçu/PR</p>
          </>
          );
        })()}
      </main>

      {/* criar pelo WhatsApp (celular) */}
      <a href={whats} target="_blank" rel="noreferrer" className={`${BTN} fixed bottom-[calc(env(safe-area-inset-bottom,0px)+14px)] left-4 right-4 z-40 py-3.5 shadow-[0_10px_30px_rgba(0,0,0,.6)] sm:hidden`}>
        <MessageCircle className="h-5 w-5" /> Criar aviso com o Nando
      </a>

      {/* detalhes do aviso */}
      {aberto && !pedirCodigo && (
        <Modal titulo={aberto.a.titulo} sub={`${aberto.g.predio}${aberto.a.serie ? ` · cartão ${aberto.a.serie}` : ''}`} aoFechar={() => { setAberto(null); setEditar(null); }} largo>
          <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
            <div className="mx-auto w-full max-w-[220px]">
              <TelaAviso a={aberto.a} grande />
              {aberto.a.url && <a href={aberto.a.url} target="_blank" rel="noreferrer" className="mt-2 block text-center text-xs font-semibold text-[#FF6B6B] hover:underline">Abrir arquivo original</a>}
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
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/55"><History className="h-3.5 w-3.5" /> Histórico</div>
                  <ol className="space-y-2 border-l-2 border-white/10 pl-3 text-xs">
                    {[...aberto.a.historico].reverse().map((h, i) => (
                      <li key={i} className="text-white/65"><span className="text-white/40">{fmt(h.em, true)}</span> · <b className="text-white/90">{h.quem}</b> {h.acao}</li>
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
          <div className={`flex items-start gap-3 rounded-xl border bg-[#171214]/95 p-4 text-sm shadow-2xl backdrop-blur-xl ${aviso.ok ? 'border-emerald-400/40' : 'border-red-400/40'}`}>
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${aviso.ok ? 'bg-emerald-500' : 'bg-red-500/100'}`} />
            <div className="min-w-0 flex-1 whitespace-pre-line text-white/90">{aviso.texto}</div>
            <button onClick={() => setAviso(null)} aria-label="Fechar" className="text-white/40 hover:text-white/80"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function Etiqueta({ children, cor = 'neutro' }: { children: ReactNode; cor?: 'neutro' | 'amber' }) {
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${cor === 'amber' ? 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-300/30' : 'bg-white/10 text-white/70'}`}>{children}</span>;
}
function Linha({ i: I, t, v }: { i: any; t: string; v: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-white/[0.04] p-3">
      <I className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6B6B]" />
      <div className="min-w-0"><dt className="text-xs text-white/55">{t}</dt><dd className="font-semibold text-white">{v}</dd></div>
    </div>
  );
}
function BotaoAcao({ i: I, t, onClick, perigo = false }: { i: any; t: string; onClick: () => void; perigo?: boolean }) {
  return (
    <button onClick={onClick} className={`flex items-center justify-between gap-2 rounded-lg border px-3.5 py-3 text-sm font-semibold transition ${perigo ? 'border-red-400/30 text-red-300 hover:bg-red-500/100/100/10' : 'border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'}`}>
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
    <div className="mt-6 rounded-xl border border-white/10 p-4">
      {tipo === 'datas' && (<>
        <div className="mb-2 text-sm font-semibold">Quando o aviso deve sair da tela?</div>
        <input type="datetime-local" disabled={semFim} value={fim} onChange={(e) => setFim(e.target.value)} className={CAMPO} />
        <label className="mt-2 flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={semFim} onChange={(e) => setSemFim(e.target.checked)} className="accent-[#E0282E]" /> Sem data de saída</label>
      </>)}
      {tipo === 'tempo' && (<>
        <div className="mb-2 flex items-center justify-between text-sm font-semibold">Tempo na tela por ciclo <span className="text-[#FF6B6B]">{seg}s</span></div>
        <input type="range" min={5} max={60} step={5} value={seg} onChange={(e) => setSeg(Number(e.target.value))} className="w-full accent-[#E0282E]" />
        <div className="mt-1 text-xs text-white/55">Avisos com listas ou regras ficam melhores com 20 a 30 segundos.</div>
      </>)}
      {tipo === 'texto' && (<div className="grid gap-3">
        <label className="text-xs font-medium text-white/65">Título<input value={titulo} maxLength={60} onChange={(e) => setTitulo(e.target.value)} className={`${CAMPO} mt-1`} /></label>
        <label className="text-xs font-medium text-white/65">Data, horário ou local<input value={quando} maxLength={60} onChange={(e) => setQuando(e.target.value)} className={`${CAMPO} mt-1`} /></label>
        {(a.dados?.itens || []).length ? (
          <label className="text-xs font-medium text-white/65">Itens (um por linha)<textarea rows={6} value={itens} onChange={(e) => setItens(e.target.value)} className={`${CAMPO} mt-1`} /></label>
        ) : (
          <label className="text-xs font-medium text-white/65">Texto<textarea rows={3} value={texto} maxLength={160} onChange={(e) => setTexto(e.target.value)} className={`${CAMPO} mt-1`} /></label>
        )}
      </div>)}
      {tipo === 'remover' && <div className="text-sm text-white/80">Retirar <b className="text-white">“{a.titulo}”</b> das telas agora? Ele deixa de aparecer no elevador em até 10 minutos.</div>}
      {outros > 0 && (
        <label className="mt-4 flex items-start gap-2.5 rounded-lg bg-white/[0.04] p-3 text-sm text-white/80">
          <input type="checkbox" checked={todos} onChange={(e) => setTodos(e.target.checked)} className="mt-0.5 accent-[#E0282E]" />
          <span>Aplicar também nos outros {outros} prédio{outros > 1 ? 's' : ''} onde este aviso está publicado<br /><span className="text-xs text-white/55">{(a.grupo_predios || []).join(', ')}</span></span>
        </label>
      )}
      <div className="mt-4 flex gap-2">
        <button onClick={aoCancelar} className={`${BTN2} flex-1`}>Cancelar</button>
        <button disabled={enviando}
          onClick={() => enviar(tipo === 'datas' ? { op: 'datas', fim, sem_fim: semFim } : tipo === 'tempo' ? { op: 'tempo', segundos: seg } : tipo === 'texto' ? { op: 'texto', titulo, quando, texto, itens: itens.split('\n') } : { op: 'remover' })}
          className={`${tipo === 'remover' ? BTN : BTN} flex-1 py-2.5`}>
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} {tipo === 'remover' ? 'Retirar do ar' : 'Salvar alteração'}
        </button>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-white/55"><Lock className="h-3 w-3" /> Alterações são confirmadas com um código no WhatsApp.</div>
    </div>
  );
}
