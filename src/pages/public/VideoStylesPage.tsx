import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Check, CheckCircle2, Loader2, MessageCircle, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { styleWhatsAppUrl } from '@/lib/videoStyleSelection';
import '@/styles/video-styles.css';

const styles = [
  { id: 1, name: 'Minimalista', description: 'Fundo escuro, frases aparecendo palavra por palavra e telas de aplicativo. Elegante e limpo.' },
  { id: 2, name: 'Showreel', description: 'Fundo claro e grafite, tipografia pesada, bolinha quicando e animações que explicam as palavras.' },
  { id: 3, name: 'Lançamento', description: 'Fundo escuro com brilho na cor da marca, celular flutuando e cartões saltando da tela.' },
  { id: 4, name: 'Produto em destaque', description: 'Fundo chapado na cor da marca, letras enormes e a marca girando como protagonista.' },
  { id: 5, name: 'Apresentação da marca', description: 'Preto alternando com a cor da marca, letra itálica de destaque, círculo com texto girando e números animados.' },
];
const VIDEO_PREFIX = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/sofia-videos/estilos/';

function StyleVideo({ id }: { id: number }) {
  const ref = useRef<HTMLVideoElement>(null);
  const visibleRef = useRef(false);
  const pausedRef = useRef(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const sync = () => {
      if (visibleRef.current && !document.hidden && !pausedRef.current) video.play().catch(() => setPaused(true));
      else video.pause();
    };
    const observer = new IntersectionObserver(entries => { visibleRef.current = entries[0]?.isIntersecting ?? false; sync(); }, { threshold: 0.35 });
    observer.observe(video);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); video.pause(); };
  }, []);
  const togglePause = () => {
    const video = ref.current;
    if (!video) return;
    pausedRef.current = !video.paused;
    if (pausedRef.current) video.pause(); else video.play().catch(() => setPaused(true));
  };
  const tapVideo = () => {
    if (muted) { setMuted(false); ref.current?.play().catch(() => setPaused(true)); pausedRef.current = false; }
    else togglePause();
  };
  return <div className="style-video-wrap">
    <video ref={ref} src={`${VIDEO_PREFIX}estilo${id}.mp4`} muted={muted} loop playsInline preload="metadata" aria-label={`Exemplo do estilo ${id}`} onLoadedData={() => setReady(true)} onPlaying={() => setPaused(false)} onPause={() => setPaused(true)} onError={() => setFailed(true)} />
    {!ready && <div className="style-video-status">{failed ? 'Vídeo temporariamente indisponível' : <><Loader2 className="h-4 w-4 animate-spin" />Carregando vídeo</>}</div>}
    <Button variant="ghost" className="style-video-hit" aria-label={`Alternar som e reprodução do estilo ${id}`} onClick={tapVideo} />
    <div className="style-video-controls">
      <Button variant="ghost" size="icon" className="style-icon" title={paused ? 'Reproduzir vídeo' : 'Pausar vídeo'} aria-label={`${paused ? 'Reproduzir' : 'Pausar'} estilo ${id}`} onClick={togglePause}>{paused ? <Play /> : <Pause />}</Button>
      <Button variant="ghost" size="icon" className="style-icon" title={muted ? 'Ativar som' : 'Silenciar'} aria-label={`${muted ? 'Ativar som' : 'Silenciar'} estilo ${id}`} onClick={() => setMuted(v => !v)}>{muted ? <VolumeX /> : <Volume2 />}</Button>
    </div>
  </div>;
}

export default function VideoStylesPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const override = new URLSearchParams(window.location.search).get('w');
  return <div className={`video-styles-page public-page select-text ${selected ? 'has-selection' : ''}`}>
    <Helmet>
      <title>Escolha o estilo do seu vídeo | EXA Mídia</title>
      <meta name="description" content="Escolha entre cinco estilos de motion graphics. Seu vídeo EXA com as cores, o logo e as frases da sua empresa." />
      <meta property="og:title" content="Escolha o estilo do seu vídeo | EXA Mídia" />
      <meta property="og:description" content="Cinco estilos, uma marca: a sua. Escolha o visual do seu vídeo EXA e confirme com a Sofia no WhatsApp." />
      <meta property="og:type" content="website" /><meta property="og:url" content="https://examidia.com.br/estilos" />
      <meta name="robots" content="noindex, nofollow" /><link rel="canonical" href="https://examidia.com.br/estilos" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" />
    </Helmet>
    <div className="video-styles-inner">
      <motion.header className="styles-hero" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="styles-brand"><strong>EXA</strong><span>Mídia — Motion Graphics</span></div>
        <h1>Qual estilo combina<br />com a <span>sua marca?</span></h1>
        <p>Veja os 5 estilos abaixo. Seu vídeo final usa as <strong>SUAS cores, logo e frases.</strong> Toque em um para escolher.</p>
      </motion.header>
      <main className="styles-grid" aria-label="Escolha o estilo do seu vídeo EXA">
        {styles.map(style => <motion.article key={style.id} className={`style-card ${selected === style.id ? 'is-selected' : ''}`} initial={reducedMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.4 }}>
          <StyleVideo id={style.id} />
          <div className="style-card-body"><div className="style-heading"><span className="style-number">0{style.id}</span><h2>{style.name}</h2></div><p className="style-description">{style.description}</p>
            <Button variant="outline" className="style-choose" aria-pressed={selected === style.id} onClick={() => setSelected(style.id)}>{selected === style.id ? <><motion.span initial={reducedMotion ? false : { scale: 0 }} animate={{ scale: 1 }}><Check className="h-4 w-4" /></motion.span>Estilo {style.id} selecionado</> : <>Escolher o estilo {style.id}<ArrowUpRight className="h-4 w-4" /></>}</Button>
          </div>
        </motion.article>)}
      </main>
      <footer className="styles-footer"><p>Estes são exemplos. Cores, logo, frases e QR Code do seu vídeo serão os da sua empresa.</p><p>EXA Mídia — Foz do Iguaçu</p></footer>
    </div>
    <AnimatePresence>{selected && <motion.aside className="styles-confirm" initial={reducedMotion ? false : { y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}><div className="styles-confirm-inner"><div aria-live="polite"><div className="styles-confirm-title"><CheckCircle2 className="h-5 w-5" />Estilo {selected} selecionado</div><p>Ou volte ao WhatsApp e responda: Escolho o estilo {selected}</p></div><Button className="styles-whatsapp" asChild><a href={styleWhatsAppUrl(selected, override)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-5 w-5" />Confirmar no WhatsApp<ArrowUpRight className="h-4 w-4" /></a></Button></div></motion.aside>}</AnimatePresence>
  </div>;
}