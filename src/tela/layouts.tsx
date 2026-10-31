/**
 * Os 11 layouts da tela (1920×1080), fiéis aos artboards validados no canvas "Telas horizontais EXA":
 * H1–H7 (vídeo 16:9) e L1–L4 (vídeo 6:5 de hoje). Vídeo de outro formato nunca é esticado nem cortado
 * demais: fica inteiro com o fundo desfocado dele mesmo.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Estado, Noticia } from './api';
import Faixa, { type InfoFaixa } from './Faixa';
import type { Faixas, ItemFaixa, Layout } from './motor';
import { miniatura } from './cache';
import {
  CameraAoVivo, CameraRodizio, CartaoNoticia, Credito, DataTexto, Hora, Icone, IconeAgora, LOGO_PORTAL, Logo, Miniatura,
  Previsao, QR, SeloAoVivo, Temperatura, TextoClima, proximosDe,
} from './widgets';
import { agora } from './tempo';

type P = { e: Estado; f: Faixas; layout: Layout };

const useInfo = () => {
  const [info, setInfo] = useState<InfoFaixa | null>(null);
  const on = useCallback((i: InfoFaixa) => setInfo(i), []);
  return [info, on] as const;
};

const partesCamera = (nome: string) => {
  const [a, ...b] = nome.split(' · ');
  return { titulo: a || nome, sub: b.join(' · ') };
};

// ------------------------------------------------------------------ peças comuns
function CartaoHora({ altura, dataTam = 15, horaTam = 92, logo, style }: { altura?: number; dataTam?: number; horaTam?: number; logo?: number; style?: React.CSSProperties }) {
  return (
    <div className="vidro" style={{ height: altura, flex: 'none', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, ...style }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <DataTexto tamanho={dataTam} />
        <Hora tamanho={horaTam} />
      </div>
      {logo ? <Logo altura={logo} style={{ opacity: 0.9 }} /> : null}
    </div>
  );
}
function CartaoClimaLinha({ altura, icone = 64, temp = 62, previsao, style }: { altura?: number; icone?: number; temp?: number; previsao?: boolean; style?: React.CSSProperties }) {
  return (
    <div className="clima-card" style={{ height: altura, flex: 'none', padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 18, ...style }}>
      <IconeAgora tamanho={icone} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="rotulo" style={{ fontSize: 14, color: 'rgba(255,255,255,.9)' }}>Foz do Iguaçu</div>
        <Temperatura tamanho={temp} />
      </div>
      {previsao && <Previsao />}
    </div>
  );
}
function ASeguir({ info, n, alturaThumb, tamanhoNome = 18, gap = 18 }: { info: InfoFaixa | null; n: number; alturaThumb?: number; tamanhoNome?: number; gap?: number }) {
  const prox = info ? proximosDe(info.itens, info.atual, n) : [];
  if (!prox.length) return <div className="rotulo" style={{ fontSize: 15, opacity: 0.6 }}>Programação EXA</div>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gap, alignItems: 'start' }}>
      {prox.map((it) => <Miniatura key={it.k} it={it} altura={alturaThumb} tamanhoNome={tamanhoNome} />)}
    </div>
  );
}
/** Bloco de hora + clima do canto (H6, H7). */
function RelogioCanto() {
  return (
    <div className="abs vidro-escuro" style={{ right: 36, top: 32, padding: '16px 26px', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 22, zIndex: 6 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Hora tamanho={72} />
        <DataTexto tamanho={13} style={{ color: 'rgba(255,255,255,.78)' }} />
      </div>
      <i style={{ width: 1, height: 64, background: 'rgba(255,255,255,.22)' }} />
      <IconeAgora tamanho={40} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Temperatura tamanho={52} comTexto={false} />
        <span className="rotulo" style={{ fontSize: 13, color: 'rgba(255,255,255,.78)' }}>Foz · <TextoClima /></span>
      </div>
    </div>
  );
}
/** Quando não há vídeo vertical: a área vertical vira câmera ao vivo (ou notícia). */
function VerticalReserva({ e }: { e: Estado }) {
  const cams = e.cameras || [];
  const [semCam, setSemCam] = useState(false);
  if (cams.length && !semCam) {
    return (
      <CameraRodizio cameras={cams} onSemCamera={() => setSemCam(true)}>
        {(c) => (
          <>
            <div className="abs" style={{ left: 0, right: 0, top: 0, height: 220, background: 'linear-gradient(180deg,rgba(0,0,0,.6),rgba(0,0,0,0))' }} />
            <div className="abs" style={{ left: 24, top: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SeloAoVivo tamanho={15} style={{ alignSelf: 'flex-start' }} />
              <span style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.05 }}>{partesCamera(c.nome).titulo}</span>
              <span style={{ fontSize: 17, fontWeight: 600, opacity: 0.85 }}>{partesCamera(c.nome).sub}</span>
            </div>
            <div className="abs" style={{ left: 0, right: 0, bottom: 0, padding: '60px 24px 22px', background: 'linear-gradient(0deg,rgba(0,0,0,.75),rgba(0,0,0,0))' }}>
              <Credito cam={c} tamanho={16} />
            </div>
          </>
        )}
      </CameraRodizio>
    );
  }
  return (
    <div className="cheio fundo-exa" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <CartaoHora horaTam={96} />
      <CartaoClimaLinha previsao icone={56} temp={56} />
      <CartaoNoticia noticias={e.noticias} linhas={6} tamanho={28} qr={110} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}

// ------------------------------------------------------------------ H1 · TV em L
function H1({ e, f }: P) {
  const [info, onInfo] = useInfo();
  return (
    <div className="cheio fundo-exa">
      <Faixa itens={f.principal} area="16:9" principal onInfo={onInfo} style={{ left: 0, top: 0, width: 1440, height: 810 }} vazio={<VerticalReserva e={e} />} />
      <div className="abs" style={{ left: 1440, top: 0, width: 480, height: 810, padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <CartaoHora altura={170} />
        <CartaoClimaLinha altura={150} />
        <CartaoNoticia noticias={e.noticias} linhas={4} tamanho={26} qr={96} style={{ flex: 1, minHeight: 0 }} />
      </div>
      <div className="abs" style={{ left: 0, top: 810, width: 1920, height: 270, padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ flex: 'none', width: 150, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="rotulo" style={{ fontSize: 15, letterSpacing: 2.2 }}>A seguir</span>
          <Logo altura={30} style={{ opacity: 0.9 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}><ASeguir info={info} n={4} /></div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ H2 · horizontal + vertical
function H2({ e, f }: P) {
  return (
    <div className="cheio fundo-exa-esq">
      <Faixa itens={f.principal} area="16:9" principal style={{ left: 0, top: 0, width: 1312, height: 738 }} vazio={<VerticalReserva e={e} />} />
      <div className="abs" style={{ left: 1312, top: 0, width: 608, height: 1080, borderLeft: '4px solid #0c0610', overflow: 'hidden', background: '#000' }}>
        {f.vertical.length ? <Faixa itens={f.vertical} area="9:16" style={{ inset: 0 }} /> : <VerticalReserva e={e} />}
      </div>
      <div className="abs" style={{ left: 0, top: 738, width: 1312, height: 342, padding: 24, display: 'flex', gap: 20 }}>
        <div className="vidro" style={{ width: 330, flex: 'none', padding: '20px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
          <DataTexto tamanho={15} />
          <Hora tamanho={100} />
          <Logo altura={26} style={{ opacity: 0.85, marginTop: 8 }} />
        </div>
        <div className="clima-card" style={{ width: 250, flex: 'none', padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
          <IconeAgora tamanho={52} />
          <Temperatura tamanho={76} comTexto={false} />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>Foz · <TextoClima /></div>
        </div>
        <CartaoNoticia noticias={e.noticias} horizontal linhas={3} tamanho={28} qr={112} style={{ flex: 1, minWidth: 0 }} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ H3 · tela cheia limpa
function H3({ f, e }: P) {
  return (
    <div className="cheio">
      <Faixa itens={f.principal} area="16:9" principal style={{ inset: 0 }} vazio={<SemVideo e={e} />} />
      <div className="abs vidro-escuro" style={{ right: 32, top: 32, padding: '14px 22px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 18, zIndex: 6 }}>
        <Hora tamanho={40} />
        <i style={{ width: 1, height: 34, background: 'rgba(255,255,255,.25)' }} />
        <IconeAgora tamanho={30} />
        <Temperatura tamanho={34} comTexto={false} />
      </div>
      <Logo altura={30} style={{ position: 'absolute', left: 36, top: 40, opacity: 0.8, zIndex: 6 }} />
    </div>
  );
}

// ------------------------------------------------------------------ H4 · vitrine
function H4({ e, f }: P) {
  return (
    <div className="cheio fundo-exa">
      <Faixa itens={f.principal} area="16:9" principal barra="fina" style={{ left: 0, top: 0, width: 960, height: 540 }} vazio={<VerticalReserva e={e} />} />
      <div className="abs" style={{ left: 0, top: 540, width: 960, height: 540, borderTop: '4px solid #0c0610', overflow: 'hidden', background: '#000' }}>
        {f.segunda.length ? <Faixa itens={f.segunda} area="16:9" barra="fina" style={{ inset: 0 }} /> : <VerticalReserva e={e} />}
      </div>
      <div className="abs" style={{ left: 960, top: 0, width: 608, height: 1080, borderLeft: '4px solid #0c0610', overflow: 'hidden', background: '#000' }}>
        {f.vertical.length ? <Faixa itens={f.vertical} area="9:16" barra="fina" style={{ inset: 0 }} /> : <VerticalReserva e={e} />}
      </div>
      <div className="abs" style={{ left: 1568, top: 0, width: 352, height: 1080, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="vidro" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <DataTexto tamanho={14} />
          <Hora tamanho={84} />
        </div>
        <div className="clima-card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <IconeAgora tamanho={54} />
          <div style={{ minWidth: 0 }}>
            <div className="rotulo" style={{ fontSize: 13, color: 'rgba(255,255,255,.9)' }}>Foz do Iguaçu</div>
            <Temperatura tamanho={56} textoTam={15} />
          </div>
        </div>
        <CartaoNoticia noticias={e.noticias} linhas={5} tamanho={26} qr={110} style={{ flex: 1, minHeight: 0 }} />
        <Logo altura={28} style={{ opacity: 0.85, marginLeft: 4 }} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ H5 · vertical flutuante
function H5({ e, f }: P) {
  const temV = f.vertical.length > 0;
  return (
    <div className="cheio">
      <Faixa itens={f.principal} area="16:9" principal style={{ inset: 0 }} vazio={<SemVideo e={e} />} />
      {temV && (
        <>
          <div className="abs" style={{ right: 0, top: 0, width: 520, height: 1080, background: 'linear-gradient(90deg, rgba(12,6,16,0), rgba(12,6,16,.55))', zIndex: 4 }} />
          <div className="abs" style={{ right: 44, top: 230, width: 340, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 5 }}>
            <div className="rotulo" style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,.9)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="ponto" style={{ background: '#ff4d5e', boxShadow: '0 0 0 4px rgba(255,77,94,.25)' }} />Também agora
            </div>
            <div style={{ position: 'relative', width: 340, height: 604, borderRadius: 26, overflow: 'hidden', border: '2px solid rgba(255,255,255,.28)', boxShadow: '0 30px 70px rgba(0,0,0,.6), 0 0 0 8px rgba(12,6,16,.35)' }}>
              <Faixa itens={f.vertical} area="9:16" barra="fina" style={{ inset: 0 }} />
            </div>
          </div>
        </>
      )}
      <div className="abs vidro-escuro" style={{ left: 36, bottom: 40, padding: '16px 24px', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 22, zIndex: 6 }}>
        <Logo altura={26} style={{ opacity: 0.9 }} />
        <i style={{ width: 1, height: 46, background: 'rgba(255,255,255,.22)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Hora tamanho={50} />
          <DataTexto tipo="curta" tamanho={12} style={{ color: 'rgba(255,255,255,.75)' }} />
        </div>
        <i style={{ width: 1, height: 46, background: 'rgba(255,255,255,.22)' }} />
        <IconeAgora tamanho={36} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Temperatura tamanho={44} comTexto={false} />
          <span className="rotulo" style={{ fontSize: 12, color: 'rgba(255,255,255,.75)' }}>Foz · <TextoClima /></span>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ H6 · tela cheia intercalada
const minutosAtras = (iso: string | null) => {
  if (!iso) return '';
  const m = Math.round((agora().getTime() - Date.parse(iso)) / 60000);
  if (!Number.isFinite(m) || m < 0) return '';
  if (m < 60) return `Há ${Math.max(1, m)} min`;
  if (m < 24 * 60) return `Há ${Math.round(m / 60)} h`;
  return '';
};
function QuadroCamera({ it, fim }: { it: Extract<ItemFaixa, { tipo: 'camera' }>; fim: (falhou?: boolean) => void }) {
  const { titulo, sub } = partesCamera(it.cam.nome);
  return (
    <div className="cheio" style={{ background: '#000' }}>
      <CameraAoVivo cam={it.cam} onFalha={() => fim(true)} />
      <div className="abs" style={{ left: 0, right: 0, top: 0, height: 260, background: 'linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,0))' }} />
      <div className="abs" style={{ left: 0, right: 0, bottom: 0, height: 320, background: 'linear-gradient(0deg, rgba(0,0,0,.7), rgba(0,0,0,0))' }} />
      <div className="abs entra" style={{ left: 40, top: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SeloAoVivo tamanho={18} style={{ alignSelf: 'flex-start' }} />
        <span style={{ fontSize: 64, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>{titulo}</span>
        {sub && <span style={{ fontSize: 26, fontWeight: 600, color: 'rgba(255,255,255,.88)' }}>{sub}</span>}
      </div>
      <div className="abs vidro-escuro entra" style={{ left: 40, bottom: 44, padding: '14px 22px', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src={LOGO_PORTAL} alt="" style={{ height: 44, width: 'auto', display: 'block' }} onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="rotulo" style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>Imagem cedida por</span>
          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>{it.cam.credito}</span>
        </div>
      </div>
      <Logo altura={30} style={{ position: 'absolute', right: 40, bottom: 52, opacity: 0.85 }} />
    </div>
  );
}
function QuadroNoticia({ n }: { n: Noticia }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div className="cheio fundo-exa-esq">
      <div className="abs" style={{ right: 0, top: 0, width: 1100, height: 1080, background: 'linear-gradient(160deg, #2a2f3e, #12141c)' }}>
        {n.imagem && imgOk && <img src={n.imagem} alt="" onError={() => setImgOk(false)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
      </div>
      <div className="abs" style={{ right: 0, top: 0, width: 1106, height: 1080, background: 'linear-gradient(90deg, #0c0610 0%, #0c0610 1%, rgba(12,6,16,.85) 22%, rgba(12,6,16,0) 60%)' }} />
      <Logo altura={30} style={{ position: 'absolute', left: 40, top: 44, opacity: 0.85 }} />
      <div className="abs entra" style={{ left: 40, top: 250, width: 1040, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="etiqueta" style={{ fontSize: 16, letterSpacing: 2, padding: '6px 14px' }}>{n.categoria || 'Foz agora'}</span>
          {minutosAtras(n.data) && <span className="rotulo" style={{ fontSize: 16 }}>{minutosAtras(n.data)}</span>}
        </div>
        <div className="corta" style={{ fontSize: 72, fontWeight: 900, letterSpacing: -2.5, lineHeight: 1.05, WebkitLineClamp: 4 }}>{n.titulo}</div>
        {n.resumo && <div className="corta" style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.35, color: 'rgba(255,255,255,.82)', WebkitLineClamp: 2 }}>{n.resumo}</div>}
      </div>
      {(n.link || n.origem) && (
        <div className="abs entra" style={{ left: 40, bottom: 48, display: 'flex', alignItems: 'center', gap: 22 }}>
          {n.link && <QR valor={n.link} tamanho={132} />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {n.link && <span style={{ fontSize: 24, fontWeight: 800 }}>Leia completa no celular</span>}
            {n.origem && <span style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,.72)' }}>Fonte: {n.origem}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
/** Chamada "Em N segundos · Ponte ao vivo" durante o anúncio que antecede o quadro editorial. */
function Chamada({ info }: { info: InfoFaixa | null }) {
  const [, tic] = useState(0);
  useEffect(() => { const id = setInterval(() => tic((x) => x + 1), 1000); return () => clearInterval(id); }, []);
  if (!info?.atual || info.atual.tipo !== 'video' || !info.dur || !info.itens.length) return null;
  const i = info.itens.findIndex((x) => x.k === info.atual!.k);
  const prox = info.itens[(i + 1) % info.itens.length];
  if (!prox || prox.tipo === 'video') return null;
  const resta = Math.ceil(info.dur - (Date.now() - info.inicio) / 1000);
  if (resta > 15 || resta < 1) return null;
  const titulo = prox.tipo === 'camera' ? `${partesCamera(prox.cam.nome).titulo} ao vivo` : 'A notícia de Foz agora';
  return (
    <div className="abs vidro-escuro entra" style={{ right: 36, bottom: 40, padding: '12px 22px 12px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16, zIndex: 6 }}>
      <div style={{ width: 128, height: 72, borderRadius: 12, background: 'linear-gradient(180deg,#1d2a44,#2c3550 45%,#141a26)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.65)' }}>
        <Icone nome={prox.tipo === 'camera' ? 'camera' : 'jornal'} tamanho={30} traco={1.5} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="rotulo" style={{ fontSize: 13, fontWeight: 800, color: '#ffc35a' }}>Em {resta} {resta === 1 ? 'segundo' : 'segundos'}</span>
        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>{titulo}</span>
      </div>
    </div>
  );
}
function H6({ e, f }: P) {
  const [info, onInfo] = useInfo();
  const editorialAgora = info?.atual && info.atual.tipo !== 'video';
  return (
    <div className="cheio">
      <Faixa
        itens={f.principal} area="16:9" principal onInfo={onInfo} style={{ inset: 0 }} vazio={<SemVideo e={e} />}
        especial={(it, fim) => (it.tipo === 'camera' ? <QuadroCamera it={it} fim={fim} /> : it.tipo === 'noticia' ? <QuadroNoticia n={it.n} /> : null)}
      />
      {!editorialAgora && <Logo altura={30} style={{ position: 'absolute', left: 40, top: 44, opacity: 0.85, zIndex: 6 }} />}
      <RelogioCanto />
      <Chamada info={info} />
    </div>
  );
}

// ------------------------------------------------------------------ H7 · janela que alterna
function JanelaAlterna({ e }: { e: Estado }) {
  const cams = e.cameras || [];
  const ns = e.noticias || [];
  const curiosidades = ns.filter((n) => /curios/i.test(`${n.categoria} ${n.origem}`));
  const comuns = ns.filter((n) => !curiosidades.includes(n));
  const modos = useMemo(() => [cams.length ? 'camera' : '', comuns.length ? 'noticia' : '', curiosidades.length ? 'curiosidade' : ''].filter(Boolean) as string[], [cams.length, comuns.length, curiosidades.length]);
  const [m, setM] = useState(0);
  const [giro, setGiro] = useState({ c: 0, n: 0, q: 0 });
  const modo = modos.length ? modos[m % modos.length] : '';
  const proximo = useCallback(() => {
    setGiro((g) => ({ c: modo === 'camera' ? g.c + 1 : g.c, n: modo === 'noticia' ? g.n + 1 : g.n, q: modo === 'curiosidade' ? g.q + 1 : g.q }));
    setM((x) => x + 1);
  }, [modo]);
  useEffect(() => { if (!modo) return; const t = setTimeout(proximo, modo === 'camera' ? 16000 : 14000); return () => clearTimeout(t); }, [m, modo, proximo]);
  if (!modo) return null;
  const cam = cams[giro.c % Math.max(1, cams.length)];
  const n = modo === 'curiosidade' ? curiosidades[giro.q % curiosidades.length] : comuns[giro.n % Math.max(1, comuns.length)];
  return (
    <div className="abs" style={{ right: 36, bottom: 40, width: 600, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 6 }}>
      <div style={{ position: 'relative', width: 600, height: 338, borderRadius: 22, overflow: 'hidden', border: '2px solid rgba(255,255,255,.28)', boxShadow: '0 30px 70px rgba(0,0,0,.6)', background: '#0c0610' }}>
        {modo === 'camera' && cam ? (
          <div key={`c${giro.c}`} className="cheio troca">
            <CameraAoVivo cam={cam} onFalha={proximo} />
            <span className="abs" style={{ left: 14, top: 14 }}><SeloAoVivo tamanho={14} texto={`AO VIVO · ${partesCamera(cam.nome).titulo.toUpperCase()}`} /></span>
            <div className="abs" style={{ left: 0, right: 0, bottom: 0, padding: '30px 16px 12px', background: 'linear-gradient(0deg, rgba(0,0,0,.75), rgba(0,0,0,0))' }}><Credito cam={cam} /></div>
          </div>
        ) : n ? (
          <div key={`n${modo}${giro.n}${giro.q}`} className="cheio troca">
            {n.imagem ? <img src={n.imagem} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div className="cheio fundo-exa" />}
            <div className="cheio" style={{ background: 'linear-gradient(0deg, rgba(12,6,16,.95) 10%, rgba(12,6,16,.25) 70%)' }} />
            <div className="abs" style={{ left: 20, right: 20, bottom: 18, display: 'flex', gap: 14, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="etiqueta" style={{ alignSelf: 'flex-start', fontSize: 12, padding: '4px 10px' }}>{modo === 'curiosidade' ? 'Curiosidade' : n.categoria || 'Foz agora'}</span>
                <span className="corta" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.15, WebkitLineClamp: 3 }}>{n.titulo}</span>
              </div>
              {n.link && <QR valor={n.link} tamanho={86} />}
            </div>
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
        {modos.map((x) => (
          <span key={x} style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', padding: '5px 12px', borderRadius: 999, background: x === modo ? '#fff' : 'rgba(16,8,14,.62)', color: x === modo ? '#12080e' : '#fff', border: x === modo ? undefined : '1px solid rgba(255,255,255,.2)' }}>
            {x === 'camera' ? 'Câmera' : x === 'noticia' ? 'Notícia' : 'Curiosidade'}
          </span>
        ))}
      </div>
    </div>
  );
}
function H7({ e, f }: P) {
  return (
    <div className="cheio">
      <Faixa itens={f.principal} area="16:9" principal style={{ inset: 0 }} vazio={<SemVideo e={e} />} />
      <Logo altura={30} style={{ position: 'absolute', left: 40, top: 44, opacity: 0.85, zIndex: 6 }} />
      <RelogioCanto />
      <JanelaAlterna e={e} />
    </div>
  );
}

// ------------------------------------------------------------------ L1 · coluna informativa (6:5)
function L1({ e, f }: P) {
  const [info, onInfo] = useInfo();
  return (
    <div className="cheio fundo-exa" style={{ display: 'flex' }}>
      <Faixa itens={f.principal} area="6:5" principal onInfo={onInfo} style={{ left: 0, top: 0, width: 1296, height: 1080 }} vazio={<VerticalReserva e={e} />} />
      <div className="abs" style={{ left: 1296, top: 0, width: 624, height: 1080, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <CartaoHora altura={196} dataTam={17} horaTam={104} logo={34} style={{ padding: '22px 28px' }} />
        <CartaoClimaLinha altura={166} icone={76} temp={70} previsao />
        <CartaoNoticia noticias={e.noticias} linhas={4} tamanho={31} qr={120} style={{ height: 330, flex: 'none' }} />
        <div className="vidro" style={{ flex: 1, minHeight: 0, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="rotulo" style={{ fontSize: 15, letterSpacing: 2.2 }}>A seguir</span>
          <ASeguir info={info} n={3} alturaThumb={92} tamanhoNome={15} gap={12} />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ L2 · câmera ao vivo (6:5)
function L2({ e, f }: P) {
  const [semCam, setSemCam] = useState(false);
  const cams = e.cameras || [];
  return (
    <div className="cheio fundo-exa">
      <Faixa itens={f.principal} area="6:5" principal style={{ left: 0, top: 0, width: 1296, height: 1080 }} vazio={<VerticalReserva e={e} />} />
      <div className="abs" style={{ left: 1296, top: 0, width: 624, height: 1080, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ height: 190, flex: 'none', display: 'flex', gap: 16 }}>
          <div className="vidro" style={{ flex: 1.25, minWidth: 0, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <DataTexto tipo="curta" tamanho={15} />
            <Hora tamanho={84} />
          </div>
          <div className="clima-card" style={{ flex: 1, minWidth: 0, padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
            <IconeAgora tamanho={42} />
            <Temperatura tamanho={62} comTexto={false} />
            <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}><TextoClima /></div>
          </div>
        </div>
        <div className="vidro" style={{ height: 470, flex: 'none', position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg,#1b1f2b,#0e1018)' }}>
          {cams.length && !semCam ? (
            <CameraRodizio cameras={cams} onSemCamera={() => setSemCam(true)}>
              {(c) => (
                <>
                  <div className="abs" style={{ left: 16, right: 16, top: 14, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <SeloAoVivo tamanho={15} />
                    <span className="uma-linha" style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1.3, padding: '6px 13px', borderRadius: 20, background: 'rgba(0,0,0,.55)', border: '1px solid rgba(255,255,255,.14)', maxWidth: 360 }}>{c.nome.toUpperCase()}</span>
                  </div>
                  <div className="abs" style={{ left: 0, right: 0, bottom: 0, padding: '40px 16px 14px', background: 'linear-gradient(0deg, rgba(0,0,0,.7), rgba(0,0,0,0))' }}><Credito cam={c} /></div>
                </>
              )}
            </CameraRodizio>
          ) : (
            <div className="cheio" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
              <span className="rotulo" style={{ fontSize: 15 }}>Próximos dias em Foz</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}><IconeAgora tamanho={96} /><Previsao tamanho={26} /></div>
            </div>
          )}
        </div>
        <CartaoNoticia noticias={e.noticias} horizontal linhas={3} tamanho={26} qr={104} style={{ flex: 1, minHeight: 0 }} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ L3 · cinema (6:5)
function L3({ e, f }: P) {
  const [info, onInfo] = useInfo();
  const atual = info?.atual?.tipo === 'video' ? info.atual.v : null;
  const mini = atual ? miniatura(atual.url) : '';
  return (
    <div className="cheio" style={{ background: '#000' }}>
      {mini && <img src={mini} alt="" className="abs troca" key={mini.slice(-40)} style={{ left: -80, top: -80, width: 2080, height: 1240, objectFit: 'cover', filter: 'blur(60px) brightness(.5) saturate(1.25)' }} />}
      <Faixa itens={f.principal} area="6:5" principal onInfo={onInfo} vazio={<SemVideo e={e} />} style={{ left: 312, top: 0, width: 1296, height: 1080, boxShadow: '0 0 90px rgba(0,0,0,.7)' }} />
      <div className="abs" style={{ right: 28, top: 28, width: 256, padding: '18px 20px', borderRadius: 22, background: 'rgba(16,8,14,.55)', border: '1px solid rgba(255,255,255,.18)', borderTopColor: 'rgba(255,255,255,.32)', boxShadow: '0 16px 40px rgba(0,0,0,.45)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Hora tamanho={64} />
        <DataTexto tipo="media" tamanho={14} style={{ letterSpacing: 1.8, color: 'rgba(255,255,255,.75)' }} />
        <div style={{ height: 1, background: 'rgba(255,255,255,.16)', margin: '8px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconeAgora tamanho={38} />
          <Temperatura tamanho={44} comTexto={false} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.8)', lineHeight: 1.2 }}>Foz do<br />Iguaçu</span>
        </div>
      </div>
      <Logo altura={30} style={{ position: 'absolute', left: 40, bottom: 36, opacity: 0.75 }} />
    </div>
  );
}

// ------------------------------------------------------------------ L4 · tela cheia com faixa
function L4({ e, f }: P) {
  const [info, onInfo] = useInfo();
  return (
    <div className="cheio">
      <Faixa itens={f.principal} area="16:9" principal onInfo={onInfo} barra={false} style={{ inset: 0 }} vazio={<SemVideo e={e} />} />
      <div className="abs" style={{ left: 0, right: 0, bottom: 0, height: 280, background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.55))', zIndex: 4 }} />
      <div className="abs" style={{ left: 28, right: 28, bottom: 28, height: 140, borderRadius: 26, overflow: 'hidden', background: 'rgba(16,8,14,.80)', border: '1px solid rgba(255,255,255,.16)', borderTopColor: 'rgba(255,255,255,.30)', boxShadow: '0 20px 50px rgba(0,0,0,.5)', display: 'flex', alignItems: 'stretch', zIndex: 5 }}>
        <div style={{ width: 270, flex: 'none', padding: '0 30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,.12)' }}>
          <Hora tamanho={72} />
          <DataTexto tipo="media" tamanho={15} />
        </div>
        <div style={{ width: 270, flex: 'none', padding: '0 28px', display: 'flex', alignItems: 'center', gap: 16, borderRight: '1px solid rgba(255,255,255,.12)' }}>
          <IconeAgora tamanho={58} />
          <div>
            <Temperatura tamanho={56} comTexto={false} />
            <div className="rotulo" style={{ fontSize: 15, letterSpacing: 1.5 }}>Foz do Iguaçu</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: '0 28px', display: 'flex', alignItems: 'center', borderRight: '1px solid rgba(255,255,255,.12)' }}>
          <CartaoNoticia noticias={e.noticias} horizontal linhas={2} tamanho={26} qr={92} barra={false} style={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0, flex: 1, minWidth: 0 }} />
        </div>
        <div style={{ width: 470, flex: 'none', padding: '0 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
          <span className="rotulo" style={{ fontSize: 13 }}>A seguir</span>
          <ASeguir info={info} n={3} alturaThumb={60} tamanhoNome={13} gap={10} />
        </div>
        {info?.dur ? <div className="barra fina"><i key={info.inicio} style={{ animationDuration: `${info.dur}s` }} /></div> : null}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ sem nenhum vídeo
export function SemVideo({ e }: { e: Estado }) {
  return (
    <div className="cheio fundo-exa" style={{ padding: 60, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
        <Logo altura={48} />
        <Hora tamanho={220} />
        <DataTexto tamanho={30} />
        <CartaoClimaLinha previsao icone={80} temp={80} />
      </div>
      <CartaoNoticia noticias={e.noticias} linhas={6} tamanho={40} qr={150} style={{ alignSelf: 'center', height: 640 }} />
    </div>
  );
}

export const COMPONENTES: Record<string, (p: P) => JSX.Element> = { H1, H2, H3, H4, H5, H6, H7, L1, L2, L3, L4 };
