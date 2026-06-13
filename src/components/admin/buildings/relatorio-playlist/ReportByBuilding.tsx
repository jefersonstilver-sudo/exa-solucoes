import React from 'react';
import { Building2, Play, QrCode } from 'lucide-react';
import type { PlaylistReport, ReportBuilding, ReportVideoRow } from '@/hooks/useGlobalPlaylistReport';

interface Props {
  report: PlaylistReport;
}

const fmtMoney = (v: number | null) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');

const StatusBadge = ({ s }: { s: string }) => {
  const map: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };
  const cls = map[s] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${cls}`}>
      {s}
    </span>
  );
};

const VideoTable = ({
  title,
  rows,
  emoji,
}: {
  title: string;
  rows: ReportVideoRow[];
  emoji: string;
}) => {
  if (rows.length === 0) {
    return (
      <div className="text-xs text-slate-400 italic px-3 py-2">
        {emoji} {title}: nenhum vídeo em exibição
      </div>
    );
  }
  return (
    <div className="mt-3">
      <div className="text-sm font-semibold text-slate-700 mb-1.5 px-1">
        {emoji} {title} ({rows.length})
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="text-left px-2 py-1.5 font-semibold">Vídeo</th>
              <th className="text-left px-2 py-1.5 font-semibold">Cliente</th>
              <th className="text-left px-2 py-1.5 font-semibold">Pedido</th>
              <th className="text-left px-2 py-1.5 font-semibold">Período</th>
              <th className="text-right px-2 py-1.5 font-semibold">Valor</th>
              <th className="text-center px-2 py-1.5 font-semibold">Dur.</th>
              <th className="text-center px-2 py-1.5 font-semibold">Slot</th>
              <th className="text-center px-2 py-1.5 font-semibold">Dias no ar</th>
              <th className="text-left px-2 py-1.5 font-semibold">Agendamento</th>
              <th className="text-center px-2 py-1.5 font-semibold">QR</th>
              <th className="text-center px-2 py-1.5 font-semibold">Status</th>
              <th className="text-center px-2 py-1.5 font-semibold no-print">▶</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.pedido_video_id} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/50">
                <td className="px-2 py-1.5 max-w-[200px]">
                  <div className="font-medium text-slate-900 truncate">{r.video_nome}</div>
                </td>
                <td className="px-2 py-1.5 max-w-[180px]">
                  <div className="text-slate-800 truncate">{r.client_name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{r.client_email}</div>
                </td>
                <td className="px-2 py-1.5 font-mono text-[10px] text-slate-600">
                  <div>{r.pedido_id.slice(0, 8)}…</div>
                  <div className="text-slate-500">{r.plano_meses ? `${r.plano_meses}m` : ''}</div>
                </td>
                <td className="px-2 py-1.5 text-slate-700 whitespace-nowrap">
                  <div>{fmtDate(r.data_inicio)}</div>
                  <div className="text-slate-500">→ {fmtDate(r.data_fim)}</div>
                </td>
                <td className="px-2 py-1.5 text-right font-medium whitespace-nowrap">
                  {fmtMoney(r.valor_total)}
                </td>
                <td className="px-2 py-1.5 text-center">
                  {r.video_duracao ? `${r.video_duracao}s` : '—'}
                </td>
                <td className="px-2 py-1.5 text-center">{r.slot_position}</td>
                <td className="px-2 py-1.5 text-center font-semibold text-[#7D1818]">
                  {r.dias_em_exibicao}d
                </td>
                <td className="px-2 py-1.5 text-slate-700 max-w-[160px]">
                  <span className="text-[11px]">{r.schedule_summary}</span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  {r.qr_enabled ? (
                    <span title={r.qr_url || ''} className="inline-flex items-center text-emerald-700">
                      <QrCode className="h-3 w-3" />
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <StatusBadge s={r.approval_status} />
                </td>
                <td className="px-2 py-1.5 text-center no-print">
                  {r.video_url ? (
                    <a
                      href={r.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-[#C7141A] hover:underline"
                    >
                      <Play className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BuildingBlock = ({ b }: { b: ReportBuilding }) => (
  <article
    id={`predio-${b.id}`}
    className="report-section report-building-section bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-4 mb-4"
  >
    <header className="report-building-header flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="p-2 bg-[#7D1818]/10 rounded-xl">
          <Building2 className="h-5 w-5 text-[#7D1818]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900 truncate">
            {b.nome}
            {b.codigo && <span className="ml-2 text-xs text-slate-500 font-normal">#{b.codigo}</span>}
          </h3>
          <p className="text-xs text-slate-500 truncate">
            {[b.bairro, b.endereco].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs whitespace-nowrap">
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
          {b.status}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
          {b.quantidade_telas} telas
        </span>
        <span
          className={`px-2 py-0.5 rounded-md ${
            b.online
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {b.online_label}
        </span>
      </div>
    </header>

    <VideoTable title="Vídeos Horizontais" rows={b.videosH} emoji="📺" />
    <VideoTable title="Vídeos Verticais" rows={b.videosV} emoji="📱" />
  </article>
);

const ReportByBuilding: React.FC<Props> = ({ report }) => {
  if (report.buildings.length === 0) {
    return (
      <section className="report-section mt-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Visão por Prédio</h2>
        <div className="text-sm text-slate-500">Nenhum prédio elegível.</div>
      </section>
    );
  }

  const withVideos = report.buildings.filter((b) => b.videosH.length + b.videosV.length > 0);
  const withoutVideos = report.buildings.filter((b) => b.videosH.length + b.videosV.length === 0);

  return (
    <section className="report-section mt-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">
        Visão por Prédio ({report.buildings.length})
      </h2>

      {withVideos.map((b) => (
        <BuildingBlock key={b.id} b={b} />
      ))}

      {withoutVideos.length > 0 && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <div className="font-semibold mb-1">
            {withoutVideos.length} prédio(s) elegível(eis) sem nenhum vídeo em exibição:
          </div>
          <ul className="list-disc list-inside text-xs space-y-0.5">
            {withoutVideos.map((b) => (
              <li key={b.id}>
                <a href={`#predio-${b.id}`} className="underline">{b.nome}</a>{' '}
                <span className="text-amber-700">({b.status})</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-3">
            {withoutVideos.map((b) => (
              <BuildingBlock key={b.id} b={b} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ReportByBuilding;
