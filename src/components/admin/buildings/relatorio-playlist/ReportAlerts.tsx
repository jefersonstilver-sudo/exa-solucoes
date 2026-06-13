import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { PlaylistReport } from '@/hooks/useGlobalPlaylistReport';

interface Props {
  report: PlaylistReport;
}

const ReportAlerts: React.FC<Props> = ({ report }) => {
  if (report.alerts.length === 0) {
    return (
      <section className="report-section mt-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Alertas</h2>
        <div className="report-card bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 text-sm">
          ✓ Nenhum alerta no momento. Toda a rede está consistente.
        </div>
      </section>
    );
  }

  return (
    <section className="report-section mt-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">
        Alertas ({report.alerts.length})
      </h2>
      <div className="space-y-2">
        {report.alerts.map((a, i) => {
          const isRed = a.severity === 'red';
          return (
            <div
              key={i}
              className={`report-card rounded-xl border p-3 flex items-start gap-3 ${
                isRed
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isRed ? 'text-[#C7141A]' : 'text-amber-600'}`} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{a.title}</div>
                <div className="text-xs opacity-90 mt-0.5">{a.description}</div>
              </div>
              {a.context?.building_id && (
                <a
                  href={`#predio-${a.context.building_id}`}
                  className="text-xs underline no-print self-center"
                >
                  Ver prédio
                </a>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ReportAlerts;
