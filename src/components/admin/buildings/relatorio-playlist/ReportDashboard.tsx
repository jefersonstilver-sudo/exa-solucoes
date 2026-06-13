import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import type { PlaylistReport } from '@/hooks/useGlobalPlaylistReport';

interface Props {
  report: PlaylistReport;
}

const Kpi = ({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) => (
  <div className="report-kpi-card bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-4">
    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{label}</div>
    <div className={`text-2xl font-semibold mt-1 ${accent || 'text-slate-900'}`}>{value}</div>
  </div>
);

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
};

const ReportDashboard: React.FC<Props> = ({ report }) => {
  const { kpis, rankings, clients } = report;
  const [openClientes, setOpenClientes] = useState(true);
  const [openPredios, setOpenPredios] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  const pedidosByClient = useMemo(() => {
    const m = new Map<string, typeof clients[number]['pedidos']>();
    for (const c of clients) m.set(c.client_id, c.pedidos);
    return m;
  }, [clients]);

  const toggleClient = (id: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };


  return (
    <section className="report-section mt-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">Dashboard</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Kpi label="Prédios ativos" value={kpis.totalPredios} />
        <Kpi label="Clientes ativos" value={kpis.totalClientes} />
        <Kpi label="Pedidos ativos" value={kpis.totalPedidos} />
        <Kpi label="Tempo médio (dias)" value={kpis.tempoMedioDias} />
        <Kpi label="Vídeos totais" value={kpis.totalVideos} accent="text-[#7D1818]" />
        <Kpi label="📺 Horizontais" value={kpis.totalVideosH} />
        <Kpi label="📱 Verticais" value={kpis.totalVideosV} />
        <Kpi
          label="Alertas"
          value={kpis.totalAlertas}
          accent={kpis.totalAlertas > 0 ? 'text-[#C7141A]' : 'text-slate-900'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        <div className="report-card bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-4">
          <button
            type="button"
            onClick={() => setOpenClientes((v) => !v)}
            className="w-full flex items-center justify-between mb-2 text-left"
          >
            <h3 className="text-sm font-semibold text-slate-700">
              Clientes por nº de prédios{' '}
              <span className="text-slate-400 font-normal">({rankings.topClientes.length})</span>
            </h3>
            {openClientes ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>
          {openClientes && (
            <div className="max-h-[420px] overflow-y-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-1.5 px-2 font-medium">#</th>
                    <th className="py-1.5 px-2 font-medium">Cliente</th>
                    <th className="py-1.5 px-2 font-medium text-right">Prédios</th>
                    <th className="py-1.5 px-2 font-medium text-right">Vídeos</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.topClientes.length === 0 && (
                    <tr><td colSpan={4} className="py-3 text-slate-400 text-center">Sem dados</td></tr>
                  )}
                  {rankings.topClientes.map((c, i) => {
                    const pedidos = pedidosByClient.get(c.client_id) || [];
                    const isOpen = expandedClients.has(c.client_id);
                    return (
                      <React.Fragment key={c.client_id}>
                        <tr
                          className="border-b last:border-0 hover:bg-slate-50 cursor-pointer"
                          onClick={() => toggleClient(c.client_id)}
                        >
                          <td className="py-1.5 px-2 text-slate-500">{i + 1}</td>
                          <td className="py-1.5 px-2 text-slate-800">
                            <span className="inline-flex items-center gap-1">
                              {pedidos.length > 0 ? (
                                isOpen ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                )
                              ) : (
                                <span className="w-3.5 h-3.5 inline-block" />
                              )}
                              {c.nome}
                              {pedidos.length > 0 && (
                                <span className="ml-1 text-[10px] text-slate-400">
                                  ({pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'})
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-right font-medium">{c.predios_count}</td>
                          <td className="py-1.5 px-2 text-right text-slate-600">{c.videos_count}</td>
                        </tr>
                        {isOpen && pedidos.length > 0 && (
                          <tr className="bg-slate-50/60">
                            <td colSpan={4} className="px-2 pb-2">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-left text-slate-400">
                                    <th className="py-1 px-2 font-medium w-8">#</th>
                                    <th className="py-1 px-2 font-medium">Pedido</th>
                                    <th className="py-1 px-2 font-medium">Início</th>
                                    <th className="py-1 px-2 font-medium text-right">Prédios</th>
                                    <th className="py-1 px-2 font-medium text-right">Vídeos</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pedidos.map((p, j) => (
                                    <tr key={p.pedido_id} className="border-t border-slate-200/60">
                                      <td className="py-1 px-2 text-slate-400">{j + 1}</td>
                                      <td className="py-1 px-2 text-slate-700 font-mono">
                                        {p.pedido_id.slice(0, 8)}…
                                        {p.plano_meses ? (
                                          <span className="ml-2 text-[10px] text-slate-400">
                                            {p.plano_meses}m
                                          </span>
                                        ) : null}
                                      </td>
                                      <td className="py-1 px-2 text-slate-600">{fmtDate(p.data_inicio)}</td>
                                      <td className="py-1 px-2 text-right font-medium text-slate-700">
                                        {p.predios_count}
                                      </td>
                                      <td className="py-1 px-2 text-right text-slate-600">
                                        {p.videos_count}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="report-card bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-4">
          <button
            type="button"
            onClick={() => setOpenPredios((v) => !v)}
            className="w-full flex items-center justify-between mb-2 text-left"
          >
            <h3 className="text-sm font-semibold text-slate-700">
              Prédios por nº de vídeos ativos{' '}
              <span className="text-slate-400 font-normal">({rankings.topPredios.length})</span>
            </h3>
            {openPredios ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>
          {openPredios && (
            <div className="max-h-[420px] overflow-y-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-1.5 px-2 font-medium">#</th>
                    <th className="py-1.5 px-2 font-medium">Prédio</th>
                    <th className="py-1.5 px-2 font-medium text-right">Vídeos</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.topPredios.length === 0 && (
                    <tr><td colSpan={3} className="py-3 text-slate-400 text-center">Sem dados</td></tr>
                  )}
                  {rankings.topPredios.map((b, i) => (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-1.5 px-2 text-slate-500">{i + 1}</td>
                      <td className="py-1.5 px-2 text-slate-800">
                        <a href={`#predio-${b.id}`} className="hover:text-[#C7141A]">
                          {b.nome}
                        </a>
                      </td>
                      <td className="py-1.5 px-2 text-right font-medium">{b.videos_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReportDashboard;
