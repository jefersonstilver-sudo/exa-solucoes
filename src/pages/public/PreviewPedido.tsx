import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * PRÉVIA CONECTADA (dados REAIS) da nova página do pedido do anunciante.
 * Rota pública: /preview/pedido — lê ao vivo o pedido Del Fuego do sistema.
 * Responsiva (desktop + mobile). Não altera a página real; é só para validar o layout.
 * Requer sessão logada (RLS) — abrir com a conta interna.
 */

const PID = '3f4e727b-287f-43a4-9c02-d262a8e93d44'; // Del Fuego
const WINE = '#9e1b34';
const bgGrads = ['linear-gradient(135deg,#3a1016,#7c1428 55%,#b8324b)', 'linear-gradient(135deg,#0c2a1b,#15603a 55%,#2f9d63)', 'linear-gradient(135deg,#2a1c05,#8a5a0c 55%,#d79a2a)', 'linear-gradient(135deg,#132038,#1f3f7a 55%,#3f74c2)', 'linear-gradient(135deg,#2d0f2a,#7a1f6f 55%,#c23fae)'];
const bldPairs = [['#5b6b8c', '#2d3a56'], ['#2f6a8c', '#143a56'], ['#8c5b5b', '#4a2a2a'], ['#6a8c5b', '#2f4a2a'], ['#8c7a3f', '#4a3f1e'], ['#6a5b8c', '#352a4a']];

const card = 'bg-white rounded-[20px] shadow-[0_1px_2px_rgba(30,15,18,.05),0_8px_24px_-14px_rgba(30,15,18,.16)]';
const badge: Record<string, string> = { ar: 'bg-[#e6f6ec] text-[#13a24a]', ag: 'bg-[#e8eefd] text-[#2563eb]', pr: 'bg-[#f8e9ec] text-[#9e1b34]', ap: 'bg-[#fbefda] text-[#c2740a]', pa: 'bg-[#f0ecea] text-[#8b8285]' };
const note = 'text-[12px] text-[#554e50] bg-[#fdf6f7] border border-[#f8e9ec] rounded-[11px] p-2.5 flex gap-2';

type View = 'inicio' | 'agenda' | 'predios' | 'empresas';
type Detail = { t: 'firm' | 'predio'; id: string } | null;
type Vid = { id: string; nome: string; url: string; duracao: number; slot: number; base: boolean; ativo: boolean; aprov: string };
type Bld = { id: string; nome: string; bairro?: string };

function cleanName(s?: string) { return (s || '').trim().replace(/_/g, ' ').replace(/\.mp4$/i, ''); }

function BuildingSvg({ i }: { i: number }) {
  const [c1, c2] = bldPairs[i % bldPairs.length];
  const id = 'sky' + i;
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

export default function PreviewPedido() {
  const [view, setView] = useState<View>('inicio');
  const [detail, setDetail] = useState<Detail>(null);
  const [modal, setModal] = useState<React.ReactNode>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ped, setPed] = useState<any>(null);
  const [vids, setVids] = useState<Vid[]>([]);
  const [blds, setBlds] = useState<Bld[]>([]);
  const [marca, setMarca] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: p, error: e1 } = await supabase.from('pedidos')
          .select('nome_pedido,client_name,client_id,status,data_inicio,data_fim,plano_meses,lista_predios,tipo_produto').eq('id', PID).single();
        if (e1) throw e1;
        setPed(p);
        const { data: pv } = await supabase.from('pedido_videos')
          .select('slot_position,is_base_video,is_active,approval_status,video_id').eq('pedido_id', PID).order('slot_position');
        const ids = (pv || []).map((x: any) => x.video_id);
        let vmap: Record<string, any> = {};
        if (ids.length) {
          const { data: vv } = await supabase.from('videos').select('id,nome,url,duracao').in('id', ids);
          (vv || []).forEach((v: any) => { vmap[v.id] = v; });
        }
        setVids((pv || []).map((x: any) => ({ id: x.video_id, slot: x.slot_position, base: x.is_base_video, ativo: x.is_active, aprov: x.approval_status, nome: cleanName(vmap[x.video_id]?.nome) || `Vídeo ${x.slot_position}`, url: vmap[x.video_id]?.url || '', duracao: vmap[x.video_id]?.duracao || 0 })));
        const lp = (p?.lista_predios || []) as string[];
        if (lp.length) {
          const { data: bs } = await supabase.from('buildings').select('id,nome,bairro').in('id', lp).order('nome');
          setBlds((bs || []).map((b: any) => ({ id: b.id, nome: (b.nome || '').trim(), bairro: b.bairro })));
        }
        const { data: mc } = await supabase.from('marcas_clientes').select('*').eq('client_id', p?.client_id);
        setMarca(mc && mc.length ? mc[0] : null);
      } catch (e: any) {
        setErr(e?.message || 'Não foi possível carregar. Abra logado na conta interna.');
      } finally { setLoading(false); }
    })();
  }, []);

  const go = (v: View) => { setView(v); setDetail(null); window.scrollTo(0, 0); };
  const openDetail = (d: Detail) => { setDetail(d); window.scrollTo(0, 0); };
  const fmtDate = (s?: string) => s ? s.split('-').reverse().join('/') : '—';
  const principal = vids.find(v => v.base) || vids.find(v => v.ativo) || vids[0];
  const parados = vids.filter(v => v !== principal);

  const VideoFrame = ({ v, h = 94 }: { v?: Vid; h?: number }) => (
    <div className="relative flex items-end p-3 text-white overflow-hidden" style={{ minHeight: h, background: bgGrads[(v?.slot || 1) % bgGrads.length] }}>
      {v?.url ? <video src={v.url} muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" /> : null}
      <span className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm">
        <svg width="13" height="15" viewBox="0 0 14 16" fill="#fff"><path d="M0 0l14 8L0 16z" /></svg>
      </span>
      <span className="relative font-bold text-[13px] leading-tight" style={{ textShadow: '0 1px 10px rgba(0,0,0,.6)' }}>{v?.nome}</span>
    </div>
  );
  const Badge = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${badge[k]}`}>{children}</span>
  );

  // -------- modais --------
  const Modal = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 z-[60] bg-[rgba(20,8,12,.5)] backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
      <div className="bg-white w-full sm:max-w-[460px] rounded-t-[22px] sm:rounded-[22px] max-h-[92vh] overflow-auto p-5">
        <div className="w-10 h-1 rounded-full bg-[#ebe6e7] mx-auto mb-3 sm:hidden" />{children}
      </div>
    </div>
  );
  const bigBtn = 'w-full mt-4 py-3.5 rounded-[14px] border-0 text-white font-extrabold text-[15px] cursor-pointer';
  const inp = 'w-full p-3 rounded-xl border border-[#ebe6e7] bg-[#f7f5f6] text-[15px] mt-1.5';

  function AgendarModal() {
    const [res, setRes] = useState(false); const [quando, setQuando] = useState(0); const [hor, setHor] = useState(0);
    const Opt = ({ sel, onClick, children }: any) => (
      <button onClick={onClick} className="flex-1 min-w-[90px] rounded-xl p-2.5 text-[13px] font-bold text-center border" style={sel ? { borderColor: WINE, background: '#f8e9ec', color: WINE } : { borderColor: '#ebe6e7', background: '#f7f5f6', color: '#1b1719' }}>{children}</button>);
    return (<Modal>
      <h3 className="text-[19px] font-extrabold mb-1">Agendar vídeo</h3>
      <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Qual vídeo?</label><select className={inp}>{vids.map(v => <option key={v.id}>{v.nome}</option>)}</select></div>
      <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Quando?</label><div className="flex gap-2">{['Uma data', 'Um período', 'Toda semana'].map((x, i) => <Opt key={i} sel={quando === i} onClick={() => setQuando(i)}>{x}</Opt>)}</div></div>
      <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Data</label><input type="date" className={inp} /></div>
      <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Horário</label><div className="flex gap-2">{['O dia todo', 'Só um horário'].map((x, i) => <Opt key={i} sel={hor === i} onClick={() => setHor(i)}>{x}</Opt>)}</div></div>
      <div className="mt-4 border border-[#c2740a] bg-[#fbefda] rounded-[14px] p-3.5">
        {res ? (<><div className="font-extrabold text-[#13a24a] text-sm">✓ Combinado!</div><p className="text-[13px] m-0 mt-1">Pode confirmar embaixo.</p></>) : (<>
          <div className="font-extrabold text-[#c2740a] text-sm mb-1.5">⚠️ Como o sistema avisaria um conflito</div>
          <p className="text-[13px] m-0 mb-2.5">Se o dia já tivesse um vídeo, a EXA/Sofia perguntaria: quer este <b>por cima</b> ou num <b>horário livre</b>?</p>
          <button onClick={() => setRes(true)} className="block w-full text-left border border-[#ebe6e7] bg-white rounded-xl p-2.5 text-[13px] font-bold mb-2">Deixar este por cima, o dia todo</button>
          <button onClick={() => setRes(true)} className="block w-full text-left border border-[#ebe6e7] bg-white rounded-xl p-2.5 text-[13px] font-bold">Colocar só num horário livre</button>
        </>)}
      </div>
      <button onClick={() => setModal(null)} className={bigBtn} style={{ background: WINE }}>Confirmar</button>
    </Modal>);
  }
  const openAgendar = () => setModal(<AgendarModal />);

  // -------- loading / erro --------
  if (loading) return <Centered>Carregando o pedido do sistema…</Centered>;
  if (err) return <Centered><div className="text-center max-w-sm"><div className="text-[40px]">🔒</div><p className="font-bold mt-2">{err}</p><p className="text-[#8b8285] text-sm mt-1">Esta prévia lê o pedido real — abra já logado na conta interna.</p></div></Centered>;

  const tabs: [View, string][] = [['inicio', 'Início'], ['agenda', 'Agenda'], ['predios', 'Prédios'], ['empresas', 'Empresas']];
  const nomePedido = ped?.nome_pedido || ped?.client_name || 'Pedido';

  // -------- Início --------
  const Inicio = () => (
    <>
      <div className="text-[11px] font-bold tracking-[.11em] uppercase" style={{ color: WINE }}>Seu pedido</div>
      <h1 className="text-[26px] md:text-[32px] font-extrabold leading-tight">{nomePedido}</h1>
      <p className="text-[#8b8285] text-[13.5px] mt-1 capitalize">Pedido {ped?.status} · {fmtDate(ped?.data_inicio)} → {fmtDate(ped?.data_fim)} · {blds.length} prédios · {ped?.tipo_produto}</p>

      {marca ? (
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 mt-4"><button onClick={() => openDetail({ t: 'firm', id: 'm' })} className={`flex-none flex items-center gap-2.5 ${card} rounded-full py-1.5 pl-1.5 pr-3.5`}><span className="w-8 h-8 rounded-full bg-white border border-[#ebe6e7] flex items-center justify-center font-extrabold text-[13px]" style={{ color: WINE }}>{(marca.empresa || 'E')[0]}</span><span className="text-left"><span className="block font-bold text-[13.5px] whitespace-nowrap">{marca.empresa}</span></span></button></div>
      ) : (
        <button onClick={() => setModal(<MarcaModal />)} className={`${card} w-full mt-4 p-3.5 flex items-center gap-3 text-left`}>
          <span className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold flex-none" style={{ background: '#f8e9ec', color: WINE }}>+</span>
          <span className="flex-1"><b className="block text-[14px] font-extrabold">Cadastrar a empresa deste pedido</b><span className="text-[12px] text-[#8b8285]">Logo, comunicação e vídeos crus — a Sofia usa pra criar os vídeos</span></span><span className="text-[#8b8285]">›</span>
        </button>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mt-6 items-start">
        <div>
          <div className="flex items-baseline justify-between mb-3 px-0.5"><h2 className="text-[18px] font-extrabold">No ar agora</h2><span className="text-[#8b8285] text-xs">nos {blds.length} prédios</span></div>
          <div className={`${card} overflow-hidden`}>
            <div className="grid grid-cols-[120px_1fr]">
              <VideoFrame v={principal} h={118} />
              <div className="p-3.5 flex flex-col justify-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 font-extrabold text-[12px]" style={{ color: '#13a24a' }}><span className="w-2 h-2 rounded-full bg-[#13a24a]" />NO AR AGORA</span>
                <h3 className="text-[18px] font-extrabold leading-tight">{principal?.nome}</h3>
                <span className="text-[12.5px] text-[#8b8285]">Vídeo principal · toca sempre que não há nada agendado</span>
              </div>
            </div>
            <div className="border-t border-[#f1edee] p-3 px-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-[11px] flex-none flex items-center justify-center text-lg" style={{ background: '#f8e9ec' }}>📅</div>
              <div className="flex-1 min-w-0"><div className="text-[10.5px] font-bold tracking-[.09em] uppercase text-[#8b8285]">A seguir</div><div className="font-bold text-[13.5px] text-[#554e50]">Nenhum vídeo agendado ainda</div></div>
              <button onClick={() => go('agenda')} className="text-[12px] font-bold px-3 py-1.5 rounded-[10px]" style={{ color: '#fff', background: WINE }}>Agendar</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-3.5 gap-y-2 mt-3 px-0.5 text-xs text-[#8b8285]">
            {[['#13a24a', 'No ar'], [WINE, 'Principal'], ['#2563eb', 'Agendado'], ['#8b8285', 'Parado']].map(([c, l]) => <span key={l} className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded" style={{ background: c as string }} />{l}</span>)}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => go('agenda')} className={`flex items-center gap-3.5 p-4 ${card} w-full text-left`}><span className="w-12 h-12 rounded-[13px] flex items-center justify-center flex-none" style={{ background: '#f8e9ec', color: WINE }}>📅</span><span className="flex-1 min-w-0"><b className="text-[15.5px] font-extrabold block">Agenda de exibição</b><span className="text-[12.5px] text-[#8b8285]">Programe quando cada vídeo aparece</span></span><span className="text-[#8b8285] text-xl">›</span></button>
          <button onClick={() => go('predios')} className={`flex items-center gap-3.5 p-4 ${card} w-full text-left`}><span className="w-12 h-12 rounded-[13px] flex items-center justify-center flex-none" style={{ background: '#f8e9ec', color: WINE }}>🏢</span><span className="flex-1 min-w-0"><b className="text-[15.5px] font-extrabold block">Meus prédios</b><span className="text-[12.5px] text-[#8b8285]">{blds.length} prédios · veja a tela ao vivo</span></span><span className="text-[#8b8285] text-xl">›</span></button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between mb-3 px-0.5"><h2 className="text-[18px] font-extrabold">Seus vídeos</h2><span className="text-[#8b8285] text-xs">{vids.length} de 10</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {principal && (
            <div className={`${card} overflow-hidden flex flex-col`}><VideoFrame v={principal} /><div className="p-3 flex flex-col gap-1.5 flex-1"><span className="font-bold text-sm leading-tight">{principal.nome}</span><span className="text-[11.5px] text-[#8b8285]">Toca quando não há nada agendado</span><div className="flex items-center justify-between gap-1.5 mt-auto pt-1"><Badge k="pr">⭐ Principal</Badge><Badge k="ar">● No ar</Badge></div></div></div>
          )}
          {parados.map(v => (
            <div key={v.id} className={`${card} overflow-hidden flex flex-col`}><VideoFrame v={v} /><div className="p-3 flex flex-col gap-1.5 flex-1"><span className="font-bold text-sm leading-tight">{v.nome}</span><span className="text-[11.5px] text-[#8b8285]">{v.duracao}s · {v.aprov === 'approved' ? 'aprovado' : v.aprov}</span><div className="flex items-center justify-between gap-1.5 mt-auto pt-1"><Badge k="pa">Parado</Badge><button onClick={openAgendar} className="text-[12px] font-bold px-2.5 py-1.5 rounded-lg bg-[#f7f5f6]" style={{ color: WINE }}>Agendar</button></div></div></div>
          ))}
          <button onClick={() => setModal(<UploadModal />)} className="rounded-[20px] border-[1.5px] border-dashed border-[#ebe6e7] bg-[#f7f5f6] min-h-[170px] flex flex-col items-center justify-center gap-1.5 text-[#8b8285] p-4"><span className="w-11 h-11 rounded-full flex items-center justify-center text-[25px] font-bold" style={{ background: '#f8e9ec', color: WINE }}>+</span><strong className="text-[13.5px]">Novo vídeo</strong><span className="text-[11.5px]">ou peça pra Sofia</span></button>
        </div>
      </div>

      <div className="mt-6"><div className="flex items-baseline justify-between mb-3 px-0.5"><h2 className="text-[18px] font-extrabold">Histórico</h2></div>
        <div className={note}>⏳ Os vídeos ficam guardados por <b>&nbsp;30 dias</b>. Depois o arquivo é apagado e fica só o registro (nome, miniatura e datas).</div>
      </div>
    </>
  );

  // -------- Agenda --------
  const Agenda = () => (
    <>
      <div className="text-[11px] font-bold tracking-[.11em] uppercase" style={{ color: WINE }}>Programação</div>
      <h1 className="text-[26px] md:text-[32px] font-extrabold leading-tight">Agenda de exibição</h1>
      <p className="text-[#8b8285] text-[13.5px] mt-1">Um vídeo por vez. Onde não há nada, entra o principal ({principal?.nome}).</p>
      <div className="grid lg:grid-cols-2 gap-6 mt-5 items-start">
        <div>
          <div className="flex items-center justify-between mb-3"><b className="text-[17px] font-extrabold">Novembro 2026</b></div>
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i} className="text-center text-[10.5px] font-bold text-[#8b8285]">{d}</span>)}</div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => <div key={'o' + i} />)}
            {Array.from({ length: 30 }).map((_, i) => {
              const d = i + 1;
              return <div key={d} className="min-h-[48px] rounded-xl p-1.5 flex flex-col relative" style={{ background: '#f7f5f6' }}><span className="text-[12px] font-bold">{d}</span><span className="mt-auto text-[8px] font-bold rounded px-1 text-white truncate" style={{ background: WINE, opacity: .55 }}>{principal?.nome?.split(' ')[0]}</span></div>;
            })}
          </div>
          <div className={`${note} mt-3`}>📭 Nada agendado ainda — o <b>&nbsp;{principal?.nome}</b>&nbsp; (principal) toca todos os dias. É aqui que a Sofia ou você vão encaixar promoções por data.</div>
        </div>
        <div className={`${card} p-4`}>
          <h4 className="text-[15px] font-extrabold mb-2.5">Exemplo de um dia programado</h4>
          <div className="flex flex-col gap-1.5">
            {[['00–11h', 'pr', principal?.nome, 'principal'], ['11–14h', 'ag', 'Promoção do almoço', 'agendado'], ['14–24h', 'pr', principal?.nome, 'principal']].map((r: any, i) => (
              <div key={i} className="grid grid-cols-[66px_1fr] gap-2.5 items-center">
                <span className="text-[11.5px] text-[#8b8285] font-semibold">{r[0]}</span>
                <div className="rounded-[10px] py-2.5 px-3 text-[13px] font-bold text-white flex justify-between items-center gap-2" style={{ background: r[1] === 'pr' ? WINE : '#2563eb' }}>{r[2]}<small className="font-semibold opacity-90 text-[10.5px]">{r[3]}</small></div>
              </div>
            ))}
          </div>
          <button onClick={openAgendar} className="w-full border-[1.5px] border-dashed border-[#ebe6e7] bg-[#f7f5f6] font-bold text-[13px] py-2.5 rounded-[11px] mt-3" style={{ color: WINE }}>+ Agendar um vídeo por data</button>
        </div>
      </div>
    </>
  );

  // -------- Prédios --------
  const Predios = () => (
    <>
      <div className="text-[11px] font-bold tracking-[.11em] uppercase" style={{ color: WINE }}>Onde seu vídeo aparece</div>
      <h1 className="text-[26px] md:text-[32px] font-extrabold leading-tight">Meus prédios</h1>
      <p className="text-[#8b8285] text-[13.5px] mt-1">{blds.length} prédios contratados · toque pra ver a tela ao vivo de cada um</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {blds.map((p, i) => (
          <button key={p.id} onClick={() => openDetail({ t: 'predio', id: p.id })} className={`${card} overflow-hidden flex text-left`}>
            <div className="w-[108px] flex-none relative min-h-[92px] flex items-end text-white"><BuildingSvg i={i} /><span className="absolute top-2 left-2 bg-black/35 backdrop-blur rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1.5"><span className="w-[7px] h-[7px] rounded-full bg-[#2fe17a]" />Online</span></div>
            <div className="p-3 flex-1 min-w-0 flex flex-col justify-center gap-1"><div className="font-extrabold text-[15px] leading-tight">{p.nome}</div>{p.bairro && <div className="text-[12px] text-[#8b8285]">{p.bairro}</div>}<div className="mt-0.5"><Badge k="ar">● {principal?.nome?.split(' ')[0]}</Badge></div></div>
          </button>
        ))}
      </div>
    </>
  );

  // -------- Prédio detalhe (réplica) --------
  const PredioDetail = ({ id }: { id: string }) => {
    const p = blds.find(x => x.id === id)!;
    return (
      <>
        <div className="text-[11px] font-bold tracking-[.11em] uppercase" style={{ color: WINE }}>Prédio contratado</div>
        <h1 className="text-[26px] md:text-[32px] font-extrabold leading-tight">{p.nome}</h1>
        <p className="text-[#8b8285] text-[13.5px] mt-1">{p.bairro || 'Foz do Iguaçu'} · <span className="font-bold" style={{ color: '#13a24a' }}>● Online</span></p>
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 mt-5 items-start">
          <div>
            <h2 className="text-[18px] font-extrabold mb-3">Como está passando agora</h2>
            <div className="rounded-2xl overflow-hidden relative aspect-video shadow-[0_2px_6px_rgba(30,15,18,.06),0_24px_48px_-22px_rgba(30,15,18,.3)]" style={{ background: '#2a0a12' }}>
              <div className="absolute inset-0" style={{ background: 'radial-gradient(130% 90% at 30% 10%,#b8243f,transparent 60%),linear-gradient(160deg,#5c0f1f,#2a0a12)' }} />
              <span className="absolute top-2.5 right-2.5 z-[2] bg-black/40 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold text-white flex items-center gap-1.5"><span className="w-[7px] h-[7px] rounded-full bg-[#ff4d5e]" />AO VIVO</span>
              <div className="absolute inset-0 p-2.5 grid gap-2" style={{ gridTemplateColumns: '1.55fr 1fr', gridTemplateRows: 'auto 1fr auto' }}>
                <div className="rounded-[10px] bg-white/12 border border-white/20 backdrop-blur px-2.5 py-1.5 text-white flex flex-col justify-center" style={{ gridColumn: '1/2' }}><div className="text-[17px] font-extrabold leading-none">14:22</div><div className="text-[9px] opacity-85">hoje</div></div>
                <div className="rounded-[10px] bg-white/12 border border-white/20 backdrop-blur px-2.5 py-1.5 text-white flex items-center justify-between" style={{ gridColumn: '2/3' }}><span className="text-[19px]">⛅</span><span className="text-[17px] font-extrabold">27°</span></div>
                <div className="rounded-[10px] overflow-hidden relative flex items-end text-white" style={{ gridColumn: '1/2', gridRow: '2/3', boxShadow: '0 8px 20px -8px rgba(0,0,0,.6)' }}>
                  {principal?.url ? <video src={principal.url} muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0" style={{ background: bgGrads[0] }} />}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute top-1.5 left-1.5 bg-black/40 rounded-md px-1.5 py-0.5 text-[9px] font-bold z-[1]">▶ Seu anúncio</span>
                  <span className="px-2.5 py-2 font-extrabold text-[12px] relative z-[1]" style={{ textShadow: '0 1px 8px rgba(0,0,0,.6)' }}>{principal?.nome}</span>
                </div>
                <div className="rounded-[10px] relative overflow-hidden flex items-center justify-center text-center border border-dashed border-white/30" style={{ gridColumn: '2/3', gridRow: '2/4', background: 'repeating-linear-gradient(45deg,rgba(255,255,255,.08),rgba(255,255,255,.08) 10px,rgba(255,255,255,.04) 10px,rgba(255,255,255,.04) 20px)' }}>
                  <div className="text-white p-2.5 text-[9.5px] font-bold leading-snug opacity-95"><span className="text-[17px] block mb-1">🔒</span>Área do condomínio<br />visível só para moradores</div>
                </div>
                <div className="rounded-[10px] bg-white/12 border border-white/20 backdrop-blur px-2.5 py-1.5 text-[9px] text-white flex items-center gap-1.5" style={{ gridColumn: '1/2', gridRow: '3/4' }}><span className="w-1.5 h-1.5 rounded-full bg-[#2fe17a]" />Câmera ao vivo</div>
              </div>
            </div>
            <div className={`${note} mt-3`}>👁️ Réplica da tela do {p.nome} com o seu anúncio. A área de avisos do condomínio fica <b>&nbsp;oculta</b>&nbsp; — é privada dos moradores.</div>
          </div>
          <div>
            <h2 className="text-[18px] font-extrabold mb-3">Seu anúncio aqui</h2>
            <div className={`${card} p-4 flex flex-col gap-3`}>
              <div className="flex items-center gap-2"><Badge k="ar">● No ar</Badge><span className="font-bold text-sm">{principal?.nome}</span></div>
              <p className="text-[13px] text-[#554e50]">Mesmo vídeo e mesma regra do pedido rodando aqui, igual aos outros {blds.length - 1} prédios.</p>
            </div>
          </div>
        </div>
      </>
    );
  };

  // -------- Empresa detalhe (marca real, se houver) --------
  const FirmDetail = () => {
    const f = marca;
    if (!f) return <EmptyMarca />;
    const cores = Array.isArray(f.cores) ? f.cores : [];
    return (
      <>
        <div className="flex gap-3.5 items-center"><div className="w-[66px] h-[66px] rounded-[17px] bg-white border border-[#ebe6e7] flex items-center justify-center font-extrabold text-2xl flex-none" style={{ color: WINE }}>{(f.empresa || 'E')[0]}</div><div><h2 className="text-[21px] font-extrabold">{f.empresa}</h2><div className="text-[12.5px] text-[#8b8285]">{f.segmento}</div></div></div>
        <div className={`${card} px-4 py-1 mt-5`}>
          {[['Endereço', f.endereco], ['Instagram', f.instagram], ['WhatsApp', f.whatsapp_qr], ['Site', f.site], ['Tom de voz', f.tom_de_voz], ['Slogan', f.slogan]].map(([k, v], i) => (
            <div key={i} className="flex gap-2.5 py-2.5 border-b border-[#f1edee] last:border-0 text-[13.5px]"><span className="text-[#8b8285] w-24 flex-none font-semibold">{k}</span><span className="font-semibold min-w-0 break-words">{v || '—'}</span></div>
          ))}
          {cores.length > 0 && <div className="flex gap-2.5 py-2.5 text-[13.5px]"><span className="text-[#8b8285] w-24 flex-none font-semibold">Cores</span><span>{cores.map((c: string) => <i key={c} className="w-4 h-4 rounded-[5px] inline-block align-[-3px] mr-1 border border-black/10" style={{ background: c }} />)}</span></div>}
        </div>
        <button onClick={() => setModal(<MarcaModal />)} className="mt-4 w-full py-3 rounded-[13px] text-white font-bold" style={{ background: WINE }}>Editar empresa</button>
      </>
    );
  };
  const EmptyMarca = () => (
    <div className="text-center py-10 max-w-md mx-auto">
      <div className="text-[44px]">🏷️</div>
      <h2 className="text-[20px] font-extrabold mt-2">Nenhuma empresa cadastrada ainda</h2>
      <p className="text-[#8b8285] text-[14px] mt-1">Cadastre a empresa deste pedido — logo sem fundo, comunicação (endereço, Instagram, WhatsApp), posicionamento, tipografia e os <b>vídeos crus</b>. A Sofia usa tudo isso pra criar os vídeos.</p>
      <button onClick={() => setModal(<MarcaModal />)} className="mt-4 px-5 py-3 rounded-[13px] text-white font-bold" style={{ background: WINE }}>+ Cadastrar empresa</button>
      <div className={`${note} mt-4 text-left`}>💬 A Sofia também pede e preenche tudo isso por WhatsApp — inclusive os vídeos crus.</div>
    </div>
  );

  function MarcaModal() {
    return <Modal><h3 className="text-[19px] font-extrabold mb-1">{marca ? 'Editar empresa' : 'Cadastrar empresa'}</h3>
      {[['Nome da empresa', marca?.empresa], ['Segmento', marca?.segmento], ['Endereço', marca?.endereco], ['Instagram / WhatsApp', marca?.instagram]].map(([l, v]) => <div key={l} className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">{l}</label><input className={inp} defaultValue={v || ''} /></div>)}
      <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Logo sem fundo</label><div className="border-[1.5px] border-dashed border-[#ebe6e7] bg-[#f7f5f6] rounded-[11px] p-4 text-center font-bold text-[13px]" style={{ color: WINE }}>🖼️ Enviar PNG transparente</div></div>
      <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Vídeos crus</label><div className="border-[1.5px] border-dashed border-[#ebe6e7] bg-[#f7f5f6] rounded-[11px] p-4 text-center font-bold text-[13px]" style={{ color: WINE }}>🎞️ Enviar clipes (pode vários)</div></div>
      <div className={`${note} mt-3.5`}>💬 A Sofia também preenche tudo isso por WhatsApp.</div>
      <button onClick={() => setModal(null)} className={bigBtn} style={{ background: WINE }}>Salvar</button></Modal>;
  }
  function UploadModal() {
    return <Modal><h3 className="text-[19px] font-extrabold mb-1">Novo vídeo</h3><p className="text-[#8b8285] text-[13.5px]">Envie o arquivo. A EXA revisa e libera.</p>
      <div className="mt-3.5"><label className="block text-[12.5px] font-bold mb-1.5">Nome</label><input className={inp} placeholder="Ex.: Promo de Natal" /></div>
      <div className="border-[1.5px] border-dashed border-[#ebe6e7] bg-[#f7f5f6] rounded-[11px] p-5 text-center font-bold text-[13px] mt-3.5" style={{ color: WINE }}>📎 Escolher vídeo</div>
      <div className={`${note} mt-3.5`}>💬 Ou peça pra Sofia criar no WhatsApp.</div>
      <button onClick={() => setModal(null)} className={bigBtn} style={{ background: WINE }}>Enviar para aprovação</button></Modal>;
  }

  return (
    <div className="min-h-screen" style={{ background: '#f3f1f2', color: '#1b1719', fontFamily: '"Plus Jakarta Sans",-apple-system,system-ui,sans-serif', paddingBottom: 90 }}>
      <div className="sticky top-0 z-30 bg-[#f3f1f2]/85 backdrop-blur border-b border-[#ebe6e7]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          {detail ? <button onClick={() => setDetail(null)} className="font-bold text-[15px]" style={{ color: WINE }}>‹ Voltar</button>
            : <div className="flex items-center gap-2 font-extrabold text-[19px]" style={{ color: WINE, letterSpacing: '-.03em' }}><span className="w-[9px] h-[9px] rounded-full" style={{ background: WINE, boxShadow: '0 0 0 4px #f8e9ec' }} />exa</div>}
          <div className="hidden md:flex gap-1 ml-4">{tabs.map(([v, l]) => <button key={v} onClick={() => go(v)} className={`px-3.5 py-1.5 rounded-full text-[13.5px] font-bold ${view === v && !detail ? 'bg-white shadow-[0_1px_2px_rgba(30,15,18,.06)]' : 'text-[#6e6e73]'}`} style={view === v && !detail ? { color: WINE } : {}}>{l}</button>)}</div>
          <div className="flex-1" />
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#e6f6ec', color: '#13a24a' }}>● dados reais</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        {detail?.t === 'firm' ? <FirmDetail />
          : detail?.t === 'predio' ? <PredioDetail id={detail.id} />
            : view === 'inicio' ? <Inicio />
              : view === 'agenda' ? <Agenda />
                : view === 'predios' ? <Predios />
                  : (marca ? <FirmDetail /> : <EmptyMarca />)}
        <div className="text-center text-[#8b8285] text-[11.5px] py-6">Prévia do layout novo · lê o pedido real · não altera o sistema</div>
      </div>

      <div className="md:hidden fixed left-0 right-0 bottom-0 z-40 bg-white/90 backdrop-blur border-t border-[#ebe6e7]" style={{ paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-4 px-2">{tabs.map(([v, l]) => <button key={v} onClick={() => go(v)} className="py-2.5 flex flex-col items-center gap-1 text-[10.5px] font-semibold" style={{ color: view === v && !detail ? WINE : '#8b8285' }}><span className="text-lg">{v === 'inicio' ? '🏠' : v === 'agenda' ? '📅' : v === 'predios' ? '🏢' : '🏷️'}</span>{l}</button>)}</div>
      </div>
      {modal}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f3f1f2', color: '#1b1719', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif' }}>{children}</div>;
}
