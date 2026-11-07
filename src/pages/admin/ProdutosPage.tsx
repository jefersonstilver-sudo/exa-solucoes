// EXA (06/11/2026) — Produtos, refeito no layout novo (pedido do Jeferson): os dois produtos (Horizontal e Vertical
// Premium) sem campos de vendedor, a rodada calculada ao vivo, as configurações de exibição e as PROMOÇÕES
// (R$ 99 por prédio em novembro, rede completa por R$ 999 com 10 vagas, Vertical Premium R$ 1.999 com 1 vaga).
// O site (/loja e a tarja do topo) lê as promoções daqui.
import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Clock, Loader2, Monitor, Plus, RefreshCw, Save, Smartphone, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { calcularRodada } from '@/lib/exibicoesRodada';
import { useProdutosExa, type ProdutoExa } from '@/hooks/useProdutosExa';
import { usePromocoesExa, promocaoValendo, vagasRestantes, type PromocaoExa } from '@/hooks/usePromocoesExa';

const CARD = 'rounded-[24px] bg-white shadow-[0_1px_2px_rgba(30,15,18,.05),0_8px_24px_-14px_rgba(30,15,18,.16)]';
const EYEBROW = 'text-[12px] font-bold uppercase tracking-[0.11em] text-[#9C1E1E]';
const H2 = 'mt-1 text-[21px] font-extrabold tracking-tight text-[#1b1719]';
const LABEL = 'block text-[12px] font-bold text-[#8b8285]';
const INPUT = 'mt-1 h-10 w-full rounded-xl border border-[#1b1719]/10 bg-[#f7f5f6] px-3 text-[14px] font-semibold text-[#1b1719] outline-none focus:border-[#9C1E1E]/40 focus:bg-white';
const BTN = 'inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#9C1E1E] px-4 text-[13px] font-bold text-white transition hover:bg-[#7c1428] disabled:opacity-50';
const BTN2 = 'inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#1b1719]/15 bg-white px-4 text-[13px] font-bold text-[#1b1719] transition hover:bg-[#f7f5f6] disabled:opacity-50';
const brl = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nf = (v: number) => Math.round(v).toLocaleString('pt-BR');

const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: string }> = ({ on, onChange, label }) => (
  <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#1b1719]">
    <span className={`relative h-6 w-11 flex-none rounded-full transition ${on ? 'bg-[#13a24a]' : 'bg-[#d9d2d4]'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </span>
    {label}
  </button>
);

type EdProd = Pick<ProdutoExa, 'duracao_video_segundos' | 'max_clientes_por_painel' | 'max_videos_por_pedido' | 'vendido_no_site' | 'contratacao_parcial' | 'resolucao' | 'ativo'>;
const deProduto = (p?: ProdutoExa | null): EdProd => ({
  duracao_video_segundos: p?.duracao_video_segundos ?? 10, max_clientes_por_painel: p?.max_clientes_por_painel ?? 15, max_videos_por_pedido: p?.max_videos_por_pedido ?? 4,
  vendido_no_site: !!p?.vendido_no_site, contratacao_parcial: !!p?.contratacao_parcial, resolucao: p?.resolucao || '', ativo: p?.ativo ?? true,
});

const CartaoProduto: React.FC<{ titulo: string; sub: string; icone: React.ReactNode; produto?: ProdutoExa | null; ed: EdProd; setEd: (f: (e: EdProd) => EdProd) => void; salvar: () => void; salvando: boolean }> = ({ titulo, sub, icone, produto, ed, setEd, salvar, salvando }) => (
  <section className={`${CARD} p-5 sm:p-6`}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-[#f8e9ec] text-[#9C1E1E]">{icone}</span>
        <div>
          <div className="text-[17px] font-extrabold tracking-tight text-[#1b1719]">{titulo}</div>
          <div className="text-[12.5px] text-[#8b8285]">{sub}</div>
        </div>
      </div>
      <Toggle on={ed.ativo} onChange={(v) => setEd((e) => ({ ...e, ativo: v }))} label={ed.ativo ? 'Ativo' : 'Inativo'} />
    </div>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <label><span className={LABEL}>Duração (s)</span><input type="number" className={INPUT} value={ed.duracao_video_segundos} onChange={(e) => setEd((x) => ({ ...x, duracao_video_segundos: Number(e.target.value) || 0 }))} /></label>
      <label><span className={LABEL}>Anunciantes por tela</span><input type="number" className={INPUT} value={ed.max_clientes_por_painel} onChange={(e) => setEd((x) => ({ ...x, max_clientes_por_painel: Number(e.target.value) || 0 }))} /></label>
      <label><span className={LABEL}>Vídeos por pedido</span><input type="number" className={INPUT} value={ed.max_videos_por_pedido ?? ''} onChange={(e) => setEd((x) => ({ ...x, max_videos_por_pedido: Number(e.target.value) || null }))} /></label>
      <label><span className={LABEL}>Resolução</span><input className={INPUT} value={ed.resolucao || ''} onChange={(e) => setEd((x) => ({ ...x, resolucao: e.target.value }))} /></label>
    </div>
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
      <Toggle on={ed.vendido_no_site} onChange={(v) => setEd((e) => ({ ...e, vendido_no_site: v }))} label="Vendido no site" />
      <Toggle on={ed.contratacao_parcial} onChange={(v) => setEd((e) => ({ ...e, contratacao_parcial: v }))} label="Pode escolher só alguns prédios" />
    </div>
    <div className="mt-5 flex items-center justify-between gap-3">
      <span className="text-[11.5px] text-[#a39a9d]">{produto?.ultima_alteracao_em ? <><Clock className="mr-1 inline h-3 w-3" />{new Date(produto.ultima_alteracao_em).toLocaleString('pt-BR')}{produto.ultima_alteracao_por ? ` · ${produto.ultima_alteracao_por}` : ''}</> : ''}</span>
      <button type="button" className={BTN} onClick={salvar} disabled={salvando}>{salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar</button>
    </div>
  </section>
);

const vazia = (ordem: number): Partial<PromocaoExa> => ({ codigo: '', titulo: '', descricao: '', produto: 'horizontal', unidade: 'predio', preco: 0, plano_meses: 6, inclui_videos: true, vagas_total: null, vagas_usadas: 0, inicio: null, fim: null, ativo: true, ordem, onde: 'site', cliente_id: null, bonus_predios: 0 });

const CartaoPromocao: React.FC<{ p: Partial<PromocaoExa>; onSalvo: () => void; onExcluido: () => void }> = ({ p, onSalvo, onExcluido }) => {
  const [ed, setEd] = useState<Partial<PromocaoExa>>(p);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => setEd(p), [p]);
  const vale = ed.id ? promocaoValendo(ed as PromocaoExa) : false;
  const rest = ed.id ? vagasRestantes(ed as PromocaoExa) : null;
  const set = (k: keyof PromocaoExa, v: unknown) => setEd((e) => ({ ...e, [k]: v }));
  const salvar = async () => {
    if (!ed.titulo?.trim() || !ed.codigo?.trim() || !(Number(ed.preco) > 0)) { toast.error('Código, título e preço são obrigatórios.'); return; }
    setSalvando(true);
    const { data: u } = await supabase.auth.getUser();
    const dados = { ...ed, preco: Number(ed.preco), plano_meses: Number(ed.plano_meses) || 1, vagas_total: ed.vagas_total == null || ed.vagas_total === ('' as any) ? null : Number(ed.vagas_total), vagas_usadas: Number(ed.vagas_usadas) || 0, bonus_predios: Number(ed.bonus_predios) || 0, onde: ed.onde || 'site', cliente_id: ed.cliente_id || null, inicio: ed.inicio || null, fim: ed.fim || null, descricao: ed.descricao || null, updated_by: u.user?.id || null, updated_at: new Date().toISOString() };
    const q = ed.id ? (supabase as any).from('promocoes_exa').update(dados).eq('id', ed.id) : (supabase as any).from('promocoes_exa').insert(dados);
    const { error } = await q;
    setSalvando(false);
    if (error) { toast.error('Não salvou: ' + error.message); return; }
    toast.success('Promoção salva'); onSalvo();
  };
  const excluir = async () => {
    if (!ed.id) { onExcluido(); return; }
    if (!window.confirm(`Excluir a promoção "${ed.titulo}"? Ela some do site na hora.`)) return;
    const { error } = await (supabase as any).from('promocoes_exa').delete().eq('id', ed.id);
    if (error) { toast.error('Não excluiu: ' + error.message); return; }
    toast.success('Promoção excluída'); onExcluido();
  };
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 px-5 py-3 ${vale ? (ed.onde === 'renovacao' ? 'bg-[#fff4e5]' : 'bg-[#ecf9f0]') : 'bg-[#f7f5f6]'}`}>
        <div className="flex items-center gap-2 text-[12px] font-bold">
          <span className={`h-2 w-2 rounded-full ${vale ? 'bg-[#13a24a]' : 'bg-[#b3aaad]'}`} />
          <span className={vale ? 'text-[#0f5f2d]' : 'text-[#8b8285]'}>{!ed.id ? 'Nova' : vale ? (ed.onde === 'renovacao' ? (ed.cliente_id ? 'Cupom de 1 cliente (só a Sofia)' : 'Renovação (só a Sofia)') : 'No ar no site') : ed.ativo ? 'Fora do período ou sem vagas' : 'Desligada'}</span>
          {rest != null && <span className="rounded-full bg-white px-2 py-0.5 text-[#1b1719]">{rest} {rest === 1 ? 'vaga' : 'vagas'}</span>}
        </div>
        <Toggle on={!!ed.ativo} onChange={(v) => set('ativo', v)} label={ed.ativo ? 'Ligada' : 'Desligada'} />
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className={LABEL}>Título (aparece no site)</span><input className={INPUT} value={ed.titulo || ''} onChange={(e) => set('titulo', e.target.value)} /></label>
        <label className="sm:col-span-2"><span className={LABEL}>Descrição curta</span><input className={INPUT} value={ed.descricao || ''} onChange={(e) => set('descricao', e.target.value)} /></label>
        <label><span className={LABEL}>Código (interno, sem espaço)</span><input className={INPUT} value={ed.codigo || ''} onChange={(e) => set('codigo', e.target.value.replace(/\s+/g, '_').toLowerCase())} /></label>
        <label><span className={LABEL}>Produto</span>
          <select className={INPUT} value={ed.produto} onChange={(e) => set('produto', e.target.value)}><option value="horizontal">Horizontal</option><option value="vertical_premium">Vertical Premium</option></select></label>
        <label><span className={LABEL}>Preço por mês</span><input type="number" step="0.01" className={INPUT} value={ed.preco ?? ''} onChange={(e) => set('preco', e.target.value)} /></label>
        <label><span className={LABEL}>Cobrado por</span>
          <select className={INPUT} value={ed.unidade} onChange={(e) => set('unidade', e.target.value)}><option value="predio">prédio (o cliente escolhe quantos)</option><option value="rede">rede inteira (todas as telas)</option></select></label>
        <label><span className={LABEL}>Plano (meses)</span><input type="number" className={INPUT} value={ed.plano_meses ?? ''} onChange={(e) => set('plano_meses', e.target.value)} /></label>
        <label><span className={LABEL}>Vagas (vazio = sem limite)</span><input type="number" className={INPUT} value={ed.vagas_total ?? ''} onChange={(e) => set('vagas_total', e.target.value === '' ? null : Number(e.target.value))} /></label>
        <label><span className={LABEL}>Vagas já usadas</span><input type="number" className={INPUT} value={ed.vagas_usadas ?? 0} onChange={(e) => set('vagas_usadas', e.target.value)} /></label>
        <div className="flex items-end pb-2"><Toggle on={!!ed.inclui_videos} onChange={(v) => set('inclui_videos', v)} label="Criação dos vídeos inclusa" /></div>
        <label><span className={LABEL}>Onde aparece</span>
          <select className={INPUT} value={ed.onde || 'site'} onChange={(e) => set('onde', e.target.value)}><option value="site">site e loja (todo mundo vê)</option><option value="renovacao">só renovação (a Sofia oferece a quem já é cliente)</option></select></label>
        <label><span className={LABEL}>Prédios de bônus (cortesia)</span><input type="number" className={INPUT} value={ed.bonus_predios ?? 0} onChange={(e) => set('bonus_predios', e.target.value)} /></label>
        <label className="sm:col-span-2"><span className={LABEL}>Cupom só para um cliente (id da conta; vazio = qualquer cliente)</span><input className={INPUT} value={ed.cliente_id || ''} onChange={(e) => set('cliente_id', e.target.value.trim() || null)} placeholder="uuid da conta do cliente" /></label>
        <label><span className={LABEL}>Começa em</span><input type="date" className={INPUT} value={ed.inicio || ''} onChange={(e) => set('inicio', e.target.value || null)} /></label>
        <label><span className={LABEL}>Termina em</span><input type="date" className={INPUT} value={ed.fim || ''} onChange={(e) => set('fim', e.target.value || null)} /></label>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[#f1edee] px-5 py-3">
        <button type="button" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#c62828]" onClick={excluir}><Trash2 className="h-3.5 w-3.5" /> Excluir</button>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-extrabold text-[#1b1719]">{brl(Number(ed.preco) || 0)}<span className="text-[11px] font-semibold text-[#8b8285]">/mês{ed.unidade === 'predio' ? ' por prédio' : ' pela rede'}</span></span>
          <button type="button" className={BTN} onClick={salvar} disabled={salvando}>{salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar</button>
        </div>
      </div>
    </section>
  );
};

const ProdutosPage = () => {
  const { produtoHorizontal, produtoVertical, configuracao, isLoading, atualizarProduto, atualizarConfiguracao, sincronizarBuildings, isUpdatingProduto, isUpdatingConfig, isSincronizando } = useProdutosExa();
  const promos = usePromocoesExa();
  const qc = useQueryClient();
  const [edH, setEdH] = useState<EdProd>(deProduto(null));
  const [edV, setEdV] = useState<EdProd>(deProduto(null));
  const [horas, setHoras] = useState(24);
  const [dias, setDias] = useState(30);
  const [novas, setNovas] = useState<Partial<PromocaoExa>[]>([]);
  useEffect(() => { if (produtoHorizontal) setEdH(deProduto(produtoHorizontal)); }, [produtoHorizontal]);
  useEffect(() => { if (produtoVertical) setEdV(deProduto(produtoVertical)); }, [produtoVertical]);
  useEffect(() => { if (configuracao) { setHoras(configuracao.horas_operacao_dia); setDias(configuracao.dias_mes); } }, [configuracao]);

  const rod = useMemo(() => calcularRodada({ horasDia: horas, diasMes: dias, horizontais: edH.max_clientes_por_painel, duracaoHorizontal: edH.duracao_video_segundos, verticais: edV.max_clientes_por_painel, duracaoVertical: edV.duracao_video_segundos }), [horas, dias, edH, edV]);
  const salvarProduto = async (p: ProdutoExa | null | undefined, ed: EdProd) => {
    if (!p) return;
    const { data: u } = await supabase.auth.getUser();
    atualizarProduto({ id: p.id, dados: { ...ed, ultima_alteracao_por: u.user?.user_metadata?.name || u.user?.email || 'Admin' } as Partial<ProdutoExa> });
  };
  const recarregarPromos = () => qc.invalidateQueries({ queryKey: ['promocoes-exa'] });

  if (isLoading) return <div className="flex min-h-[320px] items-center justify-center text-[#8b8285]"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  const lista = promos.data || [];
  const valendo = lista.filter((p) => promocaoValendo(p));

  return (
    <div className="mx-auto max-w-[1040px] space-y-6 p-4 sm:p-6">
      <header>
        <div className={EYEBROW}>Admin</div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-[#1b1719]">Produtos e promoções</h1>
        <p className="mt-1 text-[14px] text-[#6F6669]">O que a EXA vende, como cada tela roda e as promoções que o site mostra agora.</p>
      </header>

      {/* promoções */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className={EYEBROW}>Promoções</div>
            <h2 className={H2}>{valendo.length ? `${valendo.filter((p) => (p.onde || 'site') === 'site' && !p.cliente_id).length} no ar no site · ${valendo.filter((p) => p.onde === 'renovacao' || p.cliente_id).length} de renovação` : 'Nenhuma no ar'}</h2>
            <p className="mt-1 text-[13.5px] text-[#6F6669]">O site e a loja (/loja) mostram o que é do site, ligado, dentro do período e com vaga. As de renovação só a Sofia oferece a quem já é cliente (cliente novo paga o preço do site). Quando fechar uma venda, suba as vagas usadas.</p>
          </div>
          <button type="button" className={BTN2} onClick={() => setNovas((n) => [...n, vazia(lista.length + n.length + 1)])}><Plus className="h-4 w-4" /> Nova promoção</button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {lista.map((p) => <CartaoPromocao key={p.id} p={p} onSalvo={recarregarPromos} onExcluido={recarregarPromos} />)}
          {novas.map((p, i) => <CartaoPromocao key={'n' + i} p={p} onSalvo={() => { setNovas((n) => n.filter((_, j) => j !== i)); recarregarPromos(); }} onExcluido={() => setNovas((n) => n.filter((_, j) => j !== i))} />)}
        </div>
      </section>

      {/* produtos */}
      <section className="space-y-3">
        <div className={EYEBROW}>Produtos</div>
        <div className="grid gap-4 lg:grid-cols-2">
          <CartaoProduto titulo="Horizontal" sub="Uma vez por rodada, junto dos outros anunciantes" icone={<Monitor className="h-5 w-5" />} produto={produtoHorizontal} ed={edH} setEd={(f) => setEdH(f)} salvar={() => salvarProduto(produtoHorizontal, edH)} salvando={isUpdatingProduto} />
          <CartaoProduto titulo="Vertical Premium" sub="Tela cheia, sozinho na tela, em todos os pontos" icone={<Smartphone className="h-5 w-5" />} produto={produtoVertical} ed={edV} setEd={(f) => setEdV(f)} salvar={() => salvarProduto(produtoVertical, edV)} salvando={isUpdatingProduto} />
        </div>
      </section>

      {/* rodada e configurações */}
      <section className={`${CARD} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className={EYEBROW}>Como a tela roda</div>
            <h2 className={H2}>Uma rodada dura {rod.rodadaSegundos >= 60 ? `${Math.floor(rod.rodadaSegundos / 60)} min ${String(rod.rodadaSegundos % 60).padStart(2, '0')} s` : `${rod.rodadaSegundos} s`}</h2>
          </div>
          <div className="flex items-end gap-3">
            <label><span className={LABEL}>Horas ligada por dia</span><input type="number" className={`${INPUT} w-28`} value={horas} onChange={(e) => setHoras(Number(e.target.value) || 0)} /></label>
            <label><span className={LABEL}>Dias no mês</span><input type="number" className={`${INPUT} w-24`} value={dias} onChange={(e) => setDias(Number(e.target.value) || 0)} /></label>
            <button type="button" className={BTN} onClick={() => atualizarConfiguracao({ horas_operacao_dia: horas, dias_mes: dias })} disabled={isUpdatingConfig}><Save className="h-4 w-4" /> Salvar</button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [nf(rod.rodadasDia), 'rodadas por dia', 'em cada tela'],
            [nf(rod.horizontal.dia), 'exibições por dia', 'de cada horizontal, por tela'],
            [nf(rod.horizontal.mes), 'exibições por mês', 'de cada horizontal, por tela'],
            [nf(rod.vertical.mes), 'exibições por mês', 'de cada vertical, por tela'],
          ].map(([v, t, d]) => (
            <div key={t} className="rounded-2xl bg-[#f7f5f6] p-4">
              <div className="text-[24px] font-extrabold tracking-tight text-[#1b1719] tabular-nums">{v}</div>
              <div className="text-[13px] font-bold text-[#1b1719]">{t}</div>
              <div className="text-[12px] text-[#8b8285]">{d}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f1edee] pt-4">
          <p className="text-[12.5px] text-[#8b8285]"><Building2 className="mr-1 inline h-3.5 w-3.5" />Aplica a conta acima a todos os prédios (exibições por mês por tela).</p>
          <button type="button" className={BTN2} onClick={() => sincronizarBuildings()} disabled={isSincronizando}>{isSincronizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Recalcular os prédios</button>
        </div>
      </section>

      <p className="flex items-center gap-2 text-[12px] text-[#a39a9d]"><Sparkles className="h-3.5 w-3.5" /> Sem vendedor por produto: quem atende é a Sofia, pelo WhatsApp do site.</p>
    </div>
  );
};

export default ProdutosPage;
