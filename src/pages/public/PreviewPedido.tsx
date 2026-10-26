import React, { useState, useEffect } from 'react';

/**
 * PRÉVIA (dados fictícios) da nova página do pedido do anunciante.
 * Rota pública: /preview/pedido — responsiva (desktop + mobile).
 * Não toca na página real do pedido; serve só para validar o layout.
 */

const WINE = '#9e1b34';
const grads: Record<string, string> = {
  g1: 'linear-gradient(135deg,#3a1016,#7c1428 55%,#b8324b)',
  g2: 'linear-gradient(135deg,#0c2a1b,#15603a 55%,#2f9d63)',
  g3: 'linear-gradient(135deg,#2a1c05,#8a5a0c 55%,#d79a2a)',
  g4: 'linear-gradient(135deg,#132038,#1f3f7a 55%,#3f74c2)',
  g5: 'linear-gradient(135deg,#2d0f2a,#7a1f6f 55%,#c23fae)',
};

type View = 'inicio' | 'agenda' | 'predios' | 'empresas';
type Detail = { t: 'firm' | 'predio'; id: string } | null;

const firms: Record<string, any> = {
  steak: { n: 'Del Fuego Steakhouse', seg: 'Restaurante · Rodízio', lg: 'DF', c: '#9e1b34', end: 'Av. das Cataratas, 1200 — Foz do Iguaçu', ig: '@delfuego.steak', wa: '(45) 99999-1200', tom: 'Caloroso, premium, acolhedor', cores: ['#9e1b34', '#1a1a1a', '#e8c87a'], tipo: 'Títulos em serifa; texto em sans', raws: [['Corte', 'g1'], ['Chapa', 'g3'], ['Salão', 'g4'], ['Chef', 'g5']] },
  deli: { n: 'Del Fuego Delivery', seg: 'Delivery próprio', lg: 'DD', c: '#0f7a4a', end: '— falta cadastrar —', ig: '@delfuego.delivery', wa: '(45) 99999-1288', tom: 'Rápido, prático, com fome 😋', cores: ['#0f7a4a', '#1a1a1a'], tipo: 'Sans redonda, bem legível', raws: [['Embalagem', 'g2'], ['Moto', 'g4']] },
};

const predios = [
  { id: 'viena', n: 'Viena', a: 'R. das Flores, 820 — Centro', c1: '#5b6b8c', c2: '#2d3a56', t: 3 },
  { id: 'torre', n: 'Torre Azul', a: 'Av. Brasil, 1500 — Centro', c1: '#2f6a8c', c2: '#143a56', t: 4 },
  { id: 'barcelona', n: 'Barcelona', a: 'R. Xavier, 210 — Jd. Itália', c1: '#8c5b5b', c2: '#4a2a2a', t: 3 },
  { id: 'pietro', n: 'Pietro Angelo', a: 'R. Minas, 77 — Vila A', c1: '#6a8c5b', c2: '#2f4a2a', t: 3 },
  { id: 'cancun', n: 'Cancún', a: 'Av. Paraná, 999 — Centro', c1: '#8c7a3f', c2: '#4a3f1e', t: 3 },
];

const ev: Record<number, [string, string][]> = {
  2: [['pr', '•']], 5: [['ag', 'Happy Hour']], 12: [['na', 'Dia dos Namorados']], 13: [['na', 'Namorados']],
  14: [['ap', 'Namorados']], 15: [['ag', 'Rodízio']], 16: [['ag', 'Rodízio']], 17: [['ag', 'Rodízio'], ['ag', 'Happy H.']],
  19: [['ag', 'Happy Hour']], 20: [['ag', 'Happy Hour']], 26: [['ag', 'Happy Hour']],
};
const evColor: Record<string, string> = { ag: '#2563eb', pr: WINE, ap: '#c2740a', na: '#c2203a' };

function BuildingSvg({ c1, c2 }: { c1: string; c2: string }) {
  const id = 'sky' + c1.replace(/[^a-z0-9]/gi, '');
  return (
    <svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient></defs>
      <rect width="160" height="120" fill={`url(#${id})`} />
      <g fill="rgba(255,255,255,.14)"><rect x="22" y="38" width="38" height="82" /><rect x="66" y="22" width="44" height="98" /><rect x="116" y="50" width="28" height="70" /></g>
      <g fill="rgba(255,255,255,.5)">
        {[0, 1, 2].map(r => [0, 1, 2].map(c => <rect key={`a${r}${c}`} x={28 + c * 10} y={46 + r * 12} width="4" height="5" />))}
        {[0, 1, 2, 3].map(r => [0, 1, 2].map(c => <rect key={`b${r}${c}`} x={72 + c * 12} y={30 + r * 13} width="5" height="6" />))}
      </g>
    </svg>
  );
}

const card = 'bg-white rounded-[20px] shadow-[0_1px_2px_rgba(30,15,18,.05),0_8px_24px_-14px_rgba(30,15,18,.16)]';
const badge: Record<string, string> = {
  ar: 'bg-[#e6f6ec] text-[#13a24a]', ag: 'bg-[#e8eefd] text-[#2563eb]', pr: 'bg-[#f8e9ec] text-[#9e1b34]',
  ap: 'bg-[#fbefda] text-[#c2740a]',
};

export default function PreviewPedido() {
  const [view, setView] = useState<View>('inicio');
  const [detail, setDetail] = useState<Detail>(null);
  const [calTab, setCalTab] = useState<'mes' | 'semana'>('mes');
  const [selDay, setSelDay] = useState(17);
  const [modal, setModal] = useState<React.ReactNode>(null);
  const [secs, setSecs] = useState(2 * 3600 + 14 * 60 + 22);

  useEffect(() => {
    const t = setInterval(() => setSecs(s => (s <= 0 ? 5 * 3600 : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const z = (n: number) => (n < 10 ? '0' : '') + n;
  const cd = `${z(Math.floor(secs / 3600))}:${z(Math.floor((secs % 3600) / 60))}:${z(secs % 60)}`;

  const go = (v: View) => { setView(v); setDetail(null); window.scrollTo(0, 0); };
  const openDetail = (d: Detail) => { setDetail(d); window.scrollTo(0, 0); };

  const Frame = ({ g, name, h = 94 }: { g: string; name: string; h?: number }) => (
    <div className="relative flex items-end p-3 text-white overflow-hidden" style={{ background: grads[g], minHeight: h }}>
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <svg width="13" height="15" viewBox="0 0 14 16" fill="#fff"><path d="M0 0l14 8L0 16z" /></svg>
      </span>
      <span className="relative font-bold text-sm" style={{ textShadow: '0 1px 10px rgba(0,0,0,.5)' }}>{name}</span>
    </div>
  );

  const Badge = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1 rounded-full ${badge[k]}`}>{children}</span>
  );

  // ---------- modais ----------
  const Modal = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 z-[60] bg-[rgba(20,8,12,.5)] backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
      <div className="bg-white w-full sm:max-w-[460px] rounded-t-[22px] sm:rounded-[22px] max-h-[92vh] overflow-auto p-5">
        <div className="w-10 h-1 rounded-full bg-[#ebe6e7] mx-auto mb-3 sm:hidden" />
        {children}
      </div>
    </div>
  );
  const bigBtn = 'w-full mt-4 py-3.5 rounded-[14px] border-0 text-white font-extrabold text-[15px] cursor-pointer';
  const inp = 'w-full p-3 rounded-xl border border-[#ebe6e7] bg-[#f7f5f6] text-[15px] mt-1.5';

  const openAgendar = (v: string) => setModal(<AgendarModal v={v} />);
  function AgendarModal({ v }: { v: string }) {
    const [quando, setQuando] = useState(0);
    const [hor, setHor] = useState(0);
    const [res, setRes] = useState(false);
    const Opt = ({ sel, onClick, children }: any) => (
      <button onClick={onClick} className="flex-1 min-w-[92px] rounded-xl p-2.5 text-[13px] font-bold text-center cursor-pointer border"
        style={sel ? { borderColor: WINE, background: '#f8e9ec', color: WINE } : { borderColor: '#ebe6e7', background: '#f7f5f6', color: '#1b1719' }}>{children}</button>
    );
    return (
      <Modal>
        <h3 className="text-[19px] font-extrabold mb-1">Agendar vídeo</h3>
        <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Qual vídeo?</label>
          <select className={inp}><option>{v || 'Promo Rodízio'}</option><option>Institucional</option><option>Happy Hour</option></select></div>
        <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Quando?</label>
          <div className="flex gap-2">{['Uma data', 'Um período', 'Toda semana'].map((x, i) => <Opt key={i} sel={quando === i} onClick={() => setQuando(i)}>{x}</Opt>)}</div></div>
        <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Data</label><input type="date" defaultValue="2026-11-17" className={inp} /></div>
        <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Horário</label>
          <div className="flex gap-2">{['O dia todo', 'Só um horário'].map((x, i) => <Opt key={i} sel={hor === i} onClick={() => setHor(i)}>{x}</Opt>)}</div></div>
        <div className="mt-4 border border-[#c2740a] bg-[#fbefda] rounded-[14px] p-3.5">
          {res ? (<><div className="flex gap-2 items-center font-extrabold text-[#13a24a] text-sm">✓ Combinado!</div><p className="text-[13px] m-0 mt-1">Pode confirmar embaixo.</p></>) : (<>
            <div className="flex gap-2 items-center font-extrabold text-[#c2740a] text-sm mb-1.5">⚠️ Esse dia já tem programação</div>
            <p className="text-[13px] m-0 mb-2.5">No dia <b>17/11</b> o <b>Happy Hour</b> toca das <b>18h às 21h</b>. O que você quer?</p>
            <button onClick={() => setRes(true)} className="block w-full text-left border border-[#ebe6e7] bg-white rounded-xl p-2.5 cursor-pointer text-[13px] font-bold mb-2">Deixar este por cima, o dia todo<small className="block font-normal text-[#8b8285] mt-0.5">O Happy Hour fica de fora só nesse dia</small></button>
            <button onClick={() => setRes(true)} className="block w-full text-left border border-[#ebe6e7] bg-white rounded-xl p-2.5 cursor-pointer text-[13px] font-bold mb-2">Colocar só num horário livre<small className="block font-normal text-[#8b8285] mt-0.5">Ex.: 11h–14h, sem mexer no Happy Hour</small></button>
            <button onClick={() => setModal(null)} className="block w-full text-left border border-[#ebe6e7] bg-white rounded-xl p-2.5 cursor-pointer text-[13px] font-bold">Deixar como está</button>
          </>)}
        </div>
        <button onClick={() => setModal(null)} className={bigBtn} style={{ background: WINE }}>Confirmar</button>
      </Modal>
    );
  }
  const note = 'text-[12px] text-[#554e50] bg-[#fdf6f7] border border-[#f8e9ec] rounded-[11px] p-2.5 flex gap-2';

  // ---------- Início ----------
  const Inicio = () => (
    <>
      <div className="text-[11px] font-bold tracking-[.11em] uppercase" style={{ color: WINE }}>Seu pedido</div>
      <h1 className="text-[27px] md:text-[32px] font-extrabold leading-tight">Del Fuego Steakhouse</h1>
      <p className="text-[#8b8285] text-[13.5px] mt-1">Pedido ativo · 10/10/2026 → 08/01/2027 · 5 prédios</p>

      <div className="flex gap-2.5 overflow-x-auto pb-1.5 mt-4 [scrollbar-width:none]">
        {Object.entries(firms).map(([id, f]) => (
          <button key={id} onClick={() => openDetail({ t: 'firm', id })} className={`flex-none flex items-center gap-2.5 ${card} rounded-full py-1.5 pl-1.5 pr-3.5 cursor-pointer`}>
            <span className="w-8 h-8 rounded-full bg-white border border-[#ebe6e7] flex items-center justify-center font-extrabold text-[13px]" style={{ color: f.c }}>{f.lg}</span>
            <span className="text-left"><span className="block font-bold text-[13.5px] whitespace-nowrap">{f.n}</span><span className="block text-[11px] text-[#8b8285]">{f.seg.split(' · ')[0]}</span></span>
          </button>
        ))}
        <button onClick={() => setModal(<MarcaModal nome="" />)} className={`flex-none ${card} rounded-full px-4 font-bold text-[13.5px]`} style={{ color: WINE }}>+ Empresa</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6 items-start">
        <div>
          <div className="flex items-baseline justify-between mb-3 px-0.5"><h2 className="text-[18px] font-extrabold">No ar agora</h2><span className="text-[#8b8285] text-xs">nos 5 prédios</span></div>
          <div className={`${card} overflow-hidden`}>
            <div className="grid grid-cols-[120px_1fr]">
              <Frame g="g3" name="Promo Rodízio" h={118} />
              <div className="p-3.5 flex flex-col justify-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 font-extrabold text-[12px]" style={{ color: '#13a24a' }}><span className="w-2 h-2 rounded-full bg-[#13a24a] relative inline-block" />NO AR AGORA</span>
                <h3 className="text-[19px] font-extrabold">Promo Rodízio</h3>
                <span className="text-[12.5px] text-[#8b8285]">Agendado hoje o dia todo · 15 a 17/11</span>
              </div>
            </div>
            <div className="h-[5px] bg-[#ebe6e7] rounded-full mx-3.5 overflow-hidden"><i className="block h-full rounded-full" style={{ width: '42%', background: `linear-gradient(90deg,${WINE},#c0304b)` }} /></div>
            <div className="border-t border-[#f1edee] p-3 px-3.5 flex items-center gap-3 mt-3">
              <div className="w-11 h-11 rounded-[11px] flex-none" style={{ background: grads.g2 }} />
              <div className="flex-1 min-w-0"><div className="text-[10.5px] font-bold tracking-[.09em] uppercase text-[#8b8285]">A seguir</div><div className="font-bold text-sm">Happy Hour · 18h</div></div>
              <div className="font-extrabold text-base tabular-nums px-2.5 py-1.5 rounded-[10px]" style={{ color: WINE, background: '#f8e9ec' }}>{cd}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-3.5 gap-y-2 mt-3 px-0.5 text-xs text-[#8b8285]">
            {[['#13a24a', 'No ar'], [WINE, 'Principal'], ['#2563eb', 'Agendado'], ['#c2740a', 'Em aprovação']].map(([c, l]) => <span key={l} className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded" style={{ background: c as string }} />{l}</span>)}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => go('agenda')} className={`flex items-center gap-3.5 p-4 ${card} w-full text-left cursor-pointer`}>
            <span className="w-12 h-12 rounded-[13px] flex items-center justify-center flex-none" style={{ background: '#f8e9ec', color: WINE }}>📅</span>
            <span className="flex-1 min-w-0"><b className="text-[15.5px] font-extrabold block">Agenda de exibição</b><span className="text-[12.5px] text-[#8b8285]">Veja e organize quando cada vídeo aparece</span></span><span className="text-[#8b8285] text-xl">›</span>
          </button>
          <button onClick={() => go('predios')} className={`flex items-center gap-3.5 p-4 ${card} w-full text-left cursor-pointer`}>
            <span className="w-12 h-12 rounded-[13px] flex items-center justify-center flex-none" style={{ background: '#f8e9ec', color: WINE }}>🏢</span>
            <span className="flex-1 min-w-0"><b className="text-[15.5px] font-extrabold block">Meus prédios</b><span className="text-[12.5px] text-[#8b8285]">5 prédios · veja como está passando em cada um</span></span><span className="text-[#8b8285] text-xl">›</span>
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between mb-3 px-0.5"><h2 className="text-[18px] font-extrabold">Seus vídeos</h2><span className="text-[#8b8285] text-xs">4 de 10</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[['Institucional', 'g1', 'Toca quando não há nada agendado', 'pr', '⭐ Principal'],
          ['Promo Rodízio', 'g3', '15–17/11 · dia todo', 'ar', '● No ar'],
          ['Happy Hour', 'g2', 'Seg–sex · 18h–21h', 'ag', '📅 Agendado'],
          ['Dia dos Namorados', 'g5', 'A EXA está revisando', 'ap', '⏳ Aprovação']].map(([n, g, s, k, b]) => (
            <div key={n} className={`${card} overflow-hidden flex flex-col`}>
              <Frame g={g} name={n} />
              <div className="p-3 flex flex-col gap-1.5 flex-1">
                <span className="font-bold text-sm">{n}</span><span className="text-[11.5px] text-[#8b8285]">{s}</span>
                <div className="flex items-center justify-between gap-1.5 mt-auto pt-1"><Badge k={k}>{b}</Badge>{k !== 'ap' && <button onClick={() => openAgendar(n as string)} className="text-[12px] font-bold px-2.5 py-1.5 rounded-lg bg-[#f7f5f6]" style={{ color: WINE }}>Agendar</button>}</div>
              </div>
            </div>
          ))}
          <button onClick={() => setModal(<UploadModal />)} className="rounded-[20px] border-[1.5px] border-dashed border-[#ebe6e7] bg-[#f7f5f6] min-h-[170px] flex flex-col items-center justify-center gap-1.5 text-[#8b8285] p-4 cursor-pointer">
            <span className="w-11 h-11 rounded-full flex items-center justify-center text-[25px] font-bold" style={{ background: '#f8e9ec', color: WINE }}>+</span>
            <strong className="text-[13.5px]">Novo vídeo</strong><span className="text-[11.5px]">ou peça pra Sofia criar</span>
          </button>
        </div>
      </div>

      <div className="mt-6"><div className="flex items-baseline justify-between mb-3 px-0.5"><h2 className="text-[18px] font-extrabold">Histórico</h2><button onClick={() => setModal(<HistModal />)} className="text-[13px] font-bold" style={{ color: WINE }}>Ver tudo</button></div>
        <div className={note}>⏳ Os vídeos ficam guardados por <b>&nbsp;30 dias</b>. Depois o arquivo é apagado e fica só o registro (nome, miniatura e datas).</div>
      </div>
    </>
  );

  // ---------- Agenda ----------
  const dayNames: Record<number, string> = { 12: 'Quinta, 12', 13: 'Sexta, 13', 14: 'Sábado, 14', 15: 'Domingo, 15', 16: 'Segunda, 16', 17: 'Terça, 17' };
  const Agenda = () => (
    <>
      <div className="text-[11px] font-bold tracking-[.11em] uppercase" style={{ color: WINE }}>Programação</div>
      <h1 className="text-[27px] md:text-[32px] font-extrabold leading-tight">Agenda de exibição</h1>
      <p className="text-[#8b8285] text-[13.5px] mt-1">Um vídeo por vez. Onde não há nada, entra o principal.</p>
      <div className="flex bg-[#f7f5f6] rounded-xl p-1 gap-1 mt-4 max-w-[320px]">
        {(['mes', 'semana'] as const).map(t => <button key={t} onClick={() => setCalTab(t)} className={`flex-1 py-2.5 rounded-lg font-bold text-[13.5px] ${calTab === t ? 'bg-white shadow-[0_1px_2px_rgba(30,15,18,.05)]' : 'text-[#8b8285]'}`} style={calTab === t ? { color: WINE } : {}}>{t === 'mes' ? '📅 Mês' : '📈 Semana'}</button>)}
      </div>

      {calTab === 'mes' ? (
        <div className="grid lg:grid-cols-2 gap-6 mt-5 items-start">
          <div>
            <div className="flex items-center justify-between mb-3"><b className="text-[17px] font-extrabold">Novembro 2026</b><div className="flex gap-1.5"><button className="w-8 h-8 rounded-[10px] bg-[#f7f5f6]">‹</button><button className="w-8 h-8 rounded-[10px] bg-[#f7f5f6]">›</button></div></div>
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} className="text-center text-[10.5px] font-bold text-[#8b8285]">{d}</span>)}</div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => <div key={'o' + i} className="opacity-0" />)}
              {Array.from({ length: 30 }).map((_, i) => {
                const d = i + 1; const es = (ev[d] || []).slice(0, 2);
                return (
                  <button key={d} onClick={() => setSelDay(d)} className="min-h-[52px] rounded-xl p-1.5 flex flex-col gap-0.5 relative overflow-hidden text-left" style={{ background: selDay === d ? '#f8e9ec' : '#f7f5f6', boxShadow: d === 17 ? `inset 0 0 0 2px ${WINE}` : 'none' }}>
                    <span className="text-[12px] font-bold">{d}</span>
                    {es.map(([k, l], j) => <span key={j} className="text-[8.5px] font-bold text-white rounded px-1 whitespace-nowrap overflow-hidden text-ellipsis" style={{ background: evColor[k] }}>{l}</span>)}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-3.5 gap-y-2 mt-3 text-xs text-[#8b8285]">
              {[['#2563eb', 'Agendado'], ['#c2740a', 'Em aprovação'], ['#c2203a', 'Data especial']].map(([c, l]) => <span key={l} className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded" style={{ background: c as string }} />{l}</span>)}
            </div>
          </div>
          <div className={`${card} p-4`}>
            <h4 className="text-[15px] font-extrabold mb-2.5">🗓️ {dayNames[selDay] || 'Dia ' + selDay} de novembro</h4>
            <div className="flex flex-col gap-1.5">
              {[['00–11h', 'pr', 'Institucional', 'principal'], ['11–14h', 'ag', 'Promo Rodízio', 'agendado'], ['14–18h', 'pr', 'Institucional', 'principal'], ['18–21h', 'ag', 'Happy Hour', 'recorrente'], ['21–24h', 'pr', 'Institucional', 'principal']].map(([hr, k, nm, tg], i) => (
                <div key={i} className="grid grid-cols-[66px_1fr] gap-2.5 items-center">
                  <span className="text-[11.5px] text-[#8b8285] font-semibold tabular-nums">{hr}</span>
                  <div className="rounded-[10px] py-2.5 px-3 text-[13px] font-bold text-white flex justify-between items-center gap-2" style={{ background: k === 'pr' ? WINE : '#2563eb' }}>{nm}<small className="font-semibold opacity-90 text-[10.5px]">{tg}</small></div>
                </div>
              ))}
            </div>
            <button onClick={() => openAgendar('')} className="w-full border-[1.5px] border-dashed border-[#ebe6e7] bg-[#f7f5f6] font-bold text-[13px] py-2.5 rounded-[11px] mt-2.5" style={{ color: WINE }}>+ Agendar um vídeo neste dia</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mt-5">
          {[['Seg', '16/11', [['pr', 'Institucional', 0, 100]]], ['Ter', '17/11', [['pr', 'Inst.', 0, 45], ['ag', 'Rodízio', 45, 58], ['pr', 'Inst.', 58, 75], ['ag', 'Happy Hour', 75, 88], ['pr', 'Inst.', 88, 100]]], ['Qua', '18/11', [['pr', 'Institucional', 0, 75], ['ag', 'Happy Hour', 75, 88], ['pr', '', 88, 100]]], ['Qui', '19/11', [['pr', 'Institucional', 0, 75], ['ag', 'Happy Hour', 75, 88], ['pr', '', 88, 100]]], ['Sex', '20/11', [['pr', 'Inst.', 0, 75], ['ag', 'Happy Hour', 75, 88], ['pr', '', 88, 100]]], ['Sáb', '21/11', [['pr', 'Institucional', 0, 100]]], ['Dom', '22/11', [['pr', 'Institucional', 0, 100]]]].map((r: any, i) => (
            <div key={i} className="grid grid-cols-[76px_1fr] gap-2.5 items-center">
              <div className="text-[12.5px] font-bold">{r[0]}<small className="block text-[#8b8285] font-medium text-[10.5px]">{r[1]}</small></div>
              <div className="relative h-[38px] bg-[#f7f5f6] rounded-[10px] overflow-hidden">
                {r[2].map((s: any, j: number) => <div key={j} className="absolute top-1 bottom-1 rounded-[7px] text-white text-[10px] font-bold flex items-center px-1.5 overflow-hidden whitespace-nowrap" style={{ left: s[2] + '%', width: (s[3] - s[2]) + '%', background: s[0] === 'pr' ? WINE : '#2563eb', opacity: s[0] === 'pr' ? 0.9 : 1 }}>{s[1]}</div>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  // ---------- Prédios ----------
  const Predios = () => (
    <>
      <div className="text-[11px] font-bold tracking-[.11em] uppercase" style={{ color: WINE }}>Onde seu vídeo aparece</div>
      <h1 className="text-[27px] md:text-[32px] font-extrabold leading-tight">Meus prédios</h1>
      <p className="text-[#8b8285] text-[13.5px] mt-1">5 prédios contratados · toque pra ver a tela ao vivo de cada um</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {predios.map(p => (
          <button key={p.id} onClick={() => openDetail({ t: 'predio', id: p.id })} className={`${card} overflow-hidden flex text-left cursor-pointer`}>
            <div className="w-[112px] flex-none relative min-h-[96px] flex items-end text-white">
              <BuildingSvg c1={p.c1} c2={p.c2} />
              <span className="absolute top-2 left-2 bg-black/35 backdrop-blur rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1.5"><span className="w-[7px] h-[7px] rounded-full bg-[#2fe17a]" />Online</span>
            </div>
            <div className="p-3 flex-1 min-w-0 flex flex-col justify-center gap-1">
              <div className="font-extrabold text-[15.5px]">{p.n}</div>
              <div className="text-[12px] text-[#8b8285]">{p.a} · {p.t} telas</div>
              <div className="text-[12px] text-[#554e50] flex items-center gap-1.5 mt-0.5"><Badge k="ar">● Promo Rodízio</Badge></div>
            </div>
          </button>
        ))}
      </div>
    </>
  );

  // ---------- Empresa detalhe ----------
  const FirmDetail = ({ id }: { id: string }) => {
    const f = firms[id];
    return (
      <>
        <div className="flex gap-3.5 items-center">
          <div className="w-[66px] h-[66px] rounded-[17px] bg-white border border-[#ebe6e7] flex items-center justify-center font-extrabold text-2xl flex-none" style={{ color: f.c }}>{f.lg}</div>
          <div><h2 className="text-[21px] font-extrabold">{f.n}</h2><div className="text-[12.5px] text-[#8b8285]">{f.seg}</div></div>
        </div>
        <div className="grid lg:grid-cols-2 gap-5 mt-5 items-start">
          <div>
            <div className="flex items-baseline justify-between mb-3 px-0.5"><h2 className="text-[18px] font-extrabold">Comunicação</h2><button onClick={() => setModal(<MarcaModal nome={f.n} />)} className="text-[13px] font-bold" style={{ color: WINE }}>Editar</button></div>
            <div className={`${card} px-4 py-1`}>
              {[['Endereço', f.end], ['Instagram', f.ig], ['WhatsApp', f.wa], ['Tom de voz', f.tom]].map(([k, v], i) => (
                <div key={i} className="flex gap-2.5 py-2.5 border-b border-[#f1edee] last:border-0 text-[13.5px]"><span className="text-[#8b8285] w-24 flex-none font-semibold">{k}</span><span className="font-semibold min-w-0 break-words">{v}</span></div>
              ))}
              <div className="flex gap-2.5 py-2.5 text-[13.5px]"><span className="text-[#8b8285] w-24 flex-none font-semibold">Cores</span><span>{f.cores.map((c: string) => <i key={c} className="w-4 h-4 rounded-[5px] inline-block align-[-3px] mr-1 border border-black/10" style={{ background: c }} />)}</span></div>
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-3 px-0.5"><h2 className="text-[18px] font-extrabold">Logo &amp; tipografia</h2></div>
            <div className={`${card} p-4 flex flex-col gap-3`}>
              <div className="flex gap-3 items-center"><div className="w-[54px] h-[54px] rounded-[14px] bg-white border border-[#ebe6e7] flex items-center justify-center font-extrabold text-xl" style={{ color: f.c }}>{f.lg}</div><div><div className="font-bold text-[13.5px]">Logo sem fundo ✓</div><div className="text-[12px] text-[#8b8285]">PNG transparente · usado pela Sofia</div></div></div>
              <div className="p-3.5 rounded-[13px] bg-[#f7f5f6]"><div className="text-[20px] font-extrabold">{f.n}</div><div className="text-[13px] text-[#554e50] mt-0.5">{f.tipo} — a Sofia aplica isso em todos os vídeos.</div></div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-3 px-0.5"><h2 className="text-[18px] font-extrabold">🎞️ Vídeos crus</h2><span className="text-[#8b8285] text-xs">{f.raws.length} clipes</span></div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {f.raws.map(([n, g]: any) => (
              <div key={n} className="flex-none w-[118px] h-[76px] rounded-xl relative flex items-end p-1.5 text-white text-[11px] font-bold overflow-hidden" style={{ background: grads[g] }}>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26px] h-[26px] rounded-full bg-white/25 flex items-center justify-center text-[11px]">▶</span>{n}
              </div>
            ))}
            <button onClick={() => setModal(<RawModal n={f.n} />)} className="flex-none w-[118px] h-[76px] rounded-xl bg-[#f7f5f6] border-[1.5px] border-dashed border-[#ebe6e7] text-2xl" style={{ color: WINE }}>+</button>
          </div>
          <div className={`${note} mt-3`}>🎬 É a matéria-prima. A Sofia usa esses crus pra montar os vídeos finais — quanto mais crus, mais ela consegue variar.</div>
        </div>
      </>
    );
  };

  // ---------- Prédio detalhe (réplica) ----------
  const PredioDetail = ({ id }: { id: string }) => {
    const p = predios.find(x => x.id === id)!;
    return (
      <>
        <div className="text-[11px] font-bold tracking-[.11em] uppercase" style={{ color: WINE }}>Prédio contratado</div>
        <h1 className="text-[27px] md:text-[32px] font-extrabold leading-tight">{p.n}</h1>
        <p className="text-[#8b8285] text-[13.5px] mt-1">{p.a} · {p.t} telas · <span className="font-bold" style={{ color: '#13a24a' }}>● Online</span></p>
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 mt-5 items-start">
          <div>
            <h2 className="text-[18px] font-extrabold mb-3">Como está passando agora</h2>
            <div className="rounded-2xl overflow-hidden relative aspect-video shadow-[0_2px_6px_rgba(30,15,18,.06),0_24px_48px_-22px_rgba(30,15,18,.3)]" style={{ background: '#2a0a12' }}>
              <div className="absolute inset-0" style={{ background: 'radial-gradient(130% 90% at 30% 10%,#b8243f,transparent 60%),linear-gradient(160deg,#5c0f1f,#2a0a12)' }} />
              <span className="absolute top-2.5 right-2.5 z-[2] bg-black/40 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold text-white flex items-center gap-1.5"><span className="w-[7px] h-[7px] rounded-full bg-[#ff4d5e]" />AO VIVO</span>
              <div className="absolute inset-0 p-2.5 grid gap-2" style={{ gridTemplateColumns: '1.55fr 1fr', gridTemplateRows: 'auto 1fr auto' }}>
                <div className="rounded-[10px] bg-white/12 border border-white/20 backdrop-blur px-2.5 py-1.5 text-white flex flex-col justify-center" style={{ gridColumn: '1/2' }}><div className="text-[17px] font-extrabold leading-none">14:22</div><div className="text-[9px] opacity-85">terça, 17 nov</div></div>
                <div className="rounded-[10px] bg-white/12 border border-white/20 backdrop-blur px-2.5 py-1.5 text-white flex items-center justify-between" style={{ gridColumn: '2/3' }}><span className="text-[19px]">⛅</span><span className="text-[17px] font-extrabold">27°</span></div>
                <div className="rounded-[10px] overflow-hidden relative flex items-end text-white" style={{ gridColumn: '1/2', gridRow: '2/3', background: grads.g3, boxShadow: '0 8px 20px -8px rgba(0,0,0,.6)' }}>
                  <span className="absolute top-1.5 left-1.5 bg-black/40 rounded-md px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1">▶ Seu anúncio</span>
                  <span className="px-2.5 py-2 font-extrabold text-[13px] relative z-[1]" style={{ textShadow: '0 1px 8px rgba(0,0,0,.6)' }}>Promo Rodízio</span>
                </div>
                <div className="rounded-[10px] relative overflow-hidden flex items-center justify-center text-center border border-dashed border-white/30" style={{ gridColumn: '2/3', gridRow: '2/4', background: 'repeating-linear-gradient(45deg,rgba(255,255,255,.08),rgba(255,255,255,.08) 10px,rgba(255,255,255,.04) 10px,rgba(255,255,255,.04) 20px)' }}>
                  <div className="text-white p-2.5 text-[9.5px] font-bold leading-snug opacity-95"><span className="text-[17px] block mb-1">🔒</span>Área do condomínio<br />visível só para moradores</div>
                </div>
                <div className="rounded-[10px] bg-white/12 border border-white/20 backdrop-blur px-2.5 py-1.5 text-[9px] text-white flex items-center gap-1.5" style={{ gridColumn: '1/2', gridRow: '3/4' }}><span className="w-1.5 h-1.5 rounded-full bg-[#2fe17a]" />Câmera ao vivo · Ponte da Amizade</div>
              </div>
            </div>
            <div className={`${note} mt-3`}>👁️ Esta é a réplica real da tela do {p.n}. A área de avisos do condomínio fica <b>&nbsp;oculta</b>&nbsp; — essas informações são privadas dos moradores.</div>
          </div>
          <div>
            <h2 className="text-[18px] font-extrabold mb-3">Audiência estimada</h2>
            <div className={`${card} p-4 flex justify-between text-center`}>
              {[[p.t, 'telas'], ['~180', 'pessoas/dia'], ['42', 'aptos']].map(([a, b], i) => <div key={i}><div className="text-[22px] font-extrabold">{a}</div><div className="text-[11.5px] text-[#8b8285]">{b}</div></div>)}
            </div>
          </div>
        </div>
      </>
    );
  };

  function MarcaModal({ nome }: { nome: string }) {
    return <Modal><h3 className="text-[19px] font-extrabold mb-1">{nome ? 'Editar empresa' : 'Nova empresa'}</h3>
      {[['Nome', nome], ['Segmento', ''], ['Endereço', ''], ['Instagram / WhatsApp', '']].map(([l, v]) => <div key={l} className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">{l}</label><input className={inp} defaultValue={v} /></div>)}
      <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Logo sem fundo</label><div className="border-[1.5px] border-dashed border-[#ebe6e7] bg-[#f7f5f6] rounded-[11px] p-4.5 text-center font-bold text-[13px]" style={{ color: WINE }}>🖼️ Enviar PNG transparente</div></div>
      <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Vídeos crus</label><div className="border-[1.5px] border-dashed border-[#ebe6e7] bg-[#f7f5f6] rounded-[11px] p-4.5 text-center font-bold text-[13px]" style={{ color: WINE }}>🎞️ Enviar clipes (pode vários)</div></div>
      <div className={`${note} mt-3.5`}>💬 A Sofia também pede e preenche tudo isso por WhatsApp.</div>
      <button onClick={() => setModal(null)} className={bigBtn} style={{ background: WINE }}>Salvar</button></Modal>;
  }
  function RawModal({ n }: { n: string }) {
    return <Modal><h3 className="text-[19px] font-extrabold mb-1">Vídeos crus — {n}</h3><p className="text-[#8b8285] text-[13.5px]">Matéria-prima da empresa. A Sofia usa pra montar os vídeos finais.</p>
      <div className="border-[1.5px] border-dashed border-[#ebe6e7] bg-[#f7f5f6] rounded-[11px] p-5 text-center font-bold text-[13px] mt-3.5" style={{ color: WINE }}>📎 Escolher clipes (vários)</div>
      <button onClick={() => setModal(null)} className={bigBtn} style={{ background: WINE }}>Salvar na biblioteca</button></Modal>;
  }
  function UploadModal() {
    return <Modal><h3 className="text-[19px] font-extrabold mb-1">Novo vídeo</h3><p className="text-[#8b8285] text-[13.5px]">Envie o arquivo. A EXA revisa e libera.</p>
      <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Nome</label><input className={inp} placeholder="Ex.: Promo de Natal" /></div>
      <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Empresa</label><select className={inp}><option>Del Fuego Steakhouse</option><option>Del Fuego Delivery</option></select></div>
      <div className="border-[1.5px] border-dashed border-[#ebe6e7] bg-[#f7f5f6] rounded-[11px] p-5 text-center font-bold text-[13px] mt-3.5" style={{ color: WINE }}>📎 Escolher vídeo</div>
      <div className={`${note} mt-3.5`}>💬 Ou peça pra Sofia criar no WhatsApp.</div>
      <button onClick={() => setModal(null)} className={bigBtn} style={{ background: WINE }}>Enviar para aprovação</button></Modal>;
  }
  function HistModal() {
    return <Modal><h3 className="text-[19px] font-extrabold mb-1">Histórico de vídeos</h3><div className={`${note} my-2.5`}>⏳ Guardados por 30 dias. Depois fica só o registro.</div>
      {[['Promo Dia das Mães', '10–12/05 · dia todo', 'Excluído 11/06', 'g5'], ['Fondue de Inverno', '01–30/06 · 18h–22h', 'Excluído 30/07', 'g4'], ['Aniversário 5 anos', '20/08 · dia todo', 'Excluído 19/09', 'g3']].map(([a, b, c, g]) => (
        <div key={a} className="flex gap-2.5 items-center py-2.5 border-b border-[#f1edee]"><div className="w-[52px] h-10 rounded-[9px]" style={{ background: grads[g] }} /><div className="flex-1"><div className="font-bold text-sm">{a}</div><div className="text-[12px] text-[#8b8285]">{b}</div></div><div className="text-[11px] text-[#8b8285] text-right">{c}</div></div>
      ))}
      <button onClick={() => setModal(null)} className={bigBtn} style={{ background: WINE }}>Fechar</button></Modal>;
  }

  const tabs: [View, string][] = [['inicio', 'Início'], ['agenda', 'Agenda'], ['predios', 'Prédios'], ['empresas', 'Empresas']];

  return (
    <div className="min-h-screen" style={{ background: '#f3f1f2', color: '#1b1719', fontFamily: '"Plus Jakarta Sans",-apple-system,system-ui,sans-serif', paddingBottom: 90 }}>
      {/* top bar */}
      <div className="sticky top-0 z-30 bg-[#f3f1f2]/85 backdrop-blur border-b border-[#ebe6e7]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          {detail ? <button onClick={() => setDetail(null)} className="font-bold text-[15px] flex items-center" style={{ color: WINE }}>‹ Voltar</button>
            : <div className="flex items-center gap-2 font-extrabold text-[19px]" style={{ color: WINE, letterSpacing: '-.03em' }}><span className="w-[9px] h-[9px] rounded-full" style={{ background: WINE, boxShadow: '0 0 0 4px #f8e9ec' }} />exa</div>}
          {/* desktop tabs */}
          <div className="hidden md:flex gap-1 ml-4">
            {tabs.map(([v, l]) => <button key={v} onClick={() => go(v)} className={`px-3.5 py-1.5 rounded-full text-[13.5px] font-bold ${view === v && !detail ? 'bg-white shadow-[0_1px_2px_rgba(30,15,18,.06)]' : 'text-[#6e6e73]'}`} style={view === v && !detail ? { color: WINE } : {}}>{l}</button>)}
          </div>
          <div className="flex-1" />
          <span className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm" style={{ background: '#f8e9ec', color: WINE }}>DF</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        {detail?.t === 'firm' ? <FirmDetail id={detail.id} />
          : detail?.t === 'predio' ? <PredioDetail id={detail.id} />
            : view === 'inicio' ? <Inicio />
              : view === 'agenda' ? <Agenda />
                : view === 'predios' ? <Predios />
                  : (
                    <>
                      <div className="text-[11px] font-bold tracking-[.11em] uppercase" style={{ color: WINE }}>Suas empresas</div>
                      <h1 className="text-[27px] md:text-[32px] font-extrabold leading-tight">Empresas do pedido</h1>
                      <p className="text-[#8b8285] text-[13.5px] mt-1">Um pedido pode divulgar mais de uma empresa sua</p>
                      <div className="flex flex-col gap-3 mt-4 max-w-2xl">
                        {Object.entries(firms).map(([id, f]) => (
                          <button key={id} onClick={() => openDetail({ t: 'firm', id })} className={`flex items-center gap-3.5 p-4 ${card} w-full text-left`}>
                            <span className="w-12 h-12 rounded-[13px] bg-white border border-[#ebe6e7] flex items-center justify-center font-extrabold flex-none" style={{ color: f.c }}>{f.lg}</span>
                            <span className="flex-1 min-w-0"><b className="text-[15.5px] font-extrabold block">{f.n}</b><span className="text-[12.5px] text-[#8b8285]">{f.seg} · {f.raws.length} vídeos crus</span></span><span className="text-[#8b8285] text-xl">›</span>
                          </button>
                        ))}
                        <button onClick={() => setModal(<MarcaModal nome="" />)} className={`flex items-center gap-3.5 p-4 ${card} w-full text-left`}>
                          <span className="w-12 h-12 rounded-[13px] flex items-center justify-center flex-none text-2xl font-bold" style={{ background: '#f8e9ec', color: WINE }}>+</span>
                          <span className="flex-1"><b className="text-[15.5px] font-extrabold block">Adicionar empresa</b><span className="text-[12.5px] text-[#8b8285]">Cadastro completo com logo, tipografia e vídeos crus</span></span><span className="text-[#8b8285] text-xl">›</span>
                        </button>
                      </div>
                    </>
                  )}
        <div className="text-center text-[#8b8285] text-[11.5px] py-6">Prévia · dados fictícios do Del Fuego · não afeta o sistema real</div>
      </div>

      {/* bottom tab bar (mobile) */}
      <div className="md:hidden fixed left-0 right-0 bottom-0 z-40 bg-white/90 backdrop-blur border-t border-[#ebe6e7]" style={{ paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-4 px-2">
          {tabs.map(([v, l]) => (
            <button key={v} onClick={() => go(v)} className="py-2.5 flex flex-col items-center gap-1 text-[10.5px] font-semibold" style={{ color: view === v && !detail ? WINE : '#8b8285' }}>
              <span className="text-lg">{v === 'inicio' ? '🏠' : v === 'agenda' ? '📅' : v === 'predios' ? '🏢' : '🏷️'}</span>{l}
            </button>
          ))}
        </div>
      </div>

      {modal}
    </div>
  );
}
