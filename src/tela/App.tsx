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
import { aquecer, estatisticas, limparTudo, sincronizar } from './cache';

const abertoEm = Date.now();
/** O que o monitor mostra sobre o aparelho: rede, cache de vídeos, há quanto tempo a tela está aberta, memória. */
function saudeAgora() {
  const c: any = (navigator as any).connection || {};
  const mem: any = (performance as any).memory;
  return {
    online: navigator.onLine,
    // tipo (Wi-Fi/cabo) só o Android informa; no resto, a qualidade estimada da conexão
    conexao: c.type && c.type !== 'unknown' ? (c.type === 'wifi' ? 'Wi-Fi' : c.type === 'ethernet' ? 'cabo' : c.type === 'cellular' ? 'dados móveis' : c.type)
      : ({ '4g': 'boa', '3g': 'média', '2g': 'fraca', 'slow-2g': 'muito fraca' } as Record<string, string>)[c.effectiveType] || null,
    mbps: typeof c.downlink === 'number' ? c.downlink : null,
    rtt: typeof c.rtt === 'number' ? c.rtt : null,
    videos_no_aparelho: estatisticas.itens,
    cache_mb: estatisticas.mb,
    baixando: estatisticas.baixando || null,
    falhas_download: estatisticas.falhas,
    sem_cache: estatisticas.semCache || undefined,
    aberta_min: Math.round((Date.now() - abertoEm) / 60000),
    memoria_mb: mem?.usedJSHeapSize ? Math.round(mem.usedJSHeapSize / 1048576) : null,
  };
}
import { layoutDe, montarFaixas, urlsDoEstado } from './motor';
import { COMPONENTES, SemVideo } from './layouts';
import { devolverExibicoes, errosRecentes, registrarErro, registrarEvento, retirarEventos, retirarExibicoes, tocandoAgora } from './registro';
import { ajustarRelogio, textosDaHora, useHora } from './tempo';
import { LOGO, QR } from './widgets';
import { ReplicaElevador } from './replica';

const K_TOKEN = 'exa-tela-token';
const K_ESTADO = 'exa-tela-estado';
const K_CMD = 'exa-tela-cmd-ok';

// ---------------------------------------------------------------- palco 1920×1080 (ou 1080×1920 em pé) escalado
/**
 * TV em pé: o palco é 1080×1920. A maioria dos TV box só manda imagem deitada; se a janela está deitada,
 * o palco gira (giro escolhido ao vincular: 90° ou 270°). Se o aparelho já sai em pé, não gira.
 */
function Palco({ children, vertical = false, giro = 90 }: { children: React.ReactNode; vertical?: boolean; giro?: number }) {
  const [jan, setJan] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const f = () => setJan({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;
  const deitada = jan.w > jan.h;
  const girar = vertical && deitada && (giro === 90 || giro === 270) ? giro : 0;
  const visW = girar ? H : W;
  const visH = girar ? W : H;
  const esc = Math.min(jan.w / visW, jan.h / visH);
  return (
    <div className="palco-fora">
      <div className="palco" style={{ width: W, height: H, transform: `translate(-50%, -50%) rotate(${girar}deg) scale(${esc})` }}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------- tela de código
function Pareamento({ codigo, online, erro }: { codigo: string | null; online: boolean; erro: string }) {
  // TV ainda sem local: só a marca EXA animada, o código discreto e o QR (o celular logado conecta direto)
  const link = codigo ? `https://examidia.com.br/conectar?c=${codigo}` : '';
  const cod = codigo ? `${codigo.slice(0, 3)} ${codigo.slice(3)}` : '··· ···';
  return (
    <div className="cheio" style={{ background: '#07030a', overflow: 'hidden' }}>
      <i className="esp-luz a" />
      <i className="esp-luz b" />
      <div className="abs" style={{ left: 0, right: 0, top: 330, textAlign: 'center' }}>
        <span className="esp-logo"><img src={LOGO} alt="EXA" /><span className="esp-brilho"><i /></span></span>
        <div className="esp-linha"><i /></div>
        <div className="esp-frase">Aguardando conexão · examidia.com.br</div>
      </div>
      <div className="abs" style={{ left: 56, right: 56, bottom: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="rotulo" style={{ fontSize: 15, color: 'rgba(255,255,255,.55)' }}>Código desta TV</span>
          <span className="grande" style={{ fontSize: 56, letterSpacing: 10, marginTop: 10, opacity: codigo ? 1 : 0.4 }}>{cod}</span>
          <span style={{ fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,.62)', marginTop: 10 }}>Painéis → Adicionar painel · ou · Minhas telas → Conectar</span>
          <span className="rotulo" style={{ fontSize: 12, marginTop: 14, color: online ? 'rgba(126,226,168,.8)' : '#ff8a8a', textTransform: 'none', letterSpacing: 0.5 }}>
            {online ? '● conectada à internet' : '● sem internet — tentando de novo'} · {plataforma()} · {versaoCompleta()}{erro ? ` · ${erro}` : ''}
          </span>
        </div>
        {link && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', marginRight: 20 }}>
              <span style={{ fontSize: 22, fontWeight: 800 }}>Aponte a câmera do celular</span>
              <span style={{ fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,.62)', marginTop: 6 }}>abre direto “Conectar esta TV”</span>
            </div>
            <QR valor={link} tamanho={176} />
          </div>
        )}
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

/** TV em pé: o que foi escolhido ao vincular (config.orientacao) ou um layout vertical. */
const ehVertical = (e: Estado | null) => !!e?.pareada && (e.tela?.config?.orientacao === 'vertical' || /^(V\d|R)$/.test(String(e.tela?.layout || '')));

function Programacao({ e }: { e: Estado }) {
  const vertical = ehVertical(e);
  const layout = vertical ? layoutDe(/^V\d$/.test(String(e.tela?.layout)) ? e.tela?.layout : 'V2') : layoutDe(e.tela?.layout);
  // remonta as faixas só quando o conteúdo muda (não a cada batimento)
  const chave = `${e.versao}|${(e.cameras || []).length}|${(e.noticias || []).map((n) => n.titulo).join('|').length}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const faixas = useMemo(() => montarFaixas(e, layout), [chave, layout.id]);
  const C = COMPONENTES[layout.id] || (vertical ? COMPONENTES.V2 : COMPONENTES.H1);
  const conteudo = <Protecao e={e}><C e={e} f={faixas} layout={layout} /></Protecao>;
  // TV em pé num prédio: a mesma tela do elevador daquele prédio (avisos do síndico inclusos)
  if (vertical && e.local && e.local.tipo !== 'comercio') return <ReplicaElevador predioId={e.local.id} alternativa={conteudo} />;
  return conteudo;
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
          saude: saudeAgora(),
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
    // a primeira tela já foi desenhada: encerra a intro (web) e o splash do app Android
    requestAnimationFrame(() => requestAnimationFrame(() => { try { (window as any).__telaPronta?.(); } catch { /* */ } }));
    return () => { document.removeEventListener('visibilitychange', vis); document.removeEventListener('contextmenu', menu); document.removeEventListener('click', cheia); try { lock?.release(); } catch { /* */ } };
  }, []);

  const giro = Number(estado?.tela?.config?.giro);
  return (
    <Palco vertical={ehVertical(estado)} giro={[0, 90, 270].includes(giro) ? giro : 90}>
      {estado?.pareada ? <Programacao e={estado} /> : <Pareamento codigo={codigo} online={online} erro={erro} />}
    </Palco>
  );
}
