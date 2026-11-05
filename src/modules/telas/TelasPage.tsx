/**
 * Admin · Telas — as telas novas (TV Android, mini PC Windows/Linux, navegador) de comércios parceiros e halls.
 * Adicionar tela = instalar no aparelho → digitar o código que aparece na TV → escolher o local e o layout.
 * A tela pergunta o estado a cada 5 s enquanto espera o código e a cada 60 s depois (função exa-tela).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import {
  Plus, RefreshCw, MonitorPlay, Smartphone, Laptop, Terminal, Globe, Copy, ChevronRight, ChevronLeft, Check,
  MoreHorizontal, Trash2, Unlink, RotateCcw, Eraser, Store, Settings2, LayoutTemplate, Pencil, Video, Activity,
  ArrowLeft, Power, Download, Compass, Wrench, QrCode, Hash,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Moldura, MCab, MTit, MDesc } from './Moldura';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EscolherOrientacao, GradeLayouts, MiniLayout, ehLayoutVertical, infoLayout } from './catalogo';
import { EscolherCameras } from './EscolherCameras';
import { SaudeTela } from './SaudeTela';
import { LerQR } from './LerQR';

const db = supabase as any;
const LINKS = {
  android: 'https://examidia.com.br/baixar-tela',
  androidDireto: 'https://github.com/jefersonstilver-sudo/exa-solucoes/releases/download/tela-android/exa-tela.apk',
  windowsExe: 'https://github.com/jefersonstilver-sudo/exa-solucoes/releases/download/tela-windows/instalar-exa-tela.exe',
  windowsCmd: 'https://examidia.com.br/tela-instalar/instalar-exa-tela-windows.cmd',
  linux: 'curl -fsSL https://examidia.com.br/tela-instalar/instalar-exa-tela-linux.sh | bash',
  navegador: 'https://examidia.com.br/tela',
};
const vidro = 'bg-white/80 backdrop-blur-xl border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_-22px_rgba(70,20,20,0.3)]';

interface Tela {
  id: string; nome: string | null; building_id: string | null; ambiente: string; layout: string; config: any; status: string;
  codigo: string | null; plataforma: string | null; info: any; versao_player: string | null; ultimo_sinal: string | null;
  tocando: any; erros: string[] | null; comando: string | null; pareada_em: string | null; criado_em: string;
}
interface Local { id: string; nome: string; bairro: string | null; endereco: string | null; status: string | null; tipo_local: string | null; segmento_local: string | null; pedido_casa_id: string | null; telas_ritmo: any }

const minutos = (iso?: string | null) => (iso ? (Date.now() - new Date(iso).getTime()) / 60000 : Infinity);
const quando = (iso?: string | null) => {
  const m = minutos(iso);
  if (!Number.isFinite(m)) return 'nunca';
  if (m < 1) return 'agora';
  if (m < 60) return `há ${Math.round(m)} min`;
  if (m < 48 * 60) return `há ${Math.round(m / 60)} h`;
  return new Date(iso!).toLocaleDateString('pt-BR');
};
const estadoDe = (t: Tela) => (t.status !== 'ativa' ? 'aguardando' : minutos(t.ultimo_sinal) <= 3 ? 'ao_vivo' : 'sem_sinal');
const SELO: Record<string, { txt: string; cls: string }> = {
  ao_vivo: { txt: 'Ao vivo', cls: 'bg-[#E3F4EA] text-[#1E6B47]' },
  sem_sinal: { txt: 'Sem sinal', cls: 'bg-[#FBE4E2] text-[#9C1E1E]' },
  aguardando: { txt: 'Aguardando código', cls: 'bg-[#FFF1D6] text-[#8A5A00]' },
};
const nomePlataforma = (p?: string | null) => {
  const s = String(p || '');
  if (s.startsWith('android')) return 'Android';
  if (s.startsWith('windows')) return 'Windows';
  if (s.startsWith('linux')) return 'Linux';
  return s ? 'Navegador' : '—';
};
const copiar = (t: string) => { navigator.clipboard.writeText(t).then(() => toast.success('Copiado')).catch(() => toast.error('Não consegui copiar')); };

function useQr(valor: string) {
  const [img, setImg] = useState('');
  useEffect(() => { QRCode.toDataURL(valor, { margin: 1, width: 220 }).then(setImg).catch(() => {}); }, [valor]);
  return img;
}

// ============================================================== página
export default function TelasPage() {
  const qc = useQueryClient();
  const base = useLocation().pathname.replace(/\/+$/, '');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [adicionar, setAdicionar] = useState(params.get('adicionar') === '1');
  const [layoutDe, setLayoutDe] = useState<Tela | null>(null);
  const [localDe, setLocalDe] = useState<Tela | null>(null);
  const [camerasDe, setCamerasDe] = useState<Tela | null>(null);
  const [saudeDe, setSaudeDe] = useState<Tela | null>(null);

  const telas = useQuery({
    queryKey: ['exa-telas'],
    queryFn: async () => {
      const { data, error } = await db.from('exa_telas').select('*').order('criado_em', { ascending: false });
      if (error) throw error;
      return (data || []) as Tela[];
    },
    refetchInterval: 15000,
  });
  const locais = useQuery({
    queryKey: ['exa-telas-locais'],
    queryFn: async () => {
      const { data, error } = await db.from('buildings').select('id, nome, bairro, endereco, status, tipo_local, segmento_local, pedido_casa_id, telas_ritmo').order('nome');
      if (error) throw error;
      return (data || []) as Local[];
    },
  });
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  const exib = useQuery({
    queryKey: ['exa-telas-exib', hoje],
    queryFn: async () => {
      const { data } = await db.from('exa_telas_exibicoes').select('tela_id, tipo, vezes').eq('dia', hoje);
      const m = new Map<string, number>();
      (data || []).forEach((r: any) => { if (r.tipo === 'anuncio' || r.tipo === 'casa') m.set(r.tela_id, (m.get(r.tela_id) || 0) + r.vezes); });
      return m;
    },
    refetchInterval: 60000,
  });
  const localPor = useMemo(() => new Map((locais.data || []).map((l) => [l.id, l])), [locais.data]);
  const lista = telas.data || [];
  const ativas = lista.filter((t) => t.status === 'ativa');
  const kpis = [
    { r: 'Telas', v: ativas.length },
    { r: 'Ao vivo', v: ativas.filter((t) => estadoDe(t) === 'ao_vivo').length, c: '#1E6B47' },
    { r: 'Sem sinal', v: ativas.filter((t) => estadoDe(t) === 'sem_sinal').length, c: '#9C1E1E' },
    { r: 'Exibições hoje', v: [...(exib.data?.values() || [])].reduce((a, b) => a + b, 0) },
  ];

  const recarregar = () => { qc.invalidateQueries({ queryKey: ['exa-telas'] }); qc.invalidateQueries({ queryKey: ['exa-telas-locais'] }); };
  const fecharAdicionar = () => { setAdicionar(false); if (params.get('adicionar')) { params.delete('adicionar'); params.delete('codigo'); setParams(params, { replace: true }); } };

  const comando = async (t: Tela, c: string, msg: string) => {
    const { error } = await db.from('exa_telas').update({ comando: c, comando_em: new Date().toISOString() }).eq('id', t.id);
    if (error) toast.error(error.message); else { toast.success(msg, { description: 'A tela recebe em até 1 minuto.' }); recarregar(); }
  };
  const desparear = async (t: Tela) => {
    if (!confirm(`Desconectar "${t.nome || 'tela'}"? Ela volta a mostrar um código novo.`)) return;
    const { error } = await db.from('exa_telas').update({ status: 'aguardando', building_id: null, codigo: null, codigo_expira: null }).eq('id', t.id);
    if (error) toast.error(error.message); else { toast.success('Tela desconectada'); recarregar(); }
  };
  const excluir = async (t: Tela) => {
    if (!confirm(`Excluir "${t.nome || t.codigo || 'tela'}" de vez? Se o aparelho estiver ligado, ele mostra um código novo.`)) return;
    const { error } = await db.from('exa_telas').delete().eq('id', t.id);
    if (error) toast.error(error.message); else { toast.success('Tela excluída'); recarregar(); }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 text-[#17181A]" style={{ fontFeatureSettings: '"tnum"' }}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-[#6A6B70]">Comércios parceiros e halls</div>
          <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.03em] md:text-[30px]">Telas</h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={recarregar} className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${vidro}`} title="Atualizar">
            <RefreshCw className={`h-4 w-4 ${telas.isFetching ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Atualizar</span>
          </button>
          <button type="button" onClick={() => setAdicionar(true)} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#9C1E1E] px-4 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(156,30,30,0.8)]">
            <Plus className="h-4 w-4" />Adicionar tela
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.r} className={`rounded-2xl p-4 ${vidro}`}>
            <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6A6B70]">{k.r}</div>
            <div className="mt-1 text-[28px] font-extrabold leading-none" style={{ color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {telas.error && <div className="rounded-2xl bg-[#FBE4E2] p-4 text-sm text-[#9C1E1E]">Não consegui ler as telas: {(telas.error as Error).message}. Se acabou de publicar, falta rodar o SQL das telas.</div>}

      {!telas.isLoading && !lista.length && (
        <div className={`rounded-3xl p-8 text-center ${vidro}`}>
          <MonitorPlay className="mx-auto h-10 w-10 text-[#9C1E1E]" />
          <h2 className="mt-3 text-xl font-extrabold">Nenhuma tela ainda</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#5E5F63]">Instale o app EXA Tela na TV (ou abra examidia.com.br/tela em qualquer navegador), anote o código que aparece e toque em Adicionar tela.</p>
          <button type="button" onClick={() => setAdicionar(true)} className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#9C1E1E] px-5 text-sm font-bold text-white"><Plus className="h-4 w-4" />Adicionar tela</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lista.map((t) => {
          const st = estadoDe(t);
          const local = t.building_id ? localPor.get(t.building_id) : null;
          const lay = infoLayout(t.layout);
          return (
            <article key={t.id} className={`flex min-w-0 flex-col gap-3 rounded-3xl p-4 ${vidro}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`${base}/${t.id}`} className="block truncate text-[17px] font-extrabold hover:underline">{t.nome || (t.status === 'ativa' ? 'Tela' : `Código ${t.codigo || '…'}`)}</Link>
                  <div className="truncate text-[13px] text-[#5E5F63]">{local ? `${local.nome}${local.segmento_local ? ` · ${local.segmento_local}` : ''}` : 'Sem local'} · {t.ambiente === 'hall' ? 'Hall' : 'Comércio'}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${SELO[st].cls}`}>{SELO[st].txt}</span>
                  <Link to={`${base}/${t.id}`} aria-label="Abrir a tela" title="Abrir: configurações, saúde, câmeras e comandos" className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5"><ChevronRight className="h-4 w-4" /></Link>
                </div>
              </div>

              {st === 'aguardando' && (
                <button type="button" onClick={() => setAdicionar(true)} className="rounded-2xl bg-[#FFF1D6] px-3 py-2 text-left text-[13px] font-semibold text-[#8A5A00]">
                  Esta TV está mostrando o código {t.codigo || '…'}. Toque para conectar →
                </button>
              )}
              <button type="button" onClick={() => setLayoutDe(t)} className="flex min-w-0 items-center gap-3 rounded-2xl bg-black/[0.035] p-2 text-left hover:bg-black/[0.06]">
                <MiniLayout id={t.layout} largura={112} className="shrink-0" />
                <div className="min-w-0">
                  <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6A6B70]">Layout {lay.id}</div>
                  <div className="truncate text-[15px] font-bold">{lay.nome}</div>
                  <div className="text-[12px] font-semibold text-[#9C1E1E]">Trocar</div>
                </div>
              </button>

              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[13px]">
                <dt className="text-[#6A6B70]">Tocando</dt>
                <dd className="truncate font-semibold">{t.tocando?.cliente || t.tocando?.titulo || '—'}</dd>
                <dt className="text-[#6A6B70]">Exibições hoje</dt>
                <dd className="font-semibold">{exib.data?.get(t.id) || 0}</dd>
                <dt className="text-[#6A6B70]">Último sinal</dt>
                <dd className="font-semibold">{quando(t.ultimo_sinal)}</dd>
                <dt className="text-[#6A6B70]">Internet</dt>
                <dd className="truncate font-semibold">{(t as any).saude?.conexao ? `${(t as any).saude.conexao}${(t as any).saude.rtt ? ` · ${(t as any).saude.rtt} ms` : ''}` : '—'}</dd>
                <dt className="text-[#6A6B70]">Fluidez</dt>
                <dd className="truncate font-semibold">
                  <button type="button" onClick={() => navigate(`${base}/${t.id}`)} className="underline decoration-dotted underline-offset-2">
                    {(t as any).saude?.fluidez?.fps != null ? `${(t as any).saude.fluidez.fps} quadros/s · ${(t as any).saude.fluidez.video_pct_perdidos ?? 0}% perdidos` : 'ver saúde'}
                  </button>
                </dd>
                <dt className="text-[#6A6B70]">Aparelho</dt>
                <dd className="truncate font-semibold" title={t.info?.ua || ''}>{nomePlataforma(t.plataforma)}{t.info?.tela ? ` · ${String(t.info.tela).split('@')[0]}` : ''}</dd>
              </dl>
              {!!t.erros?.length && st !== 'aguardando' && (
                <details className="rounded-xl bg-[#FFF6E5] px-3 py-2 text-[12px] text-[#7A5200]">
                  <summary className="cursor-pointer font-bold">{t.erros.length} aviso(s) recente(s)</summary>
                  <ul className="mt-1 space-y-0.5">{t.erros.slice(-5).map((e, i) => <li key={i} className="break-words">{e}</li>)}</ul>
                </details>
              )}
              {t.comando && <div className="text-[12px] font-semibold text-[#8A5A00]">Comando pendente: {t.comando}</div>}
            </article>
          );
        })}
      </div>

      {adicionar && <AdicionarTela locais={locais.data || []} codigoInicial={(params.get('codigo') || '').replace(/\D/g, '').slice(0, 6)} onFechar={fecharAdicionar} onPronto={() => { fecharAdicionar(); recarregar(); }} />}
      {layoutDe && <EscolherLayout tela={layoutDe} predio={(locais.data || []).find((l) => l.id === layoutDe.building_id)?.tipo_local !== 'comercio'} onFechar={() => setLayoutDe(null)} onSalvo={() => { setLayoutDe(null); recarregar(); }} onAtualizou={recarregar} />}
      {saudeDe && <SaudeTela tela={(telas.data || []).find((x: Tela) => x.id === saudeDe.id) || saudeDe} onFechar={() => setSaudeDe(null)} onAtualizou={recarregar} />}
      {camerasDe && (
        <EscolherCameras titulo={camerasDe.nome || 'tela'} atual={camerasDe.config?.cameras} onFechar={() => setCamerasDe(null)}
          onSalvar={async (c) => {
            const { error } = await db.from('exa_telas').update({ config: { ...(camerasDe.config || {}), cameras: c } }).eq('id', camerasDe.id);
            if (error) throw error;
            recarregar();
          }} />
      )}
      {localDe && <ConfigTela tela={localDe} locais={locais.data || []} onFechar={() => setLocalDe(null)} onSalvo={() => { setLocalDe(null); recarregar(); }} />}
    </div>
  );
}

// ============================================================== adicionar tela (4 passos)
type NovoLocal = { nome: string; segmento: string; endereco: string; bairro: string };

function AdicionarTela({ locais, onFechar, onPronto, codigoInicial = '' }: { locais: Local[]; onFechar: () => void; onPronto: () => void; codigoInicial?: string }) {
  // vindo de Painéis EXA com o código da TV já conhecido: pula direto para o passo do código
  const [passo, setPasso] = useState(codigoInicial ? 2 : 1);
  const [plat, setPlat] = useState<'android' | 'windows' | 'linux' | 'navegador'>('android');
  const [codigo, setCodigo] = useState(codigoInicial);
  const [achada, setAchada] = useState<Tela | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [modoLocal, setModoLocal] = useState<'existente' | 'novo'>('existente');
  const [busca, setBusca] = useState('');
  const [localId, setLocalId] = useState('');
  const [novo, setNovo] = useState<NovoLocal>({ nome: '', segmento: '', endereco: '', bairro: '' });
  const [ambiente, setAmbiente] = useState<'comercio' | 'hall'>('comercio');
  const [nome, setNome] = useState('');
  const [layout, setLayout] = useState('H6');
  const [orientacao, setOrientacao] = useState<'horizontal' | 'vertical'>('horizontal');
  const [giro, setGiro] = useState(90);
  const [casaCada, setCasaCada] = useState(3);
  const [edCada, setEdCada] = useState(2);
  const [salvando, setSalvando] = useState(false);
  // celular: abrir direto a câmera para ler o QR da TV
  const celular = typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768);
  const [camera, setCamera] = useState(false);
  // a TV já disse a posição (escolhida no próprio aparelho na primeira vez): não pergunta de novo
  const [posicaoDaTV, setPosicaoDaTV] = useState(false);
  const [trocarPosicao, setTrocarPosicao] = useState(false);
  const qrAndroid = useQr(LINKS.android);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const base = [...locais].sort((a, b) => Number(b.tipo_local === 'comercio') - Number(a.tipo_local === 'comercio') || a.nome.localeCompare(b.nome));
    return (q ? base.filter((l) => `${l.nome} ${l.bairro || ''} ${l.segmento_local || ''}`.toLowerCase().includes(q)) : base).slice(0, 60);
  }, [locais, busca]);
  const localEscolhido = locais.find((l) => l.id === localId);
  const ehPredio = modoLocal === 'existente' && !!localEscolhido && localEscolhido.tipo_local !== 'comercio';
  // TV em pé: prédio = réplica do elevador; estabelecimento = layout vertical
  useEffect(() => { setLayout(orientacao === 'vertical' ? (ehPredio ? 'R' : 'V2') : 'H6'); }, [orientacao, ehPredio]);

  const conferir = async (lido?: string) => {
    const c = (lido ?? codigo).replace(/\D/g, '');
    if (c.length !== 6) { toast.error('O código tem 6 números'); return; }
    setBuscando(true);
    const { data, error } = await db.from('exa_telas').select('*').eq('codigo', c).eq('status', 'aguardando').maybeSingle();
    setBuscando(false);
    if (error) { toast.error(error.message); return; }
    if (!data) { toast.error('Não achei esse código', { description: 'Confira o número na TV. O código muda se a tela ficar 24 h sem ser conectada.' }); return; }
    setAchada(data); setPasso(3);
    // a TV já disse como está instalada (escolha na primeira vez que o app abriu): começa por ela
    const gf = Number((data as any)?.info?.giro_fisico);
    if (gf === 0) { setOrientacao('horizontal'); setPosicaoDaTV(true); }
    else if (gf === 90 || gf === 270) { setOrientacao('vertical'); setGiro(gf); setPosicaoDaTV(true); }
    else setPosicaoDaTV(false);
    setTrocarPosicao(false);
  };

  const salvar = async () => {
    if (!achada) return;
    setSalvando(true);
    try {
      let bId = localId;
      let localNome = localEscolhido?.nome || '';
      if (modoLocal === 'novo') {
        if (!novo.nome.trim() || !novo.bairro.trim()) throw new Error('Preencha o nome e o bairro do local');
        const { data: b, error } = await db.from('buildings').insert({
          nome: novo.nome.trim(), bairro: novo.bairro.trim(), endereco: novo.endereco.trim() || novo.bairro.trim(),
          tipo_local: 'comercio', segmento_local: novo.segmento.trim() || null, venue_type: 'Comercial', status: 'inativo',
          quantidade_telas: 1, telas_ritmo: { casa_a_cada: casaCada, editorial_a_cada: edCada },
        }).select('id, nome').single();
        if (error) throw error;
        bId = b.id; localNome = b.nome;
      } else {
        if (!bId) throw new Error('Escolha o local');
        const ritmo = { ...(localEscolhido?.telas_ritmo || {}), casa_a_cada: casaCada, editorial_a_cada: edCada };
        await db.from('buildings').update({ telas_ritmo: ritmo }).eq('id', bId);
      }
      const { data: u } = await supabase.auth.getUser();
      const { error } = await db.from('exa_telas').update({
        nome: nome.trim() || `${localNome} · TV`, building_id: bId, ambiente, layout, status: 'ativa',
        config: { ...(achada.config || {}), orientacao, giro },
        codigo: null, codigo_expira: null, pareada_em: new Date().toISOString(), pareada_por: u?.user?.id || null,
      }).eq('id', achada.id).eq('status', 'aguardando');
      if (error) throw error;
      toast.success('Tela conectada', { description: 'Em alguns segundos a programação aparece na TV.' });
      onPronto();
    } catch (e) {
      toast.error((e as Error).message || 'Não consegui salvar');
    } finally { setSalvando(false); }
  };

  const Plat = ({ id, icone: I, txt }: { id: typeof plat; icone: any; txt: string }) => (
    <button type="button" onClick={() => setPlat(id)} className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-[13px] font-bold ${plat === id ? 'border-[#9C1E1E] bg-[#9C1E1E]/[0.06] text-[#9C1E1E]' : 'border-black/10'}`}>
      <I className="h-5 w-5" />{txt}
    </button>
  );
  const Linha = ({ rotulo, valor, link }: { rotulo: string; valor: string; link?: boolean }) => (
    <div className="flex items-center gap-2 rounded-xl bg-black/[0.04] px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6A6B70]">{rotulo}</div>
        {link ? <a href={valor} target="_blank" rel="noreferrer" className="block truncate text-[13px] font-semibold text-[#9C1E1E] underline">{valor}</a> : <code className="block truncate text-[12.5px] font-semibold">{valor}</code>}
      </div>
      <button type="button" onClick={() => copiar(valor)} aria-label="Copiar" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-black/5"><Copy className="h-4 w-4" /></button>
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onFechar(); }}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-h-[92vh] w-[calc(100vw-24px)] min-w-0 overflow-y-auto overflow-x-hidden [&>*]:min-w-0 [overflow-wrap:anywhere] sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Adicionar tela · passo {passo} de 4</DialogTitle>
          <DialogDescription>{['Instale na TV', 'Digite o código da TV', 'Onde fica a tela', 'Layout e ritmo'][passo - 1]}</DialogDescription>
        </DialogHeader>

        {passo === 1 && (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => { setPasso(2); setCamera(true); }} className="flex items-center gap-3 rounded-2xl bg-[#9C1E1E] px-4 py-3 text-left text-white">
                <QrCode className="h-7 w-7 shrink-0" /><span><span className="block text-[15px] font-extrabold">Ler o QR Code da TV</span><span className="block text-[12.5px] text-white/80">A TV já mostra "Aguardando conexão"</span></span>
              </button>
              <button type="button" onClick={() => { setPasso(2); setCamera(false); }} className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-left">
                <Hash className="h-7 w-7 shrink-0 text-[#9C1E1E]" /><span><span className="block text-[15px] font-extrabold">Digitar o código</span><span className="block text-[12.5px] text-[#5E5F63]">Os 6 números que aparecem na TV</span></span>
              </button>
            </div>
            <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6A6B70]">Ainda não instalou? Escolha o aparelho</div>
            <div className="grid grid-cols-4 gap-2">
              <Plat id="android" icone={Smartphone} txt="TV Android" />
              <Plat id="windows" icone={Laptop} txt="Windows" />
              <Plat id="linux" icone={Terminal} txt="Linux" />
              <Plat id="navegador" icone={Globe} txt="Navegador" />
            </div>
            {plat === 'android' && (
              <div className="flex flex-col gap-4 sm:flex-row">
                {qrAndroid && <img src={qrAndroid} alt="QR para baixar o app" className="h-40 w-40 shrink-0 self-center rounded-xl border border-black/10" />}
                <ol className="list-decimal space-y-1.5 pl-5 text-[14px]">
                  <li>Na TV ou TV box, abra o navegador e digite <b>examidia.com.br/baixar-tela</b> (ou aponte o celular para o QR e mande o arquivo para a TV).</li>
                  <li>Instale o <b>exa-tela.apk</b>. Se pedir, libere "instalar apps desconhecidos" para o navegador.</li>
                  <li>Abra <b>EXA Tela</b>. Quando a TV perguntar o app inicial, escolha EXA Tela para ela abrir sozinha ao ligar.</li>
                  <li>Um código de 6 números aparece na TV.</li>
                </ol>
              </div>
            )}
            {plat === 'android' && <Linha rotulo="Link do app" valor={LINKS.android} link />}
            {plat === 'windows' && (
              <>
                <ol className="list-decimal space-y-1.5 pl-5 text-[14px]">
                  <li>No mini PC, baixe e rode o instalador. O Windows vai avisar "editor desconhecido": clique em <b>Mais informações → Executar assim mesmo</b>.</li>
                  <li>Ele abre a tela sozinho em tela cheia ao ligar, desliga suspensão, notificações e o Windows Update, e pergunta se quer login automático (recomendado, senão a tela para na senha depois de faltar energia).</li>
                  <li>Um código de 6 números aparece na tela.</li>
                </ol>
                <Linha rotulo="Instalador (.exe)" valor={LINKS.windowsExe} link />
                <Linha rotulo="Alternativa (.cmd)" valor={LINKS.windowsCmd} link />
              </>
            )}
            {plat === 'linux' && (
              <>
                <p className="text-[14px]">No terminal do mini PC (Ubuntu), cole o comando abaixo. Ele usa o Chromium em tela cheia e abre sozinho ao ligar.</p>
                <Linha rotulo="Comando" valor={LINKS.linux} />
              </>
            )}
            {plat === 'navegador' && (
              <>
                <p className="text-[14px]">Qualquer TV ou computador com navegador: abra o endereço abaixo e toque na tela uma vez para entrar em tela cheia. Bom para testar; para ficar fixo, use o app ou o instalador.</p>
                <Linha rotulo="Endereço" valor={LINKS.navegador} link />
              </>
            )}
            <div className="flex justify-end">
              <button type="button" onClick={() => setPasso(2)} className="inline-flex h-11 items-center gap-1 rounded-xl bg-[#9C1E1E] px-5 text-sm font-bold text-white">Já aparece um código na TV<ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        {passo === 2 && (
          <div className="space-y-4">
            {camera ? (
              <LerQR onFechar={() => setCamera(false)} onCodigo={(c) => { setCamera(false); setCodigo(c); conferir(c); }} />
            ) : (
              <button type="button" onClick={() => setCamera(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#9C1E1E]/40 bg-[#9C1E1E]/[0.04] py-3 text-[14px] font-bold text-[#9C1E1E]">
                <QrCode className="h-5 w-5" />Ler o QR Code da TV com a câmera
              </button>
            )}
            <label className="block text-[14px] font-semibold">{camera ? 'Ou digite o código que aparece na TV' : 'Código que aparece na TV'}</label>
            <input
              autoFocus={!celular && !camera} inputMode="numeric" maxLength={7} value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              onKeyDown={(e) => { if (e.key === 'Enter') conferir(); }}
              placeholder="000000"
              className="h-16 w-full rounded-2xl border border-black/15 text-center text-[36px] font-extrabold tracking-[0.4em] outline-none focus:border-[#9C1E1E]"
            />
            <div className="flex justify-between">
              <button type="button" onClick={() => setPasso(1)} className="inline-flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold hover:bg-black/5"><ChevronLeft className="h-4 w-4" />Voltar</button>
              <button type="button" disabled={buscando || codigo.length !== 6} onClick={() => conferir()} className="inline-flex h-11 items-center gap-1 rounded-xl bg-[#9C1E1E] px-5 text-sm font-bold text-white disabled:opacity-50">{buscando ? 'Procurando…' : 'Conferir'}<ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        {passo === 3 && achada && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-[#E3F4EA] px-3 py-2 text-[13px] font-semibold text-[#1E6B47]"><Check className="h-4 w-4" />Achei a tela: {nomePlataforma(achada.plataforma)}{achada.info?.tela ? ` · ${String(achada.info.tela).split('@')[0]}` : ''}</div>
            <div className="inline-flex rounded-xl bg-black/[0.05] p-1">
              {(['existente', 'novo'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setModoLocal(m)} className={`h-9 rounded-lg px-3 text-sm font-bold ${modoLocal === m ? 'bg-white shadow-sm' : 'text-[#5E5F63]'}`}>{m === 'existente' ? 'Local já cadastrado' : 'Novo comércio'}</button>
              ))}
            </div>
            {modoLocal === 'existente' ? (
              <div className="space-y-2">
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar local (nome, bairro, segmento)" className="h-11 w-full rounded-xl border border-black/15 px-3 text-[14px] outline-none focus:border-[#9C1E1E]" />
                <div className="max-h-56 space-y-1 overflow-y-auto">
                  {filtrados.map((l) => (
                    <button key={l.id} type="button" onClick={() => setLocalId(l.id)} className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[14px] ${localId === l.id ? 'bg-[#9C1E1E] text-white' : 'hover:bg-black/5'}`}>
                      <span className="min-w-0 truncate"><b>{l.nome}</b> <span className="opacity-75">· {l.bairro}</span></span>
                      <span className="shrink-0 text-[12px] font-bold opacity-80">{l.tipo_local === 'comercio' ? l.segmento_local || 'Comércio' : 'Prédio'}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Nome (ex.: Del Fuego)" className="h-11 rounded-xl border border-black/15 px-3 text-[14px]" />
                <input value={novo.segmento} onChange={(e) => setNovo({ ...novo, segmento: e.target.value })} placeholder="Segmento (ex.: Restaurante)" className="h-11 rounded-xl border border-black/15 px-3 text-[14px]" />
                <input value={novo.endereco} onChange={(e) => setNovo({ ...novo, endereco: e.target.value })} placeholder="Endereço" className="h-11 rounded-xl border border-black/15 px-3 text-[14px]" />
                <input value={novo.bairro} onChange={(e) => setNovo({ ...novo, bairro: e.target.value })} placeholder="Bairro" className="h-11 rounded-xl border border-black/15 px-3 text-[14px]" />
                <p className="text-[12px] text-[#6A6B70] sm:col-span-2">O local é criado fora da loja. Para vender, complete preço, foto e público em Prédios e mude para Ativo.</p>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#6A6B70]">Ambiente</div>
                <div className="inline-flex rounded-xl bg-black/[0.05] p-1">
                  {(['comercio', 'hall'] as const).map((a) => (
                    <button key={a} type="button" onClick={() => setAmbiente(a)} className={`h-9 rounded-lg px-3 text-sm font-bold ${ambiente === a ? 'bg-white shadow-sm' : 'text-[#5E5F63]'}`}>{a === 'comercio' ? 'Comércio' : 'Hall / portaria'}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#6A6B70]">Nome da tela</div>
                <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={`${modoLocal === 'novo' ? novo.nome || 'Local' : localEscolhido?.nome || 'Local'} · TV`} className="h-11 w-full rounded-xl border border-black/15 px-3 text-[14px]" />
              </div>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setPasso(2)} className="inline-flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold hover:bg-black/5"><ChevronLeft className="h-4 w-4" />Voltar</button>
              <button type="button" disabled={modoLocal === 'existente' ? !localId : !novo.nome.trim() || !novo.bairro.trim()} onClick={() => {
                const r = (modoLocal === 'existente' ? localEscolhido?.telas_ritmo : null) || {};
                if (r.casa_a_cada) setCasaCada(Number(r.casa_a_cada)); if (r.editorial_a_cada) setEdCada(Number(r.editorial_a_cada));
                setPasso(4);
              }} className="inline-flex h-11 items-center gap-1 rounded-xl bg-[#9C1E1E] px-5 text-sm font-bold text-white disabled:opacity-50">Continuar<ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        {passo === 4 && (
          <div className="space-y-4">
            {posicaoDaTV && !trocarPosicao ? (
              <div className="flex items-center gap-3 rounded-2xl border border-[#1E6B47]/20 bg-[#E3F4EA] p-3">
                <Check className="h-5 w-5 shrink-0 text-[#1E6B47]" />
                <div className="min-w-0 flex-1">
                  <b className="block text-[14px] text-[#1E6B47]">{orientacao === 'vertical' ? 'TV em pé (vertical)' : 'TV deitada (horizontal)'}</b>
                  <span className="block text-[12px] text-[#2F5D46]">Posição já escolhida na própria TV{orientacao === 'vertical' ? (giro === 270 ? ' · girada para a direita' : ' · girada para a esquerda') : ''}</span>
                </div>
                <button type="button" onClick={() => setTrocarPosicao(true)} className="shrink-0 rounded-lg px-2 py-1 text-[12.5px] font-bold text-[#1E6B47] underline">Alterar</button>
              </div>
            ) : (
              <EscolherOrientacao orientacao={orientacao} giro={giro} onOrientacao={setOrientacao} onGiro={setGiro} predio={ehPredio} />
            )}
            <GradeLayouts valor={layout} onEscolher={setLayout} vertical={orientacao === 'vertical'} predio={ehPredio} />
            {layout !== 'R' && <Ritmo casa={casaCada} ed={edCada} onCasa={setCasaCada} onEd={setEdCada} mostrarEd={layout === 'H6'} />}
            {ehPredio && orientacao === 'horizontal' && <p className="rounded-2xl bg-[#FFF9EE] p-3 text-[12.5px] text-[#5A3A00]">Prédio: os <b>avisos do síndico</b> entram intercalados no <b>H6</b> e na coluna vertical do <b>H2</b> e do <b>H5</b>.</p>}
            <div className="sticky bottom-0 z-10 -mx-6 -mb-2 flex border-t border-black/[0.06] bg-white/95 px-6 py-3 backdrop-blur justify-between">
              <button type="button" onClick={() => setPasso(3)} className="inline-flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold hover:bg-black/5"><ChevronLeft className="h-4 w-4" />Voltar</button>
              <button type="button" disabled={salvando} onClick={salvar} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#9C1E1E] px-5 text-sm font-bold text-white disabled:opacity-50"><Check className="h-4 w-4" />{salvando ? 'Conectando…' : 'Conectar tela'}</button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Ritmo({ casa, ed, onCasa, onEd, mostrarEd }: { casa: number; ed: number; onCasa: (n: number) => void; onEd: (n: number) => void; mostrarEd: boolean }) {
  const Num = ({ v, on }: { v: number; on: (n: number) => void }) => (
    <div className="inline-flex items-center rounded-xl bg-black/[0.05] p-1">
      <button type="button" onClick={() => on(Math.max(1, v - 1))} className="h-8 w-8 rounded-lg text-lg font-bold hover:bg-white">−</button>
      <span className="w-8 text-center text-[15px] font-extrabold">{v}</span>
      <button type="button" onClick={() => on(Math.min(10, v + 1))} className="h-8 w-8 rounded-lg text-lg font-bold hover:bg-white">+</button>
    </div>
  );
  return (
    <div className="space-y-2 rounded-2xl bg-black/[0.035] p-3 text-[14px]">
      <div className="flex flex-wrap items-center justify-between gap-2"><span>1 vídeo <b>da casa</b> a cada</span><span className="flex items-center gap-2"><Num v={casa} on={onCasa} /> anúncios</span></div>
      {mostrarEd && <div className="flex flex-wrap items-center justify-between gap-2"><span>1 <b>câmera ou notícia</b> a cada</span><span className="flex items-center gap-2"><Num v={ed} on={onEd} /> anúncios</span></div>}
      <p className="text-[12px] text-[#6A6B70]">O ritmo vale para todas as telas deste local.</p>
    </div>
  );
}

// ============================================================== trocar layout
export function EscolherLayout({ tela, predio, onFechar, onSalvo, onAtualizou, embutido = false }: { tela: Tela; predio: boolean; onFechar: () => void; onSalvo: () => void; onAtualizou: () => void; embutido?: boolean }) {
  const cfg = tela.config || {};
  const [ori, setOri] = useState<'horizontal' | 'vertical'>(cfg.orientacao === 'vertical' || ehLayoutVertical(tela.layout) ? 'vertical' : 'horizontal');
  const [giro, setGiro] = useState<number>([0, 90, 270].includes(Number(cfg.giro)) ? Number(cfg.giro) : 90);
  const [atual, setAtual] = useState(tela.layout);
  const [aplicando, setAplicando] = useState<string | null>(null);
  const mudarOrientacao = async (o: 'horizontal' | 'vertical', g: number) => {
    const layout = o === 'vertical' ? (predio ? 'R' : /^V\d$/.test(atual) ? atual : 'V2') : (ehLayoutVertical(atual) ? 'H6' : atual);
    const { error } = await db.from('exa_telas').update({ config: { ...cfg, orientacao: o, giro: g }, layout }).eq('id', tela.id);
    if (error) { toast.error(error.message); return; }
    setOri(o); setGiro(g); setAtual(layout);
    toast.success(o === 'vertical' ? 'TV em pé' : 'TV deitada', { description: 'A TV muda em até 1 minuto.' });
    onAtualizou();
  };
  const escolher = async (id: string) => {
    if (id === atual) { if (!embutido) onFechar(); return; }
    setAplicando(id);
    const { error } = await db.from('exa_telas').update({ layout: id }).eq('id', tela.id);
    if (error) { toast.error(error.message); setAplicando(null); return; }
    toast.success(`Layout ${id} aplicado`, { description: 'A TV troca em até 1 minuto.' });
    setAtual(id); setAplicando(null);
    onSalvo();
  };
  return (
    <Moldura embutido={embutido} onFechar={onFechar} className="max-h-[92vh] overflow-y-auto sm:max-w-[720px]">
        <MCab><MTit>{embutido ? 'Orientação e layout' : `Layout · ${tela.nome || 'tela'}`}</MTit><MDesc>Deitada ou em pé, e o layout. Toque para aplicar: a TV troca em até 1 minuto.</MDesc></MCab>
        <div className="space-y-4">
          <EscolherOrientacao orientacao={ori} giro={giro} predio={predio} onOrientacao={(o) => mudarOrientacao(o, giro)} onGiro={(g) => mudarOrientacao(ori, g)} />
          <GradeLayouts valor={aplicando || atual} atual={atual} aplicando={aplicando} onEscolher={escolher} vertical={ori === 'vertical'} predio={predio} />
          {predio && ori === 'horizontal' && <p className="rounded-2xl bg-[#FFF9EE] p-3 text-[12.5px] text-[#5A3A00]">Prédio: os <b>avisos do síndico</b> entram intercalados no <b>H6</b> e na coluna vertical do <b>H2</b> e do <b>H5</b>.</p>}
        </div>
    </Moldura>
  );
}

// ============================================================== nome, local, vídeos da casa e ritmo
export function ConfigTela({ tela, locais, onFechar, onSalvo, embutido = false }: { tela: Tela; locais: Local[]; onFechar: () => void; onSalvo: () => void; embutido?: boolean }) {
  const [nome, setNome] = useState(tela.nome || '');
  const [localId, setLocalId] = useState(tela.building_id || '');
  const [ambiente, setAmbiente] = useState(tela.ambiente || 'comercio');
  const local = locais.find((l) => l.id === localId);
  const [casaPedido, setCasaPedido] = useState(local?.pedido_casa_id || '');
  const [casa, setCasa] = useState(Number(local?.telas_ritmo?.casa_a_cada) || 3);
  const [ed, setEd] = useState(Number(local?.telas_ritmo?.editorial_a_cada) || 2);
  const [camera, setCamera] = useState(local?.telas_ritmo?.camera !== false);
  const [noticias, setNoticias] = useState(local?.telas_ritmo?.noticias !== false && local?.telas_ritmo?.noticias_foz !== false);
  const [brasil, setBrasil] = useState(local?.telas_ritmo?.noticias !== false && local?.telas_ritmo?.noticias_brasil !== false);
  const [salvando, setSalvando] = useState(false);
  const [limite, setLimite] = useState<number | null>(null);
  useEffect(() => {
    setCasaPedido(local?.pedido_casa_id || '');
    setCasa(Number(local?.telas_ritmo?.casa_a_cada) || 3); setEd(Number(local?.telas_ritmo?.editorial_a_cada) || 2);
    setCamera(local?.telas_ritmo?.camera !== false); setNoticias(local?.telas_ritmo?.noticias !== false && local?.telas_ritmo?.noticias_foz !== false); setBrasil(local?.telas_ritmo?.noticias !== false && local?.telas_ritmo?.noticias_brasil !== false);
  }, [localId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pedidos = useQuery({
    queryKey: ['exa-telas-pedidos', localId],
    enabled: !!localId,
    queryFn: async () => {
      const { data } = await db.from('pedidos').select('id, nome_pedido, client_id, status, lista_predios, created_at, telas_comercio').order('created_at', { ascending: false }).limit(300);
      const ps = (data || []) as any[];
      const ids = [...new Set(ps.map((p) => p.client_id).filter(Boolean))];
      const { data: us } = ids.length ? await db.from('users').select('id, nome, empresa_nome').in('id', ids) : { data: [] };
      const nome = new Map((us || []).map((u: any) => [u.id, u.empresa_nome || u.nome || '']));
      return ps.map((p) => ({ ...p, cliente: nome.get(p.client_id) || p.nome_pedido || p.id.slice(0, 8), noLocal: (p.lista_predios || []).includes(localId) }))
        .sort((a, b) => Number(b.noLocal) - Number(a.noLocal));
    },
  });

  const salvar = async () => {
    setSalvando(true);
    try {
      const { error } = await db.from('exa_telas').update({ nome: nome.trim() || null, building_id: localId || null, ambiente }).eq('id', tela.id);
      if (error) throw error;
      if (casaPedido && limite !== null) {
        const { error: e3 } = await db.from('pedidos').update({ telas_comercio: Math.max(0, Math.min(50, limite)) }).eq('id', casaPedido);
        if (e3) throw e3;
      }
      if (localId) {
        const { error: e2 } = await db.from('buildings').update({
          pedido_casa_id: casaPedido || null,
          telas_ritmo: { ...(local?.telas_ritmo || {}), casa_a_cada: casa, editorial_a_cada: ed, camera, noticias: noticias || brasil, noticias_foz: noticias, noticias_brasil: brasil },
        }).eq('id', localId);
        if (e2) throw e2;
      }
      toast.success('Salvo', { description: 'A TV pega as mudanças em até 1 minuto.' });
      onSalvo();
    } catch (e) { toast.error((e as Error).message); } finally { setSalvando(false); }
  };

  return (
    <Moldura embutido={embutido} onFechar={onFechar} className="max-h-[92vh] overflow-y-auto sm:max-w-[620px]">
        <MCab><MTit>{embutido ? 'Nome, local, vídeos da casa e ritmo' : 'Configurar tela'}</MTit><MDesc>Nome, local, vídeos do próprio comerciante e o ritmo da programação.</MDesc></MCab>
        <div className="space-y-4 text-[14px]">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1"><span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6A6B70]">Nome da tela</span>
              <input value={nome} onChange={(e) => setNome(e.target.value)} className="h-11 w-full rounded-xl border border-black/15 px-3" /></label>
            <label className="space-y-1"><span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6A6B70]">Ambiente</span>
              <select value={ambiente} onChange={(e) => setAmbiente(e.target.value)} className="h-11 w-full rounded-xl border border-black/15 bg-white px-3"><option value="comercio">Comércio</option><option value="hall">Hall / portaria</option></select></label>
          </div>
          <label className="block space-y-1"><span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6A6B70]">Local</span>
            <select value={localId} onChange={(e) => setLocalId(e.target.value)} className="h-11 w-full rounded-xl border border-black/15 bg-white px-3">
              <option value="">— sem local —</option>
              {[...locais].sort((a, b) => Number(b.tipo_local === 'comercio') - Number(a.tipo_local === 'comercio') || a.nome.localeCompare(b.nome)).map((l) => (
                <option key={l.id} value={l.id}>{l.nome} · {l.tipo_local === 'comercio' ? l.segmento_local || 'Comércio' : 'Prédio'}</option>
              ))}
            </select>
          </label>
          {localId && (
            <>
              <label className="block space-y-1">
                <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#6A6B70]"><Store className="h-3.5 w-3.5" />Vídeos da casa (pedido do comerciante)</span>
                <select value={casaPedido} onChange={(e) => setCasaPedido(e.target.value)} className="h-11 w-full rounded-xl border border-black/15 bg-white px-3">
                  <option value="">— nenhum —</option>
                  {(pedidos.data || []).map((p: any) => <option key={p.id} value={p.id}>{p.noLocal ? '● ' : ''}{p.cliente} · {p.status} · #{p.id.slice(0, 8)}</option>)}
                </select>
                <span className="block text-[12px] text-[#6A6B70]">O comerciante cria e troca os vídeos dele na área do cliente, como qualquer anunciante. Todos os vídeos aprovados desse pedido entram no rodízio "da casa" desta tela. ● = pedido que já inclui este local.</span>
              </label>
              {casaPedido && (
                <label className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-black/[0.035] p-3">
                  <span className="min-w-0">
                    <span className="block font-semibold">Telas que o cliente conecta sozinho</span>
                    <span className="block text-[12px] text-[#6A6B70]">Ele vê "Minhas telas" na área do cliente e conecta pelo código até esse número. 0 = só a EXA conecta.</span>
                  </span>
                  <input type="number" min={0} max={50}
                    value={limite ?? ((pedidos.data || []).find((p: any) => p.id === casaPedido)?.telas_comercio ?? 0)}
                    onChange={(e) => setLimite(Number(e.target.value) || 0)}
                    className="h-11 w-20 rounded-xl border border-black/15 px-3 text-center font-bold" />
                </label>
              )}
              <Ritmo casa={casa} ed={ed} onCasa={setCasa} onEd={setEd} mostrarEd />
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={camera} onChange={(e) => setCamera(e.target.checked)} className="h-4 w-4 accent-[#9C1E1E]" />Câmera ao vivo da ponte</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={noticias} onChange={(e) => setNoticias(e.target.checked)} className="h-4 w-4 accent-[#9C1E1E]" />Notícias de Foz</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={brasil} onChange={(e) => setBrasil(e.target.checked)} className="h-4 w-4 accent-[#9C1E1E]" />Notícias do Brasil</label>
              </div>
            </>
          )}
          <div className={embutido ? 'flex justify-end pt-1' : 'sticky bottom-0 z-10 -mx-6 -mb-2 flex border-t border-black/[0.06] bg-white/95 px-6 py-3 backdrop-blur justify-end'}><button type="button" disabled={salvando} onClick={salvar} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#9C1E1E] px-5 text-sm font-bold text-white disabled:opacity-50"><Pencil className="h-4 w-4" />Salvar</button></div>
        </div>
    </Moldura>
  );
}


// ============================================================== página de uma tela (tudo o que dá para fazer com ela)
export function TelaDetalhe() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const voltar = useLocation().pathname.replace(/\/[^/]+\/?$/, '');
  const tela = useQuery({
    queryKey: ['exa-tela', id],
    queryFn: async () => {
      const { data, error } = await db.from('exa_telas').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as Tela | null;
    },
    refetchInterval: 10000,
  });
  const locais = useQuery({
    queryKey: ['exa-telas-locais'],
    queryFn: async () => {
      const { data, error } = await db.from('buildings').select('id, nome, bairro, endereco, status, tipo_local, segmento_local, pedido_casa_id, telas_ritmo').order('nome');
      if (error) throw error;
      return (data || []) as Local[];
    },
  });
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  const exib = useQuery({
    queryKey: ['exa-tela-exib', id, hoje],
    queryFn: async () => {
      const { data } = await db.from('exa_telas_exibicoes').select('tipo, vezes').eq('tela_id', id).eq('dia', hoje);
      return (data || []).reduce((a: number, r: any) => a + (r.tipo === 'anuncio' || r.tipo === 'casa' ? r.vezes : 0), 0);
    },
    refetchInterval: 60000,
  });
  const atualizar = () => { qc.invalidateQueries({ queryKey: ['exa-tela', id] }); qc.invalidateQueries({ queryKey: ['exa-telas'] }); };
  const t = tela.data;
  if (tela.isLoading) return <div className="p-8 text-sm text-[#6A6B70]">Carregando a tela…</div>;
  if (!t) return <div className="space-y-3 p-8"><p className="text-sm">Tela não encontrada.</p><Link to={voltar} className="text-sm font-bold text-[#9C1E1E]">← Voltar para Telas</Link></div>;

  const st = estadoDe(t);
  const local = (locais.data || []).find((l) => l.id === t.building_id) || null;
  const predio = local?.tipo_local !== 'comercio';
  const android = String(t.plataforma || '').startsWith('android');
  const comando = async (c: string, msg: string) => {
    const { error } = await db.from('exa_telas').update({ comando: c, comando_em: new Date().toISOString() }).eq('id', t.id);
    if (error) toast.error(error.message); else { toast.success(msg, { description: 'A tela recebe em até 1 minuto.' }); atualizar(); }
  };
  const desparear = async () => {
    if (!confirm(`Desconectar "${t.nome || 'tela'}"? Ela volta a mostrar um código novo.`)) return;
    const { error } = await db.from('exa_telas').update({ status: 'aguardando', building_id: null, codigo: null, codigo_expira: null }).eq('id', t.id);
    if (error) toast.error(error.message); else { toast.success('Tela desconectada'); atualizar(); }
  };
  const excluir = async () => {
    if (!confirm(`Excluir "${t.nome || t.codigo || 'tela'}" de vez? Se o aparelho estiver ligado, ele mostra um código novo.`)) return;
    const { error } = await db.from('exa_telas').delete().eq('id', t.id);
    if (error) toast.error(error.message); else { toast.success('Tela excluída'); navigate(voltar); }
  };
  const acoes: { r: string; d: string; i: React.ReactNode; f: () => void; so?: boolean }[] = [
    { r: 'Recarregar a tela', d: 'Abre a programação de novo', i: <RotateCcw className="h-5 w-5" />, f: () => comando('recarregar', 'Recarregando a tela') },
    { r: 'Baixar os vídeos de novo', d: 'Apaga os guardados e baixa tudo', i: <Eraser className="h-5 w-5" />, f: () => comando('limpar_cache', 'Limpando os vídeos guardados') },
    { r: 'Reiniciar o app', d: 'Fecha e abre o app EXA na TV', i: <Power className="h-5 w-5" />, f: () => comando('reiniciar_app', 'Reiniciando o app'), so: true },
    { r: 'Atualizar o app', d: 'Abre o download da versão nova', i: <Download className="h-5 w-5" />, f: () => comando('atualizar_app', 'Abrindo o download do app novo na TV'), so: true },
    { r: 'Escolher a posição da TV', d: 'A TV pergunta: deitada ou em pé', i: <Compass className="h-5 w-5" />, f: () => comando('orientacao', 'A TV vai perguntar como está instalada'), so: true },
    { r: 'Configurações do aparelho', d: 'Abre as configurações do Android', i: <Wrench className="h-5 w-5" />, f: () => comando('abrir_configuracoes', 'Abrindo as configurações do aparelho'), so: true },
    { r: 'Fechar o app na TV', d: 'Para de mostrar até abrirem de novo', i: <Unlink className="h-5 w-5" />, f: () => { if (confirm('Fechar o app na TV? Ela deixa de mostrar a programação até alguém abrir o app de novo.')) comando('sair_app', 'Fechando o app na TV'); }, so: true },
  ].filter((a) => !a.so || android);
  const fl = (t as any).saude?.fluidez || {};

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 text-[#17181A]" style={{ fontFeatureSettings: '"tnum"' }}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link to={voltar} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#6A6B70] hover:text-[#17181A]"><ArrowLeft className="h-4 w-4" />Telas</Link>
          <h1 className="truncate text-[26px] font-extrabold leading-tight tracking-[-0.03em] md:text-[30px]">{t.nome || (t.status === 'ativa' ? 'Tela' : `Código ${t.codigo || '…'}`)}</h1>
          <div className="text-[13px] text-[#5E5F63]">{local ? `${local.nome}${local.segmento_local ? ` · ${local.segmento_local}` : ''}` : 'Sem local'} · {t.ambiente === 'hall' ? 'Hall' : 'Comércio'} · {nomePlataforma(t.plataforma)}{t.info?.app ? ` ${t.info.app}` : ''}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${SELO[st].cls}`}>{SELO[st].txt}</span>
          <button type="button" onClick={atualizar} className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${vidro}`}><RefreshCw className={`h-4 w-4 ${tela.isFetching ? 'animate-spin' : ''}`} />Atualizar</button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { r: 'Tocando agora', v: t.tocando?.cliente || t.tocando?.titulo || '—' },
          { r: 'Exibições hoje', v: String(exib.data ?? 0) },
          { r: 'Último sinal', v: quando(t.ultimo_sinal) },
          { r: 'Fluidez', v: fl.fps != null ? `${fl.fps} q/s · ${fl.video_pct_perdidos ?? 0}% perdidos` : '—' },
        ].map((k) => (
          <div key={k.r} className={`min-w-0 rounded-2xl p-4 ${vidro}`}>
            <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6A6B70]">{k.r}</div>
            <div className="mt-1 truncate text-[17px] font-extrabold">{k.v}</div>
          </div>
        ))}
      </div>
      {t.comando && <div className="rounded-2xl bg-[#FFF6E5] px-4 py-3 text-[13px] font-semibold text-[#8A5A00]">Comando pendente: {t.comando} — a TV recebe no próximo batimento (até 1 min). Um comando novo substitui o pendente.</div>}
      {st === 'aguardando' && <div className="rounded-2xl bg-[#FFF1D6] px-4 py-3 text-[13px] font-semibold text-[#8A5A00]">Esta TV está mostrando o código {t.codigo || '…'}. Conecte pela lista de telas (Adicionar tela).</div>}

      <section className={`rounded-3xl p-5 ${vidro}`}>
        <h2 className="mb-3 text-[18px] font-extrabold tracking-[-0.02em]">Comandos para a TV</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {acoes.map((a) => (
            <button key={a.r} type="button" onClick={a.f} className="flex items-start gap-3 rounded-2xl bg-black/[0.035] p-3 text-left hover:bg-black/[0.07]">
              <span className="mt-0.5 text-[#9C1E1E]">{a.i}</span>
              <span className="min-w-0"><span className="block text-[14px] font-bold">{a.r}</span><span className="block text-[12px] text-[#6A6B70]">{a.d}</span></span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="min-w-0 space-y-5">
          <EscolherLayout tela={t} predio={predio} embutido onFechar={() => {}} onSalvo={atualizar} onAtualizou={atualizar} />
          <EscolherCameras titulo={t.nome || 'tela'} atual={t.config?.cameras} embutido onFechar={() => {}}
            onSalvar={async (c) => {
              const { error } = await db.from('exa_telas').update({ config: { ...(t.config || {}), cameras: c } }).eq('id', t.id);
              if (error) throw error;
              atualizar();
            }} />
          <ConfigTela tela={t} locais={locais.data || []} embutido onFechar={() => {}} onSalvo={atualizar} />
        </div>
        <div className="min-w-0 space-y-5">
          <SaudeTela tela={t as any} embutido onFechar={() => {}} onAtualizou={atualizar} />
          {!!t.erros?.length && (
            <section className={`rounded-3xl p-5 ${vidro}`}>
              <h2 className="mb-2 text-[18px] font-extrabold tracking-[-0.02em]">Avisos recentes da TV</h2>
              <ul className="space-y-1 text-[12.5px] text-[#7A5200]">{t.erros.slice(-10).reverse().map((e, i) => <li key={i} className="break-words">{e}</li>)}</ul>
            </section>
          )}
          <section className="rounded-3xl border border-[#F1C9C6] bg-[#FFF7F6] p-5">
            <h2 className="mb-1 text-[18px] font-extrabold tracking-[-0.02em] text-[#9C1E1E]">Desconectar ou excluir</h2>
            <p className="mb-3 text-[13px] text-[#6A4A48]">Desconectar faz a TV mostrar um código novo (para ligar em outro local). Excluir apaga a tela do sistema.</p>
            <div className="flex flex-wrap gap-2">
              {t.status === 'ativa' && <button type="button" onClick={desparear} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#9C1E1E]/30 bg-white px-4 text-sm font-bold text-[#9C1E1E]"><Unlink className="h-4 w-4" />Desconectar (novo código)</button>}
              <button type="button" onClick={excluir} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#9C1E1E] px-4 text-sm font-bold text-white"><Trash2 className="h-4 w-4" />Excluir</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
