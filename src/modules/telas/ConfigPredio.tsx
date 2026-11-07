/**
 * 06/11/2026 — o PRÉDIO manda na configuração das suas telas (buildings.telas_config):
 *   cameras { ids, segundos } · avisos (bool) · layout_v (TV em pé) · layout_h (TV deitada)
 * Cada TV segue o prédio, a não ser no que foi personalizado nela (exa_telas.config.cameras / .avisos /
 * .layout_proprio / .ritmo). Orientação e giro são sempre da TV (como o aparelho está pendurado).
 * A função exa-tela faz a mesma conta (configEfetiva) na hora de mandar para a TV.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Building2, Video, Bell, LayoutGrid, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EscolherCameras, resumoCameras, type CamerasConfig } from './EscolherCameras';
import { GradeLayouts, infoLayout, ehLayoutVertical } from './catalogo';

const db = supabase as any;

export type ConfigPredioDados = { cameras?: CamerasConfig; avisos?: boolean; layout_v?: string; layout_h?: string };

/** O que a TV tem diferente do prédio (para o selo e o botão normalizar). */
export function diferencasDaTela(tela: { config?: any; layout?: string }, predio: ConfigPredioDados | null | undefined) {
  const c = tela.config || {};
  const p = predio || {};
  const out: { chave: string; texto: string }[] = [];
  if (c.cameras !== undefined) out.push({ chave: 'cameras', texto: `Câmeras: ${resumoCameras(c.cameras)} (no prédio: ${p.cameras ? resumoCameras(p.cameras) : 'todas'})` });
  if (c.avisos !== undefined) out.push({ chave: 'avisos', texto: `Avisos: ${c.avisos === false ? 'desligados' : 'ligados'} (no prédio: ${p.avisos === false ? 'desligados' : 'ligados'})` });
  if (c.layout_proprio) {
    const doPredio = (c.orientacao === 'vertical' || ehLayoutVertical(tela.layout)) ? p.layout_v : p.layout_h;
    out.push({ chave: 'layout', texto: `Layout: ${tela.layout} (no prédio: ${doPredio || 'não definido'})` });
  }
  if (c.ritmo && Object.keys(c.ritmo).length) out.push({ chave: 'ritmo', texto: 'Notícias e ritmo próprios' });
  if (c.auto?.max_cameras) out.push({ chave: 'auto', texto: `Ajuste automático (TV lenta: ${c.auto.motivo || 'fluidez baixa'}): no máximo ${c.auto.max_cameras} câmera(s) — volta sozinho quando ficar fluida` });
  return out;
}

/** Tira as exceções da TV (todas ou só uma): ela volta a seguir o prédio. Orientação e giro ficam. */
export async function normalizarTela(tela: { id: string; config?: any }, chave?: string) {
  const c = { ...(tela.config || {}) };
  const tirar = chave ? [chave === 'layout' ? 'layout_proprio' : chave] : ['cameras', 'avisos', 'layout_proprio', 'ritmo'];
  for (const k of tirar) delete c[k];
  const { error } = await db.from('exa_telas').update({ config: c }).eq('id', tela.id);
  if (error) throw error;
}

export function SeloConfigTela({ tela, predio, onMudou }: { tela: { id: string; config?: any; layout?: string }; predio: ConfigPredioDados | null | undefined; onMudou: () => void }) {
  const dif = diferencasDaTela(tela, predio);
  const normalizar = async (chave?: string) => {
    try { await normalizarTela(tela, chave); toast.success('A TV volta a seguir o prédio', { description: 'Muda em até 1 minuto.' }); onMudou(); }
    catch (e) { toast.error((e as Error).message); }
  };
  if (!dif.length) return <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#E3F4EA] px-2.5 py-1 text-[12px] font-bold text-[#1E6B47]"><Building2 className="h-3.5 w-3.5" />Segue o prédio</div>;
  return (
    <div className="rounded-2xl bg-[#FFF1D6] px-3 py-2 text-[12.5px] text-[#6B4500]">
      <div className="flex items-center justify-between gap-2">
        <b>Personalizada nesta TV</b>
        <button type="button" onClick={() => normalizar()} className="inline-flex items-center gap-1 font-bold text-[#9C1E1E]"><RotateCcw className="h-3.5 w-3.5" />Normalizar tudo</button>
      </div>
      <ul className="mt-1 space-y-0.5">
        {dif.map((d) => (
          <li key={d.chave} className="flex items-start justify-between gap-2">
            <span className="min-w-0">{d.texto}</span>
            <button type="button" onClick={() => normalizar(d.chave)} className="shrink-0 font-semibold text-[#9C1E1E] underline">seguir o prédio</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Cartão "Configuração do prédio": vale para todas as TVs dele (menos o que foi personalizado em cada uma). */
export function ConfigPredio({ predio, telas, onSalvo }: {
  predio: { id: string; nome: string; tipo_local: string | null; telas_config?: ConfigPredioDados | null };
  telas: { id: string; config?: any; layout?: string; nome?: string | null }[];
  onSalvo: () => void;
}) {
  const cfg: ConfigPredioDados = predio.telas_config || {};
  const [cams, setCams] = useState(false);
  const [layoutDe, setLayoutDe] = useState<'v' | 'h' | null>(null);
  const ehPredio = predio.tipo_local !== 'comercio';
  const salvar = async (novo: ConfigPredioDados) => {
    const { error } = await db.from('buildings').update({ telas_config: { ...cfg, ...novo } }).eq('id', predio.id);
    if (error) throw error;
    toast.success('Configuração do prédio salva', { description: `Vale para as ${telas.length} TV(s) que seguem o prédio. Muda em até 1 minuto.` });
    onSalvo();
  };
  const personalizadas = telas.filter((t) => diferencasDaTela(t, cfg).length).length;
  const Linha = ({ icone, rotulo, valor, acao, onClick }: { icone: React.ReactNode; rotulo: string; valor: string; acao: string; onClick: () => void }) => (
    <button type="button" onClick={onClick} className="flex min-w-0 items-center gap-3 rounded-2xl bg-black/[0.035] p-3 text-left hover:bg-black/[0.06]">
      <span className="text-[#9C1E1E]">{icone}</span>
      <span className="min-w-0 flex-1"><span className="block text-[12px] font-bold uppercase tracking-[0.06em] text-[#6A6B70]">{rotulo}</span><span className="block truncate text-[14px] font-bold">{valor}</span></span>
      <span className="text-[12px] font-semibold text-[#9C1E1E]">{acao}</span>
    </button>
  );
  return (
    <section className="rounded-3xl border border-[#9C1E1E]/15 bg-white/85 p-4 shadow-[0_14px_30px_-22px_rgba(70,20,20,0.3)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6A6B70]">Configuração do prédio</div>
          <h2 className="truncate text-[18px] font-extrabold">{predio.nome}</h2>
          <p className="text-[12.5px] text-[#5E5F63]">Vale para as {telas.length} TV(s) deste prédio{personalizadas ? ` · ${personalizadas} com personalização própria` : ' · todas seguem o prédio'}. Orientação e giro são de cada TV.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        <Linha icone={<Video className="h-5 w-5" />} rotulo="Câmeras" valor={cfg.cameras ? resumoCameras(cfg.cameras) : 'Todas as câmeras'} acao="Escolher" onClick={() => setCams(true)} />
        <Linha icone={<Bell className="h-5 w-5" />} rotulo="Avisos do síndico" valor={cfg.avisos === false ? 'Desligados' : 'Ligados'} acao={cfg.avisos === false ? 'Ligar' : 'Desligar'}
          onClick={() => salvar({ avisos: cfg.avisos === false }).catch((e) => toast.error((e as Error).message))} />
        <Linha icone={<LayoutGrid className="h-5 w-5" />} rotulo="Layout · TV em pé" valor={cfg.layout_v ? `${cfg.layout_v} · ${infoLayout(cfg.layout_v).nome}` : 'Não definido (cada TV)'} acao="Trocar" onClick={() => setLayoutDe('v')} />
        <Linha icone={<LayoutGrid className="h-5 w-5" />} rotulo="Layout · TV deitada" valor={cfg.layout_h ? `${cfg.layout_h} · ${infoLayout(cfg.layout_h).nome}` : 'Não definido (cada TV)'} acao="Trocar" onClick={() => setLayoutDe('h')} />
      </div>
      {layoutDe && (
        <div className="mt-3 rounded-2xl border border-black/10 p-3">
          <div className="mb-2 flex items-center justify-between"><b className="text-[14px]">Layout do prédio · {layoutDe === 'v' ? 'TV em pé' : 'TV deitada'}</b><button type="button" onClick={() => setLayoutDe(null)} className="text-[13px] font-semibold text-[#6A6B70]">Fechar</button></div>
          <GradeLayouts valor={(layoutDe === 'v' ? cfg.layout_v : cfg.layout_h) || ''} atual={(layoutDe === 'v' ? cfg.layout_v : cfg.layout_h) || undefined} vertical={layoutDe === 'v'} predio={ehPredio}
            onEscolher={(id) => salvar(layoutDe === 'v' ? { layout_v: id } : { layout_h: id }).then(() => setLayoutDe(null)).catch((e) => toast.error((e as Error).message))} />
        </div>
      )}
      {cams && (
        <EscolherCameras titulo={predio.nome} predioId={predio.id} atual={cfg.cameras} onFechar={() => setCams(false)}
          onSalvar={async (c) => { await salvar({ cameras: c }); setCams(false); }} />
      )}
    </section>
  );
}
