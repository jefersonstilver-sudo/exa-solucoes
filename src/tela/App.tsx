/**
 * Player das telas novas. Ciclo:
 *  1) sem token → pede um código (iniciar) e mostra na tela;
 *  2) pergunta o estado a cada 5 s enquanto aguarda pareamento e a cada 60 s depois;
 *  3) pareada → monta as faixas do layout escolhido no admin e toca; baixa os vídeos para o aparelho;
 *  4) sem internet → continua com o último estado e os vídeos que já baixou.
 * Também: comandos remotos (recarregar, limpar cache), atualização automática quando o site é publicado,
 * recarga diária às 4h, tela sempre acesa.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apagar, gravar, iniciar, infoAparelho, ler, pedirEstado, plataforma, recarregar, reiniciarApp, versaoCompleta, type Estado } from './api';
import { aquecer, limparTudo, sincronizar } from './cache';
import { layoutDe, montarFaixas, urlsDoEstado } from './motor';
import { COMPONENTES, SemVideo } from './layouts';
import { devolverExibicoes, errosRecentes, registrarErro, registrarEvento, retirarEventos, retirarExibicoes, tocandoAgora } from './registro';
import { ajustarRelogio, textosDaHora, useHora } from './tempo';
import { Logo } from './widgets';

const K_TOKEN = 'exa-tela-token';
const K_ESTADO = 'exa-tela-estado';
const K_CMD = 'exa-tela-cmd-ok';

// ---------------------------------------------------------------- palco 1920×1080 escalado
function Palco({ children }: { children: React.ReactNode }) {
  const [esc, setEsc] = useState(1);
  useEffect(() => {
    const f = () => setEsc(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    f();
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return (
    <div className="palco-fora">
      <div className="palco" style={{ transform: `translate(-50%, -50%) scale(${esc})` }}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------- tela de código
function Pareamento({ codigo, online, erro }: { codigo: string | null; online: boolean; erro: string }) {
  const { hora, dataLonga } = useHora();
  const dig = (codigo || '······').split('');
  return (
    <div className="cheio fundo-exa" style={{ padding: '80px 110px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo altura={48} />
        <div style={{ textAlign: 'right' }}>
          <div className="grande" style={{ fontSize: 64, letterSpacing: -2 }}>{hora}</div>
          <div className="rotulo" style={{ fontSize: 15 }}>{dataLonga}</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 44 }}>
        <div>
          <div className="rotulo" style={{ fontSize: 20, color: '#ffc35a' }}>Nova tela EXA</div>
          <div style={{ fontSize: 76, fontWeight: 900, letterSpacing: -2.5, lineHeight: 1.05, marginTop: 14 }}>Conecte esta tela ao painel EXA</div>
        </div>
        <div style={{ display: 'flex', gap: 22 }}>
          {dig.map((d, i) => <div key={i} className="par-digito vidro" style={{ opacity: codigo ? 1 : 0.4 }}>{d}</div>)}
        </div>
        <div style={{ display: 'flex', gap: 48, fontSize: 28, fontWeight: 600, color: 'rgba(255,255,255,.88)' }}>
          <span><b style={{ color: '#ffc35a' }}>1</b>  No painel EXA, abra <b>Telas → Adicionar tela</b></span>
          <span><b style={{ color: '#ffc35a' }}>2</b>  Digite este código</span>
          <span><b style={{ color: '#ffc35a' }}>3</b>  A programação começa sozinha</span>
        </div>
      </div>
      <div className="rotulo" style={{ fontSize: 14, display: 'flex', gap: 28, color: 'rgba(255,255,255,.55)' }}>
        <span style={{ color: online ? '#7ee2a8' : '#ff8a8a' }}>{online ? '● conectada à internet' : '● sem internet — tentando de novo'}</span>
        <span>{plataforma()}</span>
        <span>{versaoCompleta()}</span>
        {erro && <span style={{ color: '#ff8a8a', textTransform: 'none', letterSpacing: 0 }}>{erro}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- protege contra erro de layout
class Protecao extends React.Component<{ e: Estado; children: React.ReactNode }, { erro: boolean }> {
  state = { erro: false };
  static getDerivedStateFromError() { return { erro: true }; }
  componentDidCatch(err: unknown) {
    registrarErro(`layout quebrou: ${String((err as Error)?.message || err).slice(0, 160)}`);
    setTimeout(() => this.setState({ erro: false }), 30000);
  }
  render() { return this.state.erro ? <SemVideo e={this.props.e} /> : this.props.children; }
}

function Programacao({ e }: { e: Estado }) {
  const layout = layoutDe(e.tela?.layout);
  // remonta as faixas só quando o conteúdo muda (não a cada batimento)
  const chave = `${e.versao}|${(e.cameras || []).length}|${(e.noticias || []).map((n) => n.titulo).join('|').length}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const faixas = useMemo(() => montarFaixas(e, layout), [chave, layout.id]);
  const C = COMPONENTES[layout.id] || COMPONENTES.H1;
  return <Protecao e={e}><C e={e} f={faixas} layout={layout} /></Protecao>;
}

// ---------------------------------------------------------------- app
export default function App() {
  const [estado, setEstado] = useState<Estado | null>(() => { const s = ler<Estado | null>(K_ESTADO, null); return s?.pareada ? s : null; });
  const [codigo, setCodigo] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [erro, setErro] = useState('');
  const token = useRef<string>(ler<string>(K_TOKEN, ''));
  const ultimoInfo = useRef(0);

  // ciclo de conversa com o servidor
  useEffect(() => {
    let vivo = true;
    let timer: ReturnType<typeof setTimeout>;
    if (estado) aquecer(urlsDoEstado(estado));
    const ciclo = async () => {
      let espera = 60000;
      const exib = retirarExibicoes();
      try {
        if (!token.current) {
          const r = await iniciar();
          if (!r?.ok || !r.token) throw new Error(r?.erro || 'sem código');
          token.current = r.token; gravar(K_TOKEN, r.token);
          setCodigo(r.codigo); registrarEvento('iniciou', { plataforma: plataforma() });
        }
        const precisaInfo = Date.now() - ultimoInfo.current > 30 * 60000;
        const r: Estado = await pedirEstado({
          token: token.current, tocando: tocandoAgora(), erros: errosRecentes(), exibicoes: exib, eventos: retirarEventos(),
          comando_ok: ler<string>(K_CMD, '') || undefined, ...(precisaInfo ? { info: infoAparelho() } : {}),
        });
        if (precisaInfo) ultimoInfo.current = Date.now();
        if (!vivo) return;
        setOnline(true); setErro('');
        if (r.desconhecida) { token.current = ''; apagar(K_TOKEN); apagar(K_ESTADO); setEstado(null); espera = 1000; return; }
        ajustarRelogio(r.servidor_agora);
        if (!r.pareada) {
          setEstado(null); apagar(K_ESTADO); setCodigo(r.codigo || null); espera = 5000;
        } else {
          setEstado((ant) => (ant && ant.versao === r.versao && JSON.stringify(ant.noticias) === JSON.stringify(r.noticias) && JSON.stringify(ant.cameras) === JSON.stringify(r.cameras) ? { ...ant, comando: r.comando, servidor_agora: r.servidor_agora } : r));
          gravar(K_ESTADO, r);
          sincronizar(urlsDoEstado(r));
          // comandos do admin
          if (r.comando && ler<string>(K_CMD, '') !== r.comando.em) {
            gravar(K_CMD, r.comando.em);
            registrarEvento('comando', r.comando);
            if (r.comando.tipo === 'limpar_cache') { await limparTudo(); recarregar(); return; }
            if (r.comando.tipo === 'reiniciar_app') { reiniciarApp(); return; }
            recarregar(); return;
          }
          if (!r.comando) apagar(K_CMD);
        }
      } catch (err) {
        devolverExibicoes(exib);
        if (!vivo) return;
        setOnline(navigator.onLine);
        setErro(String((err as Error)?.message || err).slice(0, 120));
        registrarErro(`servidor: ${String((err as Error)?.message || err)}`);
        espera = token.current ? 20000 : 10000;
      } finally {
        if (vivo) timer = setTimeout(ciclo, espera);
      }
    };
    ciclo();
    const online = () => { clearTimeout(timer); ciclo(); };
    window.addEventListener('online', online);
    return () => { vivo = false; clearTimeout(timer); window.removeEventListener('online', online); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // atualização automática: quando o site for publicado, a tela pega a versão nova
  useEffect(() => {
    const meu = document.querySelector('meta[name="exa-build"]')?.getAttribute('content') || '';
    const checar = async () => {
      try {
        const r = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store', credentials: 'omit' });
        const j = await r.json();
        if (meu && !meu.includes('__') && j?.version && String(j.version) !== meu) { registrarEvento('atualizou', { de: meu, para: j.version }); recarregar(); }
      } catch { /* sem internet */ }
    };
    const id = setInterval(checar, 10 * 60000);
    // recarga diária às 4h (limpa memória de aparelho fraco)
    const diaria = setInterval(() => { const t = textosDaHora(); if (t.hora === '04:00') recarregar(); }, 50000);
    return () => { clearInterval(id); clearInterval(diaria); };
  }, []);

  // tela sempre acesa, sem menu, tela cheia ao primeiro toque (navegador comum)
  useEffect(() => {
    let lock: any = null;
    const pedir = async () => { try { lock = await (navigator as any).wakeLock?.request('screen'); } catch { /* */ } };
    pedir();
    const vis = () => { if (document.visibilityState === 'visible') pedir(); };
    document.addEventListener('visibilitychange', vis);
    const menu = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', menu);
    const cheia = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {}); };
    document.addEventListener('click', cheia);
    window.addEventListener('error', (e) => registrarErro(`js: ${e.message}`));
    return () => { document.removeEventListener('visibilitychange', vis); document.removeEventListener('contextmenu', menu); document.removeEventListener('click', cheia); try { lock?.release(); } catch { /* */ } };
  }, []);

  return <Palco>{estado?.pareada ? <Programacao e={estado} /> : <Pareamento codigo={codigo} online={online} erro={erro} />}</Palco>;
}
