import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, QrCode, Download, Pencil, Plus, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  PaginaCelular, TopoCelular, BotaoRedondo, Kpis, BuscaCelular, Pilulas, CartaoCelular, LinhaCelular,
  Selo, SELO, Vazio, Carregando, FolhaCelular,
} from '@/components/admin/celular/kit';

/**
 * QRs dos vídeos (04/11/2026).
 * Todo vídeo que a EXA produz para anunciante sai com um QR rastreado (função exa-qr?c=CODIGO).
 * Cada leitura fica registrada: quantas vezes, quando, em que dia e horário, de que tipo de celular.
 * O destino (WhatsApp com mensagem pronta ou link) muda aqui, sem refazer o vídeo.
 */

const BASE = 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa-qr?c=';
const db = supabase as any;

type Link = {
  id: string; codigo: string; cliente: string; campanha: string | null; titulo: string; formato: string | null;
  whatsapp: string | null; mensagem: string | null; destino_url: string | null; arquivo: string | null; ativo: boolean; criado_em: string;
};
type Leitura = { codigo: string; lido_em: string; dispositivo: string | null; ip_hash: string | null };

const PERIODOS = [
  { valor: '7', rotulo: '7 dias' }, { valor: '30', rotulo: '30 dias' }, { valor: '90', rotulo: '90 dias' }, { valor: 'tudo', rotulo: 'Tudo' },
];
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const dataHora = (s: string) => new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
const horaSP = (s: string) => Number(new Date(s).toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' })) % 24;
const diaSP = (s: string) => new Date(new Date(s).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getDay();
const destinoTexto = (l: Link) => (l.whatsapp ? `WhatsApp ${l.whatsapp}` : l.destino_url || '—');

function Barras({ valores, rotulos }: { valores: number[]; rotulos: string[] }) {
  const max = Math.max(1, ...valores);
  return (
    <div className="flex h-24 items-end gap-[3px]">
      {valores.map((v, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${rotulos[i]}: ${v}`}>
          <div className="w-full rounded-t-[4px] bg-[#9C1E1E]" style={{ height: `${(v / max) * 72}px`, minHeight: v ? 3 : 0, opacity: v ? 1 : 0.15 }} />
          <span className="text-[9.5px] text-[#8A8B90]">{rotulos[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function QrVideosAdminPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState('30');
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState<Link | null>(null);
  const [qrImg, setQrImg] = useState('');
  const [form, setForm] = useState<Partial<Link>>({});
  const [novo, setNovo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    const desde = periodo === 'tudo' ? '2026-01-01' : new Date(Date.now() - Number(periodo) * 86400000).toISOString();
    const [l, r] = await Promise.all([
      db.from('exa_qr_links').select('*').order('criado_em', { ascending: false }),
      db.from('exa_qr_leituras').select('codigo, lido_em, dispositivo, ip_hash').gte('lido_em', desde).order('lido_em', { ascending: false }).limit(20000),
    ]);
    if (l.error || r.error) toast.error('Não consegui carregar os QRs');
    setLinks((l.data || []) as Link[]);
    setLeituras((r.data || []) as Leitura[]);
    setCarregando(false);
  };
  useEffect(() => { carregar(); }, [periodo]);

  const porCodigo = useMemo(() => {
    const m: Record<string, Leitura[]> = {};
    leituras.forEach((x) => { (m[x.codigo] ||= []).push(x); });
    return m;
  }, [leituras]);
  const pessoas = (ls: Leitura[]) => new Set(ls.map((x) => x.ip_hash || x.lido_em)).size;
  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const deHoje = leituras.filter((x) => new Date(x.lido_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) === hoje).length;

  const visiveis = links.filter((l) => {
    const q = busca.trim().toLowerCase();
    return !q || `${l.codigo} ${l.cliente} ${l.campanha || ''} ${l.titulo}`.toLowerCase().includes(q);
  }).sort((a, b) => (porCodigo[b.codigo]?.length || 0) - (porCodigo[a.codigo]?.length || 0));

  const abrir = async (l: Link) => {
    setNovo(false); setAberto(l); setForm(l);
    setQrImg(await QRCode.toDataURL(BASE + l.codigo, { errorCorrectionLevel: 'M', margin: 2, width: 600 }));
  };
  const abrirNovo = () => {
    setNovo(true); setQrImg('');
    const f: Partial<Link> = { codigo: '', cliente: '', campanha: '', titulo: '', formato: 'vertical 15 s', whatsapp: '', destino_url: '', ativo: true,
      mensagem: 'Olá! Vi seu anúncio na tela da EXA e quero saber mais. (cód. {codigo})' };
    setForm(f); setAberto(f as Link);
  };
  const salvar = async () => {
    const codigo = (form.codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const whatsapp = (form.whatsapp || '').replace(/\D/g, '') || null;
    const destino_url = (form.destino_url || '').trim() || null;
    if (codigo.length < 3) { toast.error('Código com 3 a 12 letras/números'); return; }
    if (!form.cliente || !form.titulo) { toast.error('Preencha cliente e título'); return; }
    if (!whatsapp && !destino_url) { toast.error('Informe o WhatsApp ou um link de destino'); return; }
    if (whatsapp && whatsapp.length < 12) { toast.error('WhatsApp com DDI e DDD, ex.: 5545999990000'); return; }
    if (destino_url && !/^https:\/\//i.test(destino_url)) { toast.error('O link precisa começar com https://'); return; }
    setSalvando(true);
    const dados = { codigo, cliente: form.cliente, campanha: form.campanha || null, titulo: form.titulo, formato: form.formato || null,
      whatsapp, mensagem: form.mensagem || null, destino_url, ativo: form.ativo !== false, atualizado_em: new Date().toISOString() };
    const { error } = novo ? await db.from('exa_qr_links').insert(dados) : await db.from('exa_qr_links').update(dados).eq('id', aberto!.id);
    setSalvando(false);
    if (error) { toast.error(error.message?.includes('duplicate') ? 'Esse código já existe' : 'Não consegui salvar'); return; }
    toast.success('Salvo');
    setAberto(null); carregar();
  };
  const baixarCsv = () => {
    const linhas = [['codigo', 'cliente', 'campanha', 'video', 'lido_em', 'dispositivo']];
    const mapa = Object.fromEntries(links.map((l) => [l.codigo, l]));
    leituras.forEach((x) => { const l = mapa[x.codigo]; linhas.push([x.codigo, l?.cliente || '', l?.campanha || '', l?.titulo || '', dataHora(x.lido_em), x.dispositivo || '']); });
    const csv = linhas.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = `qr-videos-${periodo}.csv`; a.click();
  };

  const det = aberto && !novo ? (porCodigo[aberto.codigo] || []) : [];
  const porHora = Array.from({ length: 24 }, (_, h) => det.filter((x) => horaSP(x.lido_em) === h).length);
  const porDia = Array.from({ length: 7 }, (_, d) => det.filter((x) => diaSP(x.lido_em) === d).length);
  const input = 'h-12 w-full rounded-2xl border border-black/[0.08] bg-white px-4 text-[16px] outline-none focus:border-[#9C1E1E]/50';
  const campo = (rotulo: string, k: keyof Link, ph = '', extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1 block text-[12.5px] font-bold text-[#6A6B70]">{rotulo}</span>
      <input value={(form[k] as string) || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={ph} className={input} {...extra} />
    </label>
  );

  return (
    <PaginaCelular>
      <TopoCelular
        titulo="QRs dos vídeos"
        sub="Quantas vezes cada QR dos vídeos produzidos pela EXA foi lido"
        acoes={<>
          <BotaoRedondo rotulo="Novo QR" onClick={abrirNovo}><Plus className="h-[18px] w-[18px]" /></BotaoRedondo>
          <BotaoRedondo rotulo="Baixar planilha" onClick={baixarCsv}><Download className="h-[18px] w-[18px]" /></BotaoRedondo>
          <BotaoRedondo rotulo="Atualizar" onClick={carregar} disabled={carregando}><RefreshCw className={`h-[18px] w-[18px] ${carregando ? 'animate-spin' : ''}`} /></BotaoRedondo>
        </>}
      />
      <Kpis colunas={3} itens={[
        { rotulo: 'Leituras no período', valor: leituras.length, cor: '#9C1E1E' },
        { rotulo: 'Hoje', valor: deHoje },
        { rotulo: 'Vídeos com QR', valor: links.filter((l) => l.ativo).length },
      ]} />
      <Pilulas valor={periodo} onChange={setPeriodo} opcoes={PERIODOS} />
      <BuscaCelular valor={busca} onChange={setBusca} placeholder="Buscar cliente, campanha ou código" />

      {carregando ? <Carregando /> : visiveis.length === 0 ? (
        <Vazio icone={<QrCode className="h-6 w-6" />} titulo="Nenhum QR ainda" texto="Os vídeos produzidos pela EXA aparecem aqui com o QR rastreado." />
      ) : (
        <CartaoCelular className="divide-y divide-black/[0.05] overflow-hidden">
          {visiveis.map((l) => {
            const ls = porCodigo[l.codigo] || [];
            return (
              <LinhaCelular key={l.id} onClick={() => abrir(l)}
                titulo={<>{l.campanha ? `${l.campanha} · ` : ''}{l.titulo}</>}
                direita={<span className="shrink-0 text-[17px] font-extrabold text-[#9C1E1E]">{ls.length}</span>}
                linha2={`${l.cliente} · ${l.codigo}${ls[0] ? ' · última ' + dataHora(ls[0].lido_em) : ' · sem leituras no período'}`}
                linha3={<>
                  <Selo {...SELO[l.whatsapp ? 'verde' : 'ambar']}>{l.whatsapp ? 'Abre o WhatsApp' : 'Abre um link'}</Selo>
                  {ls.length > 0 && <Selo {...SELO.cinza}>{pessoas(ls)} pessoas</Selo>}
                  {!l.ativo && <Selo {...SELO.vermelho}>Desativado</Selo>}
                </>}
              />
            );
          })}
        </CartaoCelular>
      )}
      <p className="mt-3 px-1 text-[12px] text-[#6A6B70]">
        "Pessoas" conta celulares diferentes (pelo endereço de internet, guardado só como código). Robôs de pré-visualização não contam.
      </p>

      <FolhaCelular aberta={!!aberto} onFechar={() => setAberto(null)} titulo={novo ? 'Novo QR rastreado' : aberto?.titulo || ''}>
        {aberto && (
          <div className="space-y-4 px-5 pb-6 pt-2 text-[14px] text-[#17181A]">
            {!novo && (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-black/[0.03] p-3"><div className="text-[22px] font-extrabold text-[#9C1E1E]">{det.length}</div><div className="text-[11.5px] text-[#6A6B70]">leituras</div></div>
                  <div className="rounded-2xl bg-black/[0.03] p-3"><div className="text-[22px] font-extrabold">{pessoas(det)}</div><div className="text-[11.5px] text-[#6A6B70]">pessoas</div></div>
                  <div className="rounded-2xl bg-black/[0.03] p-3"><div className="text-[22px] font-extrabold">{det.filter((x) => x.dispositivo === 'iphone').length}/{det.filter((x) => x.dispositivo === 'android').length}</div><div className="text-[11.5px] text-[#6A6B70]">iPhone/Android</div></div>
                </div>
                <div><div className="mb-1 text-[12.5px] font-bold text-[#6A6B70]">Por horário</div><Barras valores={porHora} rotulos={porHora.map((_, h) => (h % 3 === 0 ? `${h}h` : ''))} /></div>
                <div><div className="mb-1 text-[12.5px] font-bold text-[#6A6B70]">Por dia da semana</div><Barras valores={porDia} rotulos={DIAS} /></div>
                {det.length > 0 && (
                  <div>
                    <div className="mb-1 text-[12.5px] font-bold text-[#6A6B70]">Últimas leituras</div>
                    <div className="max-h-44 overflow-auto rounded-2xl bg-black/[0.03] px-3 py-2 text-[13px]">
                      {det.slice(0, 50).map((x, i) => <div key={i} className="flex justify-between py-0.5"><span>{dataHora(x.lido_em)}</span><span className="text-[#8A8B90]">{x.dispositivo}</span></div>)}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  {qrImg && <img src={qrImg} alt="QR" className="h-28 w-28 rounded-xl border border-black/[0.06]" />}
                  <div className="min-w-0 space-y-1.5 text-[12.5px] text-[#45464A]">
                    <div className="break-all"><b>Endereço do QR:</b> {BASE + aberto.codigo}</div>
                    <div className="break-all"><b>Destino agora:</b> {destinoTexto(aberto)}</div>
                    {aberto.arquivo && <div className="break-all"><b>Arquivo:</b> {aberto.arquivo}</div>}
                    <div className="flex gap-3">
                      {qrImg && <a href={qrImg} download={`QR_${aberto.codigo}.png`} className="font-bold text-[#9C1E1E]">Baixar QR</a>}
                      <a href={BASE + aberto.codigo + '&teste=1'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-[#9C1E1E]"><ExternalLink className="h-3.5 w-3.5" />Testar destino</a>
                    </div>
                  </div>
                </div>
              </>
            )}
            {novo && campo('Código (vai no QR)', 'codigo', 'Ex.: ORAL1', { maxLength: 12, style: { textTransform: 'uppercase' } })}
            <div className="grid grid-cols-2 gap-3">{campo('Cliente', 'cliente', 'Ex.: Kammer / 3K')}{campo('Campanha', 'campanha', 'Ex.: Edifício SoHo')}</div>
            {campo('Título do vídeo', 'titulo', 'Ex.: Vídeo 3 · Hall')}
            {campo('WhatsApp do anunciante (com DDI)', 'whatsapp', 'Ex.: 5545999990000', { inputMode: 'numeric' })}
            <label className="block">
              <span className="mb-1 block text-[12.5px] font-bold text-[#6A6B70]">Mensagem pronta do WhatsApp ({'{codigo}'} vira o código)</span>
              <textarea value={form.mensagem || ''} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} rows={3}
                className="w-full rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-[16px] outline-none focus:border-[#9C1E1E]/50" />
            </label>
            {campo('Ou link de destino (se não tiver WhatsApp)', 'destino_url', 'https://…')}
            <label className="flex items-center gap-2 text-[14px] font-bold">
              <input type="checkbox" checked={form.ativo !== false} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /> QR ativo
            </label>
            <p className="text-[12px] text-[#6A6B70]">Com WhatsApp preenchido, o QR abre o WhatsApp com a mensagem. Mudar o destino não exige refazer o vídeo.</p>
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
