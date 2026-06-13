import React from 'react';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { PlaylistReport } from '@/hooks/useGlobalPlaylistReport';

interface Props {
  report: PlaylistReport;
}

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');

const ReportActiveOrders: React.FC<Props> = ({ report }) => {
  const [open, setOpen] = React.useState(false);
  const orders = report.activeOrders || [];
  if (orders.length === 0) return null;

  return (
    <section className="report-section report-active-orders mt-6">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          className="w-full flex items-center justify-between gap-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 px-4 py-3 hover:bg-white transition print:hidden"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-[#7D1818]/10 rounded-xl">
              <Package className="h-5 w-5 text-[#7D1818]" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-sm font-semibold text-slate-900">
                Pedidos ativos ({orders.length})
              </div>
              <div className="text-[11px] text-slate-500">
                Clique para {open ? 'recolher' : 'expandir'} a lista completa
              </div>
            </div>
          </div>
          {open ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </CollapsibleTrigger>

        {/* Print: sempre visível */}
        <div className="hidden print:block">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Pedidos ativos ({orders.length})
          </h2>
        </div>

        <CollapsibleContent forceMount className="print:!block data-[state=closed]:hidden print:data-[state=closed]:!block">
          <div className="mt-3 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3">
            <div className="max-h-[420px] overflow-y-auto print:max-h-none print:overflow-visible">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-1.5 font-semibold">Pedido</th>
                    <th className="text-left px-2 py-1.5 font-semibold">Cliente</th>
                    <th className="text-left px-2 py-1.5 font-semibold">Plano</th>
                    <th className="text-left px-2 py-1.5 font-semibold">Período</th>
                    <th className="text-center px-2 py-1.5 font-semibold">Prédios</th>
                    <th className="text-center px-2 py-1.5 font-semibold">📺 H</th>
                    <th className="text-center px-2 py-1.5 font-semibold">📱 V</th>
                    <th className="text-center px-2 py-1.5 font-semibold">Total</th>
                    <th className="text-center px-2 py-1.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr
                      key={o.pedido_id}
                      className="border-t border-slate-100 odd:bg-white even:bg-slate-50/50"
                    >
                      <td className="px-2 py-1.5 font-mono text-[10px] text-slate-600">
                        {o.pedido_id.slice(0, 8)}…
                      </td>
                      <td className="px-2 py-1.5 max-w-[220px]">
                        <div className="text-slate-800 truncate">{o.client_name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{o.client_email}</div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {o.plano_meses ? `${o.plano_meses}m` : '—'}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-slate-700">
                        <div>{fmtDate(o.data_inicio)}</div>
                        <div className="text-slate-500">→ {fmtDate(o.data_fim)}</div>
                      </td>
                      <td className="px-2 py-1.5 text-center font-medium">{o.predios_count}</td>
                      <td className="px-2 py-1.5 text-center">{o.videos_h}</td>
                      <td className="px-2 py-1.5 text-center">{o.videos_v}</td>
                      <td className="px-2 py-1.5 text-center font-semibold text-[#7D1818]">
                        {o.videos_total}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {o.has_display ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border bg-[#7D1818]/10 text-[#7D1818] border-[#7D1818]/20">
                            Em exibição
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border bg-red-100 text-red-700 border-red-200">
                            Sem vídeo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
};

export default ReportActiveOrders;
