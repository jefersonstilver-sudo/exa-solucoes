import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Download, Maximize2, FileText, Image as ImageIcon,
  TrendingUp, Users, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppleCard, AppleMetricCard } from '@/design-system';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

interface ReportData {
  // KPIs
  total_conversas: number;
  resolvidas: number;
  pendentes: number;
  tempo_medio_atendimento: string;
  taxa_resolucao: number;
  
  // Evolução 30 dias
  evolution_30_days: Array<{ date: string; count: number }>;
  
  // Sentimento
  sentiment_distribution: { positivo: number; neutro: number; negativo: number };
  
  // Tipos de contato
  contact_types_distribution: Array<{ type: string; count: number }>;
  
  // Hot leads
  hot_leads: Array<{
    contact_name: string;
    contact_phone: string;
    contact_type: string;
    score: number;
    last_message_at: string;
  }>;
  
  // Análise IA
  ai_analysis: {
    summary: string;
    patterns: string[];
    anomalies: string[];
    recommendations: string[];
  };
  
  // Metadados
  period_start: string;
  period_end: string;
  contact_types_filter?: string[];
  agent_key: string;
}

export const RelatorioVARPage = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      toast.error('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    toast.info('Gerando PDF...');
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`relatorio-var-${reportId}.pdf`);
    toast.success('PDF exportado!');
  };

  const exportToJPG = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    toast.info('Gerando imagem...');
    const canvas = await html2canvas(element);
    const link = document.createElement('a');
    link.download = `relatorio-var-${reportId}.jpg`;
    link.href = canvas.toDataURL('image/jpeg');
    link.click();
    toast.success('Imagem exportada!');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Relatório não encontrado</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Voltar</Button>
        </div>
      </div>
    );
  }

  // Configurações dos gráficos ApexCharts - Estilo Apple cinza
  const evolutionChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    colors: ['#374151'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    xaxis: {
      categories: reportData.evolution_30_days.map(d => new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })),
      labels: { style: { colors: '#6B7280' } }
    },
    yaxis: {
      labels: { style: { colors: '#6B7280' } }
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 3,
    },
    tooltip: {
      theme: 'dark',
    }
  };

  const sentimentChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    colors: ['#6B7280', '#9CA3AF', '#D1D5DB'],
    labels: ['Positivo', 'Neutro', 'Negativo'],
    legend: {
      position: 'bottom',
      labels: { colors: '#6B7280' }
    },
    dataLabels: {
      enabled: true,
      style: { colors: ['#FFFFFF'] }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%'
        }
      }
    }
  };

  const contactTypesChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    colors: ['#6B7280'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
      }
    },
    xaxis: {
      categories: reportData.contact_types_distribution.map(c => c.type),
      labels: { style: { colors: '#6B7280' } }
    },
    yaxis: {
      labels: { style: { colors: '#6B7280' } }
    },
    grid: {
      borderColor: '#E5E7EB',
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Relatório de Conversas
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(reportData.period_start).toLocaleDateString('pt-BR')} - {new Date(reportData.period_end).toLocaleDateString('pt-BR')}
                  {reportData.contact_types_filter && reportData.contact_types_filter.length > 0 && (
                    <span className="ml-2">• Filtro: {reportData.contact_types_filter.join(', ')}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                className="text-gray-600 hover:text-gray-900"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToJPG}
                className="text-gray-600 hover:text-gray-900"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                JPG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="text-gray-600 hover:text-gray-900"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        <div id="report-content" className="space-y-6">
          {/* KPIs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <AppleMetricCard
              title="Total de Conversas"
              value={reportData.total_conversas}
              icon={Users}
              iconColor="text-gray-400"
            />
            <AppleMetricCard
              title="Resolvidas"
              value={reportData.resolvidas}
              icon={CheckCircle}
              iconColor="text-gray-400"
            />
            <AppleMetricCard
              title="Taxa de Resolução"
              value={`${reportData.taxa_resolucao.toFixed(1)}%`}
              icon={TrendingUp}
              iconColor="text-gray-400"
            />
            <AppleMetricCard
              title="Tempo Médio"
              value={reportData.tempo_medio_atendimento}
              icon={Clock}
              iconColor="text-gray-400"
            />
          </motion.div>

          {/* Gráfico de Evolução */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AppleCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Evolução nos Últimos 30 Dias
              </h3>
              <ReactApexChart
                options={evolutionChartOptions}
                series={[{
                  name: 'Conversas',
                  data: reportData.evolution_30_days.map(d => d.count)
                }]}
                type="area"
                height={300}
              />
            </AppleCard>
          </motion.div>

          {/* Sentimento e Tipos de Contato */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <AppleCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Distribuição de Sentimento
              </h3>
              <ReactApexChart
                options={sentimentChartOptions}
                series={[
                  reportData.sentiment_distribution.positivo,
                  reportData.sentiment_distribution.neutro,
                  reportData.sentiment_distribution.negativo
                ]}
                type="donut"
                height={300}
              />
            </AppleCard>

            <AppleCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Tipos de Contato
              </h3>
              <ReactApexChart
                options={contactTypesChartOptions}
                series={[{
                  name: 'Conversas',
                  data: reportData.contact_types_distribution.map(c => c.count)
                }]}
                type="bar"
                height={300}
              />
            </AppleCard>
          </motion.div>

          {/* Análise IA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <AppleCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🤖</span>
                </div>
                Análise IA
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Resumo Executivo</h4>
                  <p className="text-gray-600 dark:text-gray-400">{reportData.ai_analysis.summary}</p>
                </div>
                
                {reportData.ai_analysis.patterns.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Padrões Detectados</h4>
                    <ul className="space-y-1">
                      {reportData.ai_analysis.patterns.map((pattern, i) => (
                        <li key={i} className="text-gray-600 dark:text-gray-400 flex gap-2">
                          <span className="text-gray-400">•</span>
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {reportData.ai_analysis.anomalies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Anomalias</h4>
                    <ul className="space-y-1">
                      {reportData.ai_analysis.anomalies.map((anomaly, i) => (
                        <li key={i} className="text-gray-600 dark:text-gray-400 flex gap-2">
                          <span className="text-gray-400">⚠️</span>
                          {anomaly}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {reportData.ai_analysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Recomendações</h4>
                    <ul className="space-y-1">
                      {reportData.ai_analysis.recommendations.map((rec, i) => (
                        <li key={i} className="text-gray-600 dark:text-gray-400 flex gap-2">
                          <span className="text-gray-400">💡</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AppleCard>
          </motion.div>

          {/* Hot Leads */}
          {reportData.hot_leads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <AppleCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Hot Leads
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Nome</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Score</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Tipo</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Última Interação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.hot_leads.map((lead, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{lead.contact_name}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                              {lead.score}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{lead.contact_type}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(lead.last_message_at).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AppleCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelatorioVARPage;
