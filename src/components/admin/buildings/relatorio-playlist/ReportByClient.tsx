import React from 'react';
import type { PlaylistReport } from '@/hooks/useGlobalPlaylistReport';

interface Props {
  report: PlaylistReport;
}

const fmtMoney = (v: number | null) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ReportByClient: React.FC<Props> = ({ report }) => {
  if (report.clients.length === 0) {
    return (
      <section className="report-section mt-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Visão por Cliente</h2>
        <div className="text-sm text-slate-500">Nenhum cliente ativo.</div>
      </section>
    );
  }

  return (
    <section className="report-section mt-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">
        Visão por Cliente ({report.clients.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {report.clients.map((c) => (
          <div
            key={c.client_id}
            className="report-card bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 truncate">{c.client_name}</div>
                <div className="text-xs text-slate-500 truncate">{c.client_email}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Vídeos no ar
                </div>
                <div className="text-lg font-semibold text-[#7D1818]">{c.total_videos}</div>
                <div className="text-[10px] text-slate-500">
                  📺 {c.total_videos_h} · 📱 {c.total_videos_v}
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs">
              <div className="text-slate-600 mb-1">
                <span className="font-medium">Prédios ({c.predios.length}):</span>{' '}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.predios.map((p) => (
                  <a
                    key={p.id}
                    href={`#predio-${p.id}`}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-[#C7141A]/10 text-slate-700 rounded-md"
                  >
                    {p.nome}
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-3 border-t pt-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                Pedidos ativos ({c.pedidos.length})
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="text-left font-medium py-0.5">Pedido</th>
                    <th className="text-left font-medium py-0.5">Plano</th>
                    <th className="text-left font-medium py-0.5">Período</th>
                    <th className="text-right font-medium py-0.5">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {c.pedidos.map((p) => (
                    <tr key={p.pedido_id} className="border-t border-slate-100">
                      <td className="py-1 font-mono text-slate-700">{p.pedido_id.slice(0, 8)}…</td>
                      <td className="py-1">{p.plano_meses ? `${p.plano_meses}m` : '—'}</td>
                      <td className="py-1 text-slate-600">
                        {p.data_inicio || '—'} → {p.data_fim || '—'}
                      </td>
                      <td className="py-1 text-right font-medium">{fmtMoney(p.valor_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReportByClient;
