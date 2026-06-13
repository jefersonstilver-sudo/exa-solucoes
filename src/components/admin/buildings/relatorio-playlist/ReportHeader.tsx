import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Printer, FileText } from 'lucide-react';

interface Props {
  generatedAt: string;
  userLabel: string;
  totalPredios: number;
  totalVideos: number;
  totalAlertas: number;
  loading: boolean;
  onRefresh: () => void;
}

const ReportHeader: React.FC<Props> = ({
  generatedAt,
  userLabel,
  totalPredios,
  totalVideos,
  totalAlertas,
  loading,
  onRefresh,
}) => {
  const ts = new Date(generatedAt).toLocaleString('pt-BR');
  return (
    <div className="report-section">
      <div className="bg-gradient-to-r from-[#7D1818] to-[#9C1E1E] text-white rounded-2xl shadow-2xl p-6 md:p-8 print:rounded-none print:shadow-none print:bg-white print:text-black">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 print:bg-transparent print:border print:border-black">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Relatório de Playlist em Exibição
              </h1>
              <p className="text-sm text-white/85 print:text-black mt-1">
                EXA Mídia — Auditoria operacional e jurídica · Gerado em {ts}
              </p>
              <p className="text-xs text-white/70 print:text-black mt-0.5">
                Por: {userLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <Button
              variant="secondary"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="bg-white text-[#7D1818] hover:bg-white/90 border-0"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar dados
            </Button>
            <Button
              size="sm"
              onClick={() => window.print()}
              className="bg-[#C7141A] hover:bg-[#B40D1A] text-white"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div className="bg-white/10 print:bg-white print:border print:border-black rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider opacity-80">Prédios em exibição</div>
            <div className="text-xl font-semibold">{totalPredios}</div>
          </div>
          <div className="bg-white/10 print:bg-white print:border print:border-black rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider opacity-80">Vídeos no ar</div>
            <div className="text-xl font-semibold">{totalVideos}</div>
          </div>
          <div className="bg-white/10 print:bg-white print:border print:border-black rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider opacity-80">Alertas</div>
            <div className="text-xl font-semibold">{totalAlertas}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportHeader;
