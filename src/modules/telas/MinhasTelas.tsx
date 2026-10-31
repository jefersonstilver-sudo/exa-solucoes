/**
 * Área do cliente · Minhas telas — o restaurante (dono do pedido "da casa" de um local comércio) conecta as
 * próprias TVs pelo código que aparece na tela, até o limite do pedido, escolhe o layout, liga/desliga câmera
 * e notícias e acompanha o monitor (ao vivo, sem sinal, tocando, exibições, quedas). Tudo pela função exa-tela.
 */
import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import {
  Plus, MonitorPlay, Smartphone, Laptop, Globe, Copy, ChevronLeft, ChevronRight, Check, MoreHorizontal, RotateCcw, Eraser,
  Unlink, Pencil, Video, Newspaper, Bell, MessageCircle,
} from 'lucide-react';
import { chamar, useMinhasTelas, type LocalCliente, type TelaCliente } from './useMinhasTelas';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { GradeLayouts, MiniLayout, infoLayout } from './catalogo';
import { SOFIA_WA } from '@/site/comum';

const SOFIA = `https://wa.me/${SOFIA_WA}?text=${encodeURIComponent('Quero conectar mais telas no meu estabelecimento')}`;
const LINK_APK = 'https://examidia.com.br/baixar-tela';
const LINK_WIN = 'https://github.com/jefersonstilver-sudo/exa-solucoes/releases/download/tela-windows/instalar-exa-tela.exe';
const LINK_WEB = 'https://examidia.com.br/tela';
const cartao = 'rounded-3xl bg-white border border-black/[0.06] shadow-[0_14px_30px_-24px_rgba(70,20,20,0.35)]';

const minutos = (iso?: string | null) => (iso ? (Date.now() - new Date(iso).getTime()) / 60000 : Infinity);
const hora = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—');
const quando = (iso?: string | null) => {
  const m = minutos(iso);
  if (!Number.isFinite(m)) return 'nunca';
  if (m < 1.5) return 'agora';
  if (m < 60) return `há ${Math.round(m)} min`;
  if (m < 48 * 60) return `há ${Math.round(m / 60)} h`;
  return new Date(iso!).toLocaleDateString('pt-BR');
};
const aoVivo = (t: TelaCliente) => minutos(t.ultimo_sinal) <= 3;
const aparelho = (t: TelaCliente) => {
  const p = String(t.plataforma || '');
  const n = p.startsWith('android') ? 'Android' : p.startsWith('windows') ? 'Windows' : p.startsWith('linux') ? 'Linux' : 'Navegador';
  return `${n}${t.info?.tela ? ` · ${String(t.info.tela).split('@')[0]}` : ''}`;
};

function useQr(v: string) {
  const [img, setImg] = useState('');
  useEffect(() => { QRCode.toDataURL(v, { margin: 1, width: 220 }).then(setImg).catch(() => {}); }, [v]);
  return img;
}

export default function MinhasTelas() {
  const qc = useQueryClient();
  const q = useMinhasTelas();
  const [conectarEm, setConectarEm] = useState<LocalCliente | null>(null);
  const [layoutDe, setLayoutDe] = useState<TelaCliente | null>(null);
  const [configDe, setConfigDe] = useState<TelaCliente | null>(null);
  const recarregar = () => qc.invalidateQueries({ queryKey: ['minhas-telas'] });

  const acao = async (corpo: Record<string, unknown>, ok: string) => {
    try { await chamar(corpo); toast.success(ok); recarregar(); } catch (e) { toast.error((e as Error).message); }
  };

  const locais = q.data?.locais || [];
  const telas = q.data?.telas || [];

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-1 pb-24 text-[#1b1719] md:px-0" style={{ fontFeatureSettings: '"tnum"' }}>
      <header>
        <div className="text-[13px] font-semibold text-[#8b8285]">Suas TVs com a programação EXA</div>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em]">Minhas telas</h1>
      </header>

      {q.isLoading && <div className={`${cartao} h-40 animate-pulse`} />}
      {q.error && <div className="rounded-2xl bg-[#fdf1f2] p-4 text-sm text-[#9C1E1E]">Não consegui carregar suas telas: {(q.error as Error).message}</div>}

      {!q.isLoading && !q.error && !locais.length && (
        <div className={`${cartao} p-6 text-center`}>
          <MonitorPlay className="mx-auto h-10 w-10 text-[#9C1E1E]" />
          <h2 className="mt-3 text-lg font-extrabold">Telas no seu estabelecimento</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#5E5F63]">Restaurantes, clínicas e lojas parceiras podem ter TVs com a programação EXA e os próprios vídeos intercalados. Fale com a Sofia para incluir no seu plano.</p>
          <a href={SOFIA} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white"><MessageCircle className="h-4 w-4" />Falar com a Sofia</a>
        </div>
      )}

      {locais.map((l) => {
        const minhas = telas.filter((t) => t.building_id === l.id && t.status === 'ativa');
        const cheio = minhas.length >= l.limite;
        const vivas = minhas.filter(aoVivo).length;
        return (
          <section key={l.id} className="space-y-3">
            <div className={`${cartao} flex flex-wrap items-center justify-between gap-3 p-4`}>
              <div className="min-w-0">
                <div className="truncate text-[17px] font-extrabold">{l.nome}</div>
                <div className="text-[13px] text-[#8b8285]">{[l.segmento, l.bairro].filter(Boolean).join(' · ')}</div>
                <div className="mt-1 text-[13px] font-semibold">
                  {minhas.length} de {l.limite} {l.limite === 1 ? 'tela' : 'telas'} do seu plano · <span className="text-[#1E6B47]">{vivas} ao vivo</span>
                  {minhas.length - vivas > 0 && <span className="text-[#9C1E1E]"> · {minhas.length - vivas} sem sinal</span>}
                </div>
              </div>
              {cheio ? (
                <a href={SOFIA} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-black/10 px-4 text-sm font-bold">
                  <Plus className="h-4 w-4" />Quero mais telas
                </a>
              ) : (
                <button type="button" onClick={() => setConectarEm(l)} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#9C1E1E] px-4 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(156,30,30,0.8)]">
                  <Plus className="h-4 w-4" />Conectar tela
                </button>
              )}
            </div>

            {!minhas.length && (
              <div className="rounded-2xl border border-dashed border-black/15 p-5 text-center text-[14px] text-[#5E5F63]">
                Nenhuma tela conectada ainda. Toque em <b>Conectar tela</b> e siga os passos: leva uns 5 minutos.
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {minhas.map((t) => {
                const vivo = aoVivo(t);
                const lay = infoLayout(t.layout);
                const s = t.saude || {};
                return (
                  <article key={t.id} className={`${cartao} flex min-w-0 flex-col gap-3 p-4`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[16px] font-extrabold">{t.nome || 'Tela'}</div>
                        <div className="text-[12.5px] text-[#8b8285]">{aparelho(t)}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${vivo ? 'bg-[#E3F4EA] text-[#1E6B47]' : 'bg-[#FBE4E2] text-[#9C1E1E]'}`}>
                          {vivo ? 'Ao vivo' : `Sem sinal desde ${hora(t.offline_desde || t.ultimo_sinal)}`}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" aria-label="Opções da tela" className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5"><MoreHorizontal className="h-4 w-4" /></button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-60">
                            <DropdownMenuItem onClick={() => setConfigDe(t)}><Pencil className="mr-2 h-4 w-4" />Nome e avisos no WhatsApp</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLayoutDe(t)}><MonitorPlay className="mr-2 h-4 w-4" />Trocar layout</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => acao({ acao: 'cliente_comando', tela_id: t.id, comando: 'recarregar' }, 'A tela recarrega em até 1 minuto')}><RotateCcw className="mr-2 h-4 w-4" />Recarregar a tela</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => acao({ acao: 'cliente_comando', tela_id: t.id, comando: 'limpar_cache' }, 'A tela vai baixar os vídeos de novo')}><Eraser className="mr-2 h-4 w-4" />Baixar os vídeos de novo</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-[#9C1E1E]" onClick={() => { if (confirm(`Desconectar "${t.nome || 'tela'}"? Ela volta a mostrar um código e libera a vaga no seu plano.`)) acao({ acao: 'cliente_desconectar', tela_id: t.id }, 'Tela desconectada'); }}>
                              <Unlink className="mr-2 h-4 w-4" />Desconectar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <button type="button" onClick={() => setLayoutDe(t)} className="flex min-w-0 items-center gap-3 rounded-2xl bg-[#f7f5f6] p-2 text-left active:bg-black/[0.05]">
                      <MiniLayout id={t.layout} largura={104} className="shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#8b8285]">Layout {lay.id}</div>
                        <div className="truncate text-[15px] font-bold">{lay.nome}</div>
                        <div className="text-[12px] font-semibold text-[#9C1E1E]">Trocar</div>
                      </div>
                    </button>

                    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[13px]">
                      <dt className="text-[#8b8285]">Tocando agora</dt><dd className="truncate font-semibold">{vivo ? t.tocando?.cliente || t.tocando?.titulo || '—' : '—'}</dd>
                      <dt className="text-[#8b8285]">Exibições hoje</dt><dd className="font-semibold">{t.exibicoes_hoje}</dd>
                      <dt className="text-[#8b8285]">Último sinal</dt><dd className="font-semibold">{quando(t.ultimo_sinal)}</dd>
                      <dt className="text-[#8b8285]">Quedas (7 dias)</dt><dd className="font-semibold">{t.quedas_7d}</dd>
                      <dt className="text-[#8b8285]">Internet</dt><dd className="truncate font-semibold">{s.conexao ? `${s.conexao}${s.mbps ? ` · ${s.mbps} Mb/s` : ''}${s.rtt ? ` · ${s.rtt} ms` : ''}` : s.online === false ? 'sem internet' : '—'}</dd>
                      <dt className="text-[#8b8285]">Vídeos na TV</dt><dd className="truncate font-semibold">{s.videos_no_aparelho != null ? `${s.videos_no_aparelho} baixados${s.baixando ? ' · baixando…' : ''}` : '—'}</dd>
                    </dl>

                    <div className="flex flex-wrap gap-4 rounded-2xl bg-[#f7f5f6] px-3 py-2.5 text-[13.5px]">
                      <label className="inline-flex items-center gap-2"><Switch checked={t.config?.ritmo?.camera !== false} onCheckedChange={(v) => acao({ acao: 'cliente_atualizar', tela_id: t.id, camera: v }, v ? 'Câmera ligada' : 'Câmera desligada')} /><Video className="h-4 w-4 text-[#8b8285]" />Câmera ao vivo</label>
                      <label className="inline-flex items-center gap-2"><Switch checked={t.config?.ritmo?.noticias !== false} onCheckedChange={(v) => acao({ acao: 'cliente_atualizar', tela_id: t.id, noticias: v }, v ? 'Notícias ligadas' : 'Notícias desligadas')} /><Newspaper className="h-4 w-4 text-[#8b8285]" />Notícias</label>
                    </div>

                    {!!t.erros?.length && (
                      <details className="rounded-xl bg-[#FFF6E5] px-3 py-2 text-[12px] text-[#7A5200]">
                        <summary className="cursor-pointer font-bold">{t.erros.length} aviso(s) do aparelho</summary>
                        <ul className="mt-1 space-y-0.5">{t.erros.slice(-5).map((e, i) => <li key={i} className="break-words">{e}</li>)}</ul>
                      </details>
                    )}
                    {t.comando && <div className="text-[12px] font-semibold text-[#8A5A00]">Aguardando a TV: {t.comando === 'recarregar' ? 'recarregar' : 'baixar os vídeos'}</div>}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {!!locais.length && (
        <p className="text-[12.5px] leading-relaxed text-[#8b8285]">
          Os vídeos do seu estabelecimento entram entre os anúncios da rede EXA. Para trocar os seus vídeos, use <b>Pedidos</b>. Quando uma tela ficar 10 minutos sem sinal no horário de avisos, você recebe uma mensagem no WhatsApp.
        </p>
      )}

      {conectarEm && <Conectar local={conectarEm} onFechar={() => setConectarEm(null)} onPronto={() => { setConectarEm(null); recarregar(); }} />}
      {layoutDe && <TrocarLayout tela={layoutDe} onFechar={() => setLayoutDe(null)} onSalvo={() => { setLayoutDe(null); recarregar(); }} />}
      {configDe && <ConfigTela tela={configDe} onFechar={() => setConfigDe(null)} onSalvo={() => { setConfigDe(null); recarregar(); }} />}
    </div>
  );
}

// ------------------------------------------------------------------ conectar (instalar → código → layout)
function Conectar({ local, onFechar, onPronto }: { local: LocalCliente; onFechar: () => void; onPronto: () => void }) {
  const [passo, setPasso] = useState(1);
  const [plat, setPlat] = useState<'android' | 'windows' | 'navegador'>('android');
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [layout, setLayout] = useState('H6');
  const [salvando, setSalvando] = useState(false);
  const qr = useQr(LINK_APK);

  const conectar = async () => {
    setSalvando(true);
    try {
      await chamar({ acao: 'cliente_parear', building_id: local.id, codigo, nome, layout });
      toast.success('Tela conectada!', { description: 'Em alguns segundos a programação aparece na TV.' });
      onPronto();
    } catch (e) { toast.error((e as Error).message); setPasso(2); } finally { setSalvando(false); }
  };

  const Plat = ({ id, I, t }: { id: typeof plat; I: any; t: string }) => (
    <button type="button" onClick={() => setPlat(id)} className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-[13px] font-bold ${plat === id ? 'border-[#9C1E1E] bg-[#9C1E1E]/[0.06] text-[#9C1E1E]' : 'border-black/10'}`}><I className="h-5 w-5" />{t}</button>
  );
  const Link_ = ({ v }: { v: string }) => (
    <div className="flex items-center gap-2 rounded-xl bg-[#f7f5f6] px-3 py-2">
      <a href={v} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#9C1E1E] underline">{v}</a>
      <button type="button" aria-label="Copiar" onClick={() => navigator.clipboard.writeText(v).then(() => toast.success('Copiado'))} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-black/5"><Copy className="h-4 w-4" /></button>
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onFechar(); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Conectar tela · {passo} de 3</DialogTitle>
          <DialogDescription>{['Instale na TV', 'Digite o código que aparece na TV', 'Escolha como a tela fica'][passo - 1]}</DialogDescription>
        </DialogHeader>

        {passo === 1 && (
          <div className="space-y-4 text-[14px]">
            <div className="grid grid-cols-3 gap-2">
              <Plat id="android" I={Smartphone} t="TV Android" />
              <Plat id="windows" I={Laptop} t="Computador" />
              <Plat id="navegador" I={Globe} t="Navegador" />
            </div>
            {plat === 'android' && (
              <div className="flex flex-col gap-4 sm:flex-row">
                {qr && <img src={qr} alt="QR para baixar o app" className="h-36 w-36 shrink-0 self-center rounded-xl border border-black/10" />}
                <ol className="list-decimal space-y-1.5 pl-5">
                  <li>Na TV (ou TV box), abra o navegador e digite <b>examidia.com.br/baixar-tela</b>.</li>
                  <li>Instale o <b>exa-tela.apk</b>. Se pedir, permita "instalar apps desconhecidos".</li>
                  <li>Abra o <b>EXA Tela</b>. Se a TV perguntar o app inicial, escolha EXA Tela para abrir sozinho ao ligar.</li>
                  <li>Vai aparecer um código de 6 números.</li>
                </ol>
              </div>
            )}
            {plat === 'android' && <Link_ v={LINK_APK} />}
            {plat === 'windows' && (<><p>No computador ligado à TV, baixe e rode o instalador. O Windows avisa "editor desconhecido": clique em <b>Mais informações → Executar assim mesmo</b>. A tela abre sozinha em tela cheia, sempre que ligar.</p><Link_ v={LINK_WIN} /></>)}
            {plat === 'navegador' && (<><p>Para testar em qualquer TV ou computador: abra o endereço abaixo e toque uma vez para tela cheia. Para ficar fixo, use o app ou o instalador.</p><Link_ v={LINK_WEB} /></>)}
            <div className="flex justify-end"><button type="button" onClick={() => setPasso(2)} className="inline-flex h-11 items-center gap-1 rounded-xl bg-[#9C1E1E] px-5 text-sm font-bold text-white">Já aparece o código<ChevronRight className="h-4 w-4" /></button></div>
          </div>
        )}

        {passo === 2 && (
          <div className="space-y-4">
            <input autoFocus inputMode="numeric" maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => { if (e.key === 'Enter' && codigo.length === 6) setPasso(3); }} placeholder="000000"
              className="h-16 w-full rounded-2xl border border-black/15 text-center text-[36px] font-extrabold tracking-[0.4em] outline-none focus:border-[#9C1E1E]" />
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={`Nome da tela (ex.: ${local.nome} · Salão)`} className="h-11 w-full rounded-xl border border-black/15 px-3 text-[14px]" />
            <div className="flex justify-between">
              <button type="button" onClick={() => setPasso(1)} className="inline-flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold hover:bg-black/5"><ChevronLeft className="h-4 w-4" />Voltar</button>
              <button type="button" disabled={codigo.length !== 6} onClick={() => setPasso(3)} className="inline-flex h-11 items-center gap-1 rounded-xl bg-[#9C1E1E] px-5 text-sm font-bold text-white disabled:opacity-50">Continuar<ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        {passo === 3 && (
          <div className="space-y-4">
            <GradeLayouts valor={layout} onEscolher={setLayout} />
            <div className="flex justify-between">
              <button type="button" onClick={() => setPasso(2)} className="inline-flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold hover:bg-black/5"><ChevronLeft className="h-4 w-4" />Voltar</button>
              <button type="button" disabled={salvando} onClick={conectar} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#9C1E1E] px-5 text-sm font-bold text-white disabled:opacity-50"><Check className="h-4 w-4" />{salvando ? 'Conectando…' : 'Conectar'}</button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TrocarLayout({ tela, onFechar, onSalvo }: { tela: TelaCliente; onFechar: () => void; onSalvo: () => void }) {
  const [v, setV] = useState(tela.layout);
  const [s, setS] = useState(false);
  const salvar = async () => {
    setS(true);
    try { await chamar({ acao: 'cliente_atualizar', tela_id: tela.id, layout: v }); toast.success(`Layout ${v} aplicado`, { description: 'A TV troca em até 1 minuto.' }); onSalvo(); }
    catch (e) { toast.error((e as Error).message); } finally { setS(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onFechar(); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader><DialogTitle>Layout · {tela.nome || 'tela'}</DialogTitle><DialogDescription>Como a TV organiza os vídeos, a hora, o clima, as notícias e a câmera.</DialogDescription></DialogHeader>
        <GradeLayouts valor={v} onEscolher={setV} />
        <div className="flex justify-end"><button type="button" disabled={s || v === tela.layout} onClick={salvar} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#9C1E1E] px-5 text-sm font-bold text-white disabled:opacity-50"><Check className="h-4 w-4" />Aplicar</button></div>
      </DialogContent>
    </Dialog>
  );
}

function ConfigTela({ tela, onFechar, onSalvo }: { tela: TelaCliente; onFechar: () => void; onSalvo: () => void }) {
  const a = tela.config?.alertas || {};
  const [nome, setNome] = useState(tela.nome || '');
  const [avisar, setAvisar] = useState(a.ativo !== false);
  const [ini, setIni] = useState(a.inicio || '08:00');
  const [fim, setFim] = useState(a.fim || '22:00');
  const [s, setS] = useState(false);
  const salvar = async () => {
    setS(true);
    try { await chamar({ acao: 'cliente_atualizar', tela_id: tela.id, nome, alertas: { ativo: avisar, inicio: ini, fim } }); toast.success('Salvo'); onSalvo(); }
    catch (e) { toast.error((e as Error).message); } finally { setS(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onFechar(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader><DialogTitle>Configurar tela</DialogTitle><DialogDescription>Nome e avisos de queda no WhatsApp.</DialogDescription></DialogHeader>
        <div className="space-y-4 text-[14px]">
          <label className="block space-y-1"><span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8b8285]">Nome da tela</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="h-11 w-full rounded-xl border border-black/15 px-3" /></label>
          <div className="space-y-3 rounded-2xl bg-[#f7f5f6] p-3">
            <label className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 font-semibold"><Bell className="h-4 w-4" />Avisar no WhatsApp quando cair</span><Switch checked={avisar} onCheckedChange={setAvisar} /></label>
            {avisar && (
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#5E5F63]">Só entre</span>
                <input type="time" value={ini} onChange={(e) => setIni(e.target.value)} className="h-10 rounded-lg border border-black/15 px-2" />
                <span className="text-[13px] text-[#5E5F63]">e</span>
                <input type="time" value={fim} onChange={(e) => setFim(e.target.value)} className="h-10 rounded-lg border border-black/15 px-2" />
              </div>
            )}
            <p className="text-[12px] text-[#8b8285]">Use o horário em que o estabelecimento está aberto: TV desligada no fechamento não gera aviso.</p>
          </div>
          <div className="flex justify-end"><button type="button" disabled={s} onClick={salvar} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#9C1E1E] px-5 text-sm font-bold text-white disabled:opacity-50"><Check className="h-4 w-4" />Salvar</button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
