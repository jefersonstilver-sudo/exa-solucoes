// EXA (06/11/2026) — /anunciante/relatorios (lista de campanhas) e /anunciante/relatorios/:id (relatório completo).
import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, ChevronRight, Loader2 } from 'lucide-react';
import { useEffectiveAuth as useAuth } from '@/hooks/useEffectiveAuth';
import { CARD, EYEBROW, BADGE } from '@/components/pedido-v2/ui';
import { RelatorioPedido } from '@/components/relatorio/RelatorioPedido';
import { usePedidosRelatorio, dataBR } from '@/components/relatorio/useRelatorio';

const ATIVOS = ['ativo', 'video_aprovado', 'pago', 'pago_pendente_video'];

const Relatorios = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const lista = usePedidosRelatorio((userProfile as any)?.id);

  if (id) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:px-6">
        <button onClick={() => navigate('/anunciante/relatorios')} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#8b8285] hover:text-[#1b1719]">
          <ArrowLeft className="h-4 w-4" /> Relatórios
        </button>
        <RelatorioPedido pedidoId={id} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:px-6">
      <div>
        <div className={EYEBROW}>Relatórios</div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#1b1719]">O que suas campanhas entregaram</h1>
        <p className="mt-1 text-sm text-[#8b8285]">Exibições, prédios, vídeos publicados e o PDF de cada campanha.</p>
      </div>
      {lista.isLoading && <div className={`${CARD} flex items-center gap-2 p-6 text-sm text-[#8b8285]`}><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>}
      {lista.error && <div className={`${CARD} p-6 text-sm text-[#8b8285]`}>{(lista.error as Error).message}</div>}
      {lista.data && !lista.data.length && <div className={`${CARD} p-6 text-sm text-[#8b8285]`}>Assim que uma campanha sua entrar no ar, o relatório dela aparece aqui.</div>}
      <div className="space-y-2.5">
        {(lista.data || []).map((p) => (
          <Link key={p.id} to={`/anunciante/relatorios/${p.id}`} className={`${CARD} flex items-center gap-3 p-4 transition hover:-translate-y-0.5`}>
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#f8e9ec] text-[#9C1E1E]"><BarChart3 className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate font-bold text-[#1b1719]">{p.nome}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${ATIVOS.includes(p.status) ? BADGE.ar : BADGE.parado}`}>{ATIVOS.includes(p.status) ? 'No ar' : 'Encerrada'}</span>
              </div>
              <div className="text-[12.5px] text-[#8b8285]">
                {p.produto === 'vertical_premium' ? 'Vertical Premium' : 'Horizontal'} · {p.predios} prédio{p.predios === 1 ? '' : 's'} · {dataBR(p.inicio)} a {dataBR(p.fim)}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 flex-none text-[#c9c1c3]" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Relatorios;
