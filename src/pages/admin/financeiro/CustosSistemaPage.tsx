import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Server, ExternalLink, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  PaginaCelular, TopoCelular, BotaoRedondo, Kpis, BuscaCelular, Pilulas, CartaoCelular, LinhaCelular,
  Selo, SELO, Vazio, Carregando, FolhaCelular,
} from '@/components/admin/celular/kit';

/**
 * Financeiro → Custos do sistema (03/11/2026).
 * Tudo o que o sistema precisa para funcionar e quanto custa por mês: servidores, banco, IA, mensagens,
 * pagamentos, ferramentas e operação das telas. Valores em dólar/euro são convertidos pela cotação do dia
 * (BrasilAPI); sem cotação, usa a de referência abaixo.
 */

type Custo = {
  id: string; categoria: string; servico: string; fornecedor: string; para_que_serve: string | null; quem_depende: string | null;
  cobranca: 'fixo' | 'uso'; moeda: 'USD' | 'BRL' | 'EUR'; valor_mensal: number | null; fonte: 'medido' | 'fatura' | 'estimado' | 'a_confirmar';
  status: 'ativo' | 'revisar' | 'desligado'; forma_pagamento: string | null; link_painel: string | null; observacao: string | null;
  ordem: number; atualizado_em: string;
};

const COTACAO_REF = { USD: 5.6, EUR: 6.1, BRL: 1 };
const db = supabase as any;
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const moedaFmt = (v: number, m: string) => (m === 'BRL' ? brl(v) : `${m === 'USD' ? 'US$' : '€'} ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

const FONTE: Record<Custo['fonte'], { r: string; c: keyof typeof SELO }> = {
  medido: { r: 'Medido', c: 'verde' }, fatura: { r: 'Da fatura', c: 'azul' }, estimado: { r: 'Estimado', c: 'cinza' }, a_confirmar: { r: 'A confirmar', c: 'ambar' },
};
const STATUS: Record<Custo['status'], { r: string; c: keyof typeof SELO }> = {
  ativo: { r: 'Ativo', c: 'verde' }, revisar: { r: 'Dá para cortar?', c: 'ambar' }, desligado: { r: 'Desligado', c: 'cinza' },
};

async function cotacaoDoDia(moeda: 'USD' | 'EUR'): Promise<number | null> {
  for (let i = 1; i <= 5; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    try {
      const r = await fetch(`https://brasilapi.com.br/api/cambio/v1/cotacao/${moeda}/${d}`);
      if (!r.ok) continue;
      const j = await r.json();
      const ult = Array.isArray(j?.cotacoes) ? j.cotacoes[j.cotacoes.length - 1] : null;
      if (ult?.cotacao_venda) return Number(ult.cotacao_venda);
    } catch { /* tenta o dia anterior */ }
  }
  return null;
}

export default function CustosSistemaPage() {
  const [itens, setItens] = useState<Custo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [cot, setCot] = useState({ ...COTACAO_REF, ref: true });
  const [editando, setEditando] = useState<Custo | null>(null);
  const [form, setForm] = useState<{ valor: string; fonte: Custo['fonte']; status: Custo['status']; observacao: string }>({ valor: '', fonte: 'a_confirmar', status: 'ativo', observacao: '' });
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    const { data, error } = await db.from('custos_sistema').select('*').order('ordem');
    if (error) toast.error('Não consegui carregar os custos');
    setItens((data || []) as Custo[]);
    setCarregando(false);
  };
  useEffect(() => {
    carregar();
    Promise.all([cotacaoDoDia('USD'), cotacaoDoDia('EUR')]).then(([u, e]) => {
      if (u) setCot({ BRL: 1, USD: u, EUR: e || COTACAO_REF.EUR, ref: false });
    });
  }, []);

  const emReais = (c: Custo) => (c.valor_mensal == null ? null : Number(c.valor_mensal) * (cot[c.moeda] || 1));
  const ativos = itens.filter((c) => c.status !== 'desligado');
  const total = ativos.reduce((s, c) => s + (emReais(c) || 0), 0);
  const fixo = ativos.filter((c) => c.cobranca === 'fixo').reduce((s, c) => s + (emReais(c) || 0), 0);
  const semValor = ativos.filter((c) => c.valor_mensal == null || c.fonte === 'a_confirmar').length;
  const paraRevisar = itens.filter((c) => c.status === 'revisar').length;

  const categorias = useMemo(() => Array.from(new Set(itens.map((c) => c.categoria))), [itens]);
  const visiveis = itens.filter((c) => {
    if (filtro === 'confirmar' && !(c.valor_mensal == null || c.fonte === 'a_confirmar')) return false;
    if (filtro === 'revisar' && c.status !== 'revisar') return false;
    if (filtro.startsWith('cat:') && c.categoria !== filtro.slice(4)) return false;
    const q = busca.trim().toLowerCase();
    return !q || `${c.servico} ${c.fornecedor} ${c.para_que_serve || ''} ${c.quem_depende || ''}`.toLowerCase().includes(q);
  });

  const abrir = (c: Custo) => {
    setEditando(c);
    setForm({ valor: c.valor_mensal == null ? '' : String(c.valor_mensal).replace('.', ','), fonte: c.fonte, status: c.status, observacao: c.observacao || '' });
  };
  const salvar = async () => {
    if (!editando) return;
    const v = form.valor.trim() === '' ? null : Number(form.valor.replace(/\./g, '').replace(',', '.'));
    if (v != null && (!isFinite(v) || v < 0)) { toast.error('Valor inválido'); return; }
    setSalvando(true);
    const { error } = await db.from('custos_sistema').update({ valor_mensal: v, fonte: form.fonte, status: form.status, observacao: form.observacao || null }).eq('id', editando.id);
    setSalvando(false);
    if (error) { toast.error('Não consegui salvar'); return; }
    setEditando(null);
    carregar();
  };

  return (
    <PaginaCelular>
      <TopoCelular
        titulo="Custos do sistema"
        sub="Tudo o que o sistema precisa para funcionar"
        acoes={<BotaoRedondo rotulo="Atualizar" onClick={carregar} disabled={carregando}><RefreshCw className={`h-[18px] w-[18px] ${carregando ? 'animate-spin' : ''}`} /></BotaoRedondo>}
      />

      <Kpis
        colunas={2}
        itens={[
          { rotulo: 'Por mês (o que já tem valor)', valor: brl(total), cor: '#9C1E1E' },
          { rotulo: 'Fixo · assinaturas', valor: brl(fixo) },
          { rotulo: 'Sem valor confirmado', valor: semValor, cor: semValor ? '#9A5300' : '#1E6B47', ativo: filtro === 'confirmar', onClick: () => setFiltro(filtro === 'confirmar' ? 'todos' : 'confirmar') },
          { rotulo: 'Dá para cortar?', valor: paraRevisar, cor: paraRevisar ? '#9A5300' : '#1E6B47', ativo: filtro === 'revisar', onClick: () => setFiltro(filtro === 'revisar' ? 'todos' : 'revisar') },
        ]}
      />
      <p className="mb-3 px-1 text-[12px] text-[#6A6B70]">
        Dólar {cot.USD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · Euro {cot.EUR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        {cot.ref ? ' (referência — sem cotação do dia)' : ' (cotação do dia, BrasilAPI)'}. O total só soma o que já tem valor; os itens "A confirmar" ainda faltam.
      </p>

      <BuscaCelular valor={busca} onChange={setBusca} placeholder="Buscar serviço ou fornecedor" />
      <Pilulas
        valor={filtro}
        onChange={setFiltro}
        opcoes={[{ valor: 'todos', rotulo: 'Todos', n: itens.length }, ...categorias.map((c) => ({ valor: `cat:${c}`, rotulo: c, n: itens.filter((i) => i.categoria === c).length }))]}
      />

      {carregando ? <Carregando /> : visiveis.length === 0 ? (
        <Vazio icone={<Server className="h-6 w-6" />} titulo="Nada aqui" texto="Mude o filtro ou a busca." />
      ) : (
        categorias.filter((cat) => visiveis.some((c) => c.categoria === cat)).map((cat) => {
          const doGrupo = visiveis.filter((c) => c.categoria === cat);
          const soma = doGrupo.filter((c) => c.status !== 'desligado').reduce((s, c) => s + (emReais(c) || 0), 0);
          return (
            <section key={cat} className="mb-4">
              <div className="mb-1.5 flex items-baseline justify-between px-1">
                <h2 className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#6A6B70]">{cat}</h2>
                <span className="text-[13px] font-extrabold">{brl(soma)}</span>
              </div>
              <CartaoCelular className="divide-y divide-black/[0.05] overflow-hidden">
                {doGrupo.map((c) => {
                  const r = emReais(c);
                  return (
                    <LinhaCelular
                      key={c.id}
                      onClick={() => abrir(c)}
                      titulo={<span className={c.status === 'desligado' ? 'text-[#9A9BA0] line-through' : ''}>{c.servico}</span>}
                      direita={<span className="shrink-0 text-[14px] font-extrabold">{r == null ? '—' : brl(r)}</span>}
                      linha2={`${c.fornecedor}${c.para_que_serve ? ' · ' + c.para_que_serve : ''}`}
                      linha3={<>
                        <Selo {...SELO[FONTE[c.fonte].c]}>{FONTE[c.fonte].r}</Selo>
                        <Selo {...SELO[c.cobranca === 'fixo' ? 'cinza' : 'roxo']}>{c.cobranca === 'fixo' ? 'Fixo' : 'Pelo uso'}</Selo>
                        {c.status !== 'ativo' && <Selo {...SELO[STATUS[c.status].c]}>{STATUS[c.status].r}</Selo>}
                        {c.valor_mensal != null && c.moeda !== 'BRL' && <span className="text-[11.5px] font-bold text-[#8A8B90]">{moedaFmt(Number(c.valor_mensal), c.moeda)}</span>}
                      </>}
                    />
                  );
                })}
              </CartaoCelular>
            </section>
          );
        })
      )}

      <FolhaCelular aberta={!!editando} onFechar={() => setEditando(null)} titulo={editando?.servico || ''}>
        {editando && (
          <div className="space-y-4 px-5 pb-6 pt-2 text-[14px] text-[#17181A]">
            <div className="space-y-1 text-[13px] text-[#45464A]">
              <div><b>Fornecedor:</b> {editando.fornecedor}</div>
              {editando.para_que_serve && <div><b>Para que serve:</b> {editando.para_que_serve}</div>}
              {editando.quem_depende && <div><b>Se cair, para:</b> {editando.quem_depende}</div>}
              {editando.forma_pagamento && <div><b>Pagamento:</b> {editando.forma_pagamento}</div>}
              <div className="text-[12px] text-[#8A8B90]">Atualizado em {new Date(editando.atualizado_em).toLocaleDateString('pt-BR')}</div>
            </div>
            {editando.link_painel && (
              <a href={editando.link_painel} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#9C1E1E]">
                <ExternalLink className="h-4 w-4" /> Abrir fatura / consumo
              </a>
            )}
            <label className="block">
              <span className="mb-1 block text-[12.5px] font-bold text-[#6A6B70]">Valor por mês ({editando.moeda})</span>
              <input value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} inputMode="decimal" placeholder="Ex.: 25,00"
                className="h-12 w-full rounded-2xl border border-black/[0.08] bg-white px-4 text-[16px] outline-none focus:border-[#9C1E1E]/50" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[12.5px] font-bold text-[#6A6B70]">De onde vem o valor</span>
                <select value={form.fonte} onChange={(e) => setForm({ ...form, fonte: e.target.value as Custo['fonte'] })} className="h-12 w-full rounded-2xl border border-black/[0.08] bg-white px-3 text-[16px]">
                  <option value="fatura">Da fatura</option><option value="medido">Medido no painel</option><option value="estimado">Estimado</option><option value="a_confirmar">A confirmar</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[12.5px] font-bold text-[#6A6B70]">Situação</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Custo['status'] })} className="h-12 w-full rounded-2xl border border-black/[0.08] bg-white px-3 text-[16px]">
                  <option value="ativo">Ativo</option><option value="revisar">Dá para cortar?</option><option value="desligado">Desligado</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-[12.5px] font-bold text-[#6A6B70]">Observação</span>
              <textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} rows={3}
                className="w-full rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-[16px] outline-none focus:border-[#9C1E1E]/50" />
            </label>
            <button type="button" onClick={salvar} disabled={salvando}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#9C1E1E] text-[15px] font-bold text-white active:scale-[.98] disabled:opacity-60">
              <Pencil className="h-4 w-4" /> {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        )}
      </FolhaCelular>
    </PaginaCelular>
  );
}
