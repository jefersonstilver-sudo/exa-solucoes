import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, FileText, Users, CheckCircle, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

interface ReportData {
  total_conversas: number;
  resolvidas: number;
  pendentes: number;
  tempo_medio_atendimento: string;
  taxa_resolucao: number;
  evolution_30_days: Array<{ date: string; count: number }>;
  sentiment_distribution: { positivo: number; neutro: number; negativo: number };
  contact_types_distribution: Array<{ type: string; count: number }>;
  hot_leads: Array<{
    contact_name: string;
    contact_type: string;
    score: number;
    last_message_at: string;
  }>;
  ai_analysis: {
    summary: string;
    patterns: string[];
    anomalies: string[];
    recommendations: string[];
  };
  period_start: string;
  period_end: string;
  contact_types_filter?: string[];
}

export const RelatorioPublicoPage = () => {
  const { reportId } = useParams();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_reports')
        .select('report_data, period_start, period_end, contact_types')
        .eq('id', reportId)
        .single();

      if (error) throw error;
      setReportData(data.report_data as unknown as ReportData);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast.error('Relatório não encontrado ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    toast.info('Gerando PDF...');
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`relatorio-${reportId}.pdf`);
    toast.success('PDF exportado!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Relatório não encontrado</h2>
          <p className="text-gray-500">Este relatório pode ter expirado ou não existe.</p>
        </div>
      </div>
    );
  }

  // Configurações dos gráficos - Estilo Apple minimalista cinza
  const evolutionChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      sparkline: { enabled: false },
    },
    colors: ['#374151'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.05,
      }
    },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      categories: reportData.evolution_30_days.map(d => 
        new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      ),
      labels: { style: { colors: '#9CA3AF', fontSize: '11px' } }
    },
    yaxis: { labels: { style: { colors: '#9CA3AF', fontSize: '11px' } } },
    grid: { borderColor: '#E5E7EB', strokeDashArray: 3 },
    tooltip: { theme: 'dark' },
    dataLabels: { enabled: false },
  };

  const sentimentChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    colors: ['#6B7280', '#9CA3AF', '#D1D5DB'],
    labels: ['Positivo', 'Neutro', 'Negativo'],
    legend: { position: 'bottom', labels: { colors: '#6B7280' } },
    dataLabels: { enabled: true, style: { colors: ['#FFFFFF'], fontSize: '12px' } },
    plotOptions: { pie: { donut: { size: '70%' } } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header Mobile-First */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                📊 Relatório de Atendimento
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {new Date(reportData.period_start).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {new Date(reportData.period_end).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            <Button
              onClick={exportToPDF}
              size="sm"
              className="bg-gray-900 hover:bg-gray-800 text-white gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </div>
      </div>

      <div id="report-content" className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPIs - Grid Responsivo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {[
            { icon: Users, label: 'Conversas', value: reportData.total_conversas },
            { icon: CheckCircle, label: 'Resolvidas', value: reportData.resolvidas },
            { icon: TrendingUp, label: 'Taxa Resolução', value: `${reportData.taxa_resolucao.toFixed(1)}%` },
            { icon: Clock, label: 'Tempo Médio', value: reportData.tempo_medio_atendimento },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <kpi.icon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{kpi.value}</div>
              <div className="text-xs text-gray-500">{kpi.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Gráfico de Evolução */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-4 sm:p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Evolução nos Últimos 30 Dias
          </h3>
          <div className="-mx-2">
            <ReactApexChart
              options={evolutionChartOptions}
              series={[{
                name: 'Conversas',
                data: reportData.evolution_30_days.map(d => d.count)
              }]}
              type="area"
              height={250}
            />
          </div>
        </motion.div>

        {/* Sentimento - Mobile Friendly */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-4 sm:p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Distribuição de Sentimento
          </h3>
          <div className="flex justify-center">
            <ReactApexChart
              options={sentimentChartOptions}
              series={[
                reportData.sentiment_distribution.positivo,
                reportData.sentiment_distribution.neutro,
                reportData.sentiment_distribution.negativo
              ]}
              type="donut"
              height={280}
            />
          </div>
        </motion.div>

        {/* Análise IA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">🤖</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Análise IA</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 text-sm mb-2">Resumo Executivo</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{reportData.ai_analysis.summary}</p>
            </div>
            
            {reportData.ai_analysis.patterns.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 text-sm mb-2">Padrões Detectados</h4>
                <ul className="space-y-2">
                  {reportData.ai_analysis.patterns.map((pattern, i) => (
                    <li key={i} className="text-gray-600 text-sm flex gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>{pattern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.ai_analysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 text-sm mb-2">Recomendações</h4>
                <ul className="space-y-2">
                  {reportData.ai_analysis.recommendations.map((rec, i) => (
                    <li key={i} className="text-gray-600 text-sm flex gap-2">
                      <span className="text-gray-400 mt-0.5">💡</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>

        {/* Hot Leads - Mobile Optimized */}
        {reportData.hot_leads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-4 sm:p-6"
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              🔥 Hot Leads
            </h3>
            <div className="space-y-3">
              {reportData.hot_leads.slice(0, 5).map((lead, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{lead.contact_name}</p>
                    <p className="text-xs text-gray-500">{lead.contact_type}</p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <span className="px-2 py-1 bg-gray-900 text-white rounded-full text-xs font-medium">
                      {lead.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center py-6 text-xs text-gray-400">
          <p>Relatório gerado por EXA Mídia • {new Date().toLocaleDateString('pt-BR')}</p>
          <p className="mt-1">Este link expira em 30 dias</p>
        </div>
      </div>
    </div>
  );
};

export default RelatorioPublicoPage;
