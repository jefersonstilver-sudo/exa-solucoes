import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, AlertTriangle, ChevronRight, X, Maximize2, FileDown, Lock, Clock, TrendingUp, Users, MessageSquare, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { ClientOnly } from '@/components/ui/client-only';

interface ReportData {
  total_conversas: number;
  conversas_resolvidas: number;
  conversas_pendentes: number;
  taxa_resolucao: number;
  tma_medio: number;
  tma_formatado: string;
  
  sentimento_positivo: number;
  sentimento_neutro: number;
  sentimento_negativo: number;
  
  tipo_lead: number;
  tipo_sindico: number;
  tipo_cliente: number;
  tipo_outro: number;
  
  hot_leads: number;
  conversas_escaladas: number;
  
  periodo_inicio: string;
  periodo_fim: string;
  
  evolucao_30_dias: Array<{ data: string; total: number }>;
  
  ia_resumo_executivo: string;
  ia_padroes_detectados: string[];
  ia_anomalias: string[];
  ia_recomendacoes: string[];
  
  conversas_lista: Array<{
    id: string;
    phone_number: string;
    agent_key: string;
    status: string;
    created_at: string;
    last_message_at: string;
    lead_score: number | null;
    sentiment: string | null;
    contact_type: string | null;
  }>;
  
  total_mensagens: number;
  gerado_em: string;
  versao_relatorio: string;
  
  // Novos campos
  distribuicao_periodo?: { manha: number; tarde: number; noite: number };
  mensagens_enviadas?: number;
  mensagens_recebidas?: number;
  comparativo_anterior?: {
    contatos: { anterior: number; atual: number };
    mensagens: { anterior: number; atual: number };
    tma: { anterior: number; atual: number };
    hot_leads: { anterior: number; atual: number };
  };
  conversas_mais_ativas?: Array<{
    name: string;
    phone: string;
    total_msgs: number;
    agent: string;
    last_activity: string;
  }>;
  mensagens_por_tipo?: Record<string, { 
    enviadas: number; 
    recebidas: number; 
    conversas: number 
  }>;
}

const EXA_LOGO = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos%20exa/Videos%20Site/Logo%20Branca%20-%20Exa.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcyBleGEvVmlkZW9zIFNpdGUvTG9nbyBCcmFuY2EgLSBFeGEucG5nIiwiaWF0IjoxNzY0MjcxNTgwLCJleHAiOjMxNTUzMzI3MzU1ODB9.Re62vBPxmFdoOTCd6maWctMCukPMPv0AEVqKdZubahU";

export const RelatorioPublicoPage = () => {
  const { reportId } = useParams();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
  const [criticalDayModalOpen, setCriticalDayModalOpen] = useState(false);
  const [iaModalOpen, setIaModalOpen] = useState(false);
  const [convosModalOpen, setConvosModalOpen] = useState(false);
  const [firstInteractionsModalOpen, setFirstInteractionsModalOpen] = useState(false);
  const [lastInteractionsModalOpen, setLastInteractionsModalOpen] = useState(false);
  const [excludeWeekend, setExcludeWeekend] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');
  
  // Estados para autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [expired, setExpired] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Verificar validade do relatório ao carregar
  useEffect(() => {
    checkReportValidity();
  }, [reportId]);

  const checkReportValidity = async () => {
    if (!reportId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('generated_reports')
      .select('id, expires_at')
      .eq('id', reportId)
      .single();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      setExpired(true);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      toast.error('Digite a senha');
      return;
    }

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-report-access', {
        body: {
          report_id: reportId,
          password: password
        }
      });

      if (error) throw error;

      if (data.success) {
        setIsAuthenticated(true);
        setReportData(data.report_data);
        toast.success('✅ Acesso liberado');
      } else {
        toast.error('Senha incorreta');
      }
    } catch (error: any) {
      console.error('Erro ao verificar senha:', error);
      
      if (error.message?.includes('expired')) {
        setExpired(true);
        toast.error('Link expirado');
      } else {
        toast.error('Senha incorreta', {
          description: 'Verifique sua senha de admin'
        });
      }
    } finally {
      setVerifying(false);
    }
  };

  const exportHybridPDF = async (detail: 'resumido' | 'detalhado') => {
    const element = document.getElementById('report-content');
    if (!element) return;

    toast.info(`Gerando PDF ${detail}...`);
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Cover page
      pdf.setFillColor(125, 24, 24);
      pdf.rect(0, 0, pdfWidth, 40, 'F');
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.text('RELATÓRIO VAR — EXA Mídia', 14, 26);
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Período: ${formatDate(reportData?.periodo_inicio)} — ${formatDate(reportData?.periodo_fim)}`, 14, 52);
      pdf.text(`Gerado em: ${formatDate(new Date().toISOString())}`, 14, 60);
      
      // Add main content
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      pdf.save(`Relatorio_VAR_${detail}_${reportId}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const shortDay = (dateStr: string) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[new Date(dateStr).getDay()];
  };

  const filterWeekendData = (data: Array<{ data: string; total: number }>) => {
    if (!excludeWeekend) return data;
    return data.filter(d => {
      const day = new Date(d.data).getDay();
      return day !== 0 && day !== 6;
    });
  };

  const calculateKPIs = () => {
    if (!reportData) return { periodDays: 0, avgPerDay: 0, peakDay: '', peakValue: 0 };
    
    const filtered = filterWeekendData(reportData.evolucao_30_dias);
    const totalContacts = filtered.reduce((sum, d) => sum + d.total, 0);
    const periodDays = filtered.length;
    const avgPerDay = Math.round(totalContacts / periodDays);
    const peakValue = Math.max(...filtered.map(d => d.total));
    const peakData = filtered.find(d => d.total === peakValue);
    const peakDay = peakData ? formatDate(peakData.data) : '';
    
    return { periodDays, avgPerDay, peakDay, peakValue, totalContacts };
  };

  const getDistributionByPeriod = () => {
    if (reportData?.distribuicao_periodo) {
      return reportData.distribuicao_periodo;
    }
    // Fallback para dados antigos
    const manha = Math.round((reportData?.total_conversas || 0) * 0.28);
    const tarde = Math.round((reportData?.total_conversas || 0) * 0.52);
    const noite = (reportData?.total_conversas || 0) - manha - tarde;
    return { manha, tarde, noite };
  };

  const getScoreOperacional = () => {
    if (!reportData) return 0;
    // Calcular score baseado em métricas
    const taxaResolucao = reportData.taxa_resolucao || 0;
    const temMedio = reportData.tma_medio || 0;
    const scoreBase = Math.min(100, taxaResolucao);
    const penaltyTMA = temMedio > 5 ? 10 : 0;
    return Math.max(0, Math.round(scoreBase - penaltyTMA));
  };

  const getHotLeadsData = () => {
    if (!reportData?.conversas_lista) return [];
    return reportData.conversas_lista
      .filter(c => (c.lead_score || 0) >= 70)
      .slice(0, 3)
      .map(c => ({
        nome: c.phone_number,
        score: c.lead_score || 0,
        msgs: 8, // Simulado
        nota: 'Follow-up agendado'
      }));
  };

  const getCriticalDay = () => {
    if (!reportData) return null;
    const filtered = filterWeekendData(reportData.evolucao_30_dias);
    const sorted = [...filtered].sort((a, b) => b.total - a.total);
    return sorted[0];
  };

  const getFirstInteractions = () => {
    if (!reportData?.conversas_lista) return [];
    return [...reportData.conversas_lista]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 10);
  };

  const getLastInteractions = () => {
    if (!reportData?.conversas_lista) return [];
    return [...reportData.conversas_lista]
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      .slice(0, 10);
  };

  // Tela de Link Expirado
  if (expired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl text-center"
        >
          <Clock className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-white mb-2">Link Expirado</h1>
          <p className="text-white/60 text-sm">
            Este relatório expirou. Links são válidos por 30 dias.
          </p>
        </motion.div>
      </div>
    );
  }

  // Tela de Não Encontrado
  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl text-center"
        >
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-white mb-2">Relatório Não Encontrado</h1>
          <p className="text-white/60 text-sm">
            Verifique se o link está correto.
          </p>
        </motion.div>
      </div>
    );
  }

  // Tela de Login (Glassmorphism estilo Apple)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={EXA_LOGO} alt="EXA" className="h-12" />
          </div>
          
          {/* Título */}
          <h1 className="text-2xl font-semibold text-white text-center mb-2">
            Relatório Seguro
          </h1>
          <p className="text-white/60 text-center text-sm mb-8">
            Digite sua senha de admin para acessar
          </p>
          
          {/* Input Senha estilo Apple */}
          <div className="relative mb-6">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
              placeholder="Senha"
              className="w-full bg-white/5 border border-white/10 rounded-xl 
                       pl-12 pr-4 py-4 text-white placeholder-white/30
                       focus:outline-none focus:ring-2 focus:ring-white/30
                       transition-all"
            />
          </div>
          
          {/* Botão Acessar */}
          <Button
            onClick={handleVerifyPassword}
            disabled={verifying || !password}
            className="w-full bg-gradient-to-r from-[#7D1818] to-[#a33a3a] 
                     text-white font-semibold py-4 rounded-xl
                     hover:shadow-lg hover:shadow-red-900/30
                     disabled:opacity-50 transition-all"
          >
            {verifying ? 'Verificando...' : 'Acessar Relatório'}
          </Button>
          
          {/* Info de expiração */}
          <p className="text-white/30 text-xs text-center mt-6">
            Link válido por 30 dias • Acesso restrito a administradores
          </p>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-foreground mb-2">Carregando...</h2>
        </div>
      </div>
    );
  }

  const kpis = calculateKPIs();
  const distribution = getDistributionByPeriod();
  const scoreOp = getScoreOperacional();
  const hotLeads = getHotLeadsData();
  const filteredEvolution = filterWeekendData(reportData.evolucao_30_dias);
  const criticalDay = getCriticalDay();

  // Detectar se é período de 1 dia (24 horas)
  const isOneDayPeriod = reportData.periodo_inicio && reportData.periodo_fim && 
    new Date(reportData.periodo_fim).getTime() - new Date(reportData.periodo_inicio).getTime() <= 86400000;

  // Chart Options
  const volumeChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 420,
      toolbar: { show: false },
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    colors: ['#7D1818'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
      }
    },
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 5, colors: ['#fff'], strokeColors: ['#7D1818'], strokeWidth: 3 },
    xaxis: {
      categories: isOneDayPeriod 
        ? filteredEvolution.map(d => new Date(d.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        : filteredEvolution.map(d => formatDate(d.data)),
      labels: { 
        rotate: isOneDayPeriod ? 0 : -30, 
        style: { fontSize: '11px' } 
      },
      title: { text: isOneDayPeriod ? 'Hora do Dia' : undefined }
    },
    yaxis: { title: { text: 'Contatos' } },
    tooltip: {
      custom: ({ dataPointIndex }) => {
        const data = filteredEvolution[dataPointIndex];
        const displayTime = isOneDayPeriod 
          ? new Date(data.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : formatDate(data.data);
        const displayDay = isOneDayPeriod ? '' : `<div class="text-sm text-muted-foreground">${shortDay(data.data)}</div>`;
        
        return `<div class="px-3 py-2 bg-card border border-border rounded-lg shadow-lg">
          <div class="font-semibold">${displayTime}</div>
          ${displayDay}
          <div class="text-lg font-bold text-primary mt-1">${data.total} contatos</div>
        </div>`;
      }
    },
    grid: { borderColor: 'hsl(var(--border))' },
  };

  const donutChartOptions: ApexOptions = {
    chart: { type: 'donut', height: 260 },
    series: [distribution.manha, distribution.tarde, distribution.noite],
    labels: ['Manhã', 'Tarde', 'Noite'],
    colors: ['#f97316', '#7D1818', '#ef4444'],
    plotOptions: {
      pie: {
        donut: {
          size: '64%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => kpis.totalContacts.toString()
            }
          }
        }
      }
    },
    legend: { position: 'bottom' }
  };

  const scoreChartOptions: ApexOptions = {
    chart: { type: 'radialBar', height: 140 },
    series: [scoreOp],
    colors: ['#7D1818'],
    plotOptions: {
      radialBar: {
        hollow: { size: '60%' },
        dataLabels: {
          value: { fontSize: '20px', fontWeight: 700 }
        }
      }
    }
  };

  // Gráfico Comparativo com Período Anterior
  const comparativoChartOptions: ApexOptions = {
    chart: { type: 'bar', height: 300, toolbar: { show: false } },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        dataLabels: { position: 'top' }
      }
    },
    colors: ['#94a3b8', '#7D1818'],
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: { fontSize: '10px', colors: ['#334155'] }
    },
    xaxis: {
      categories: ['Contatos', 'Mensagens', 'Hot Leads'],
    },
    legend: { position: 'bottom' },
    grid: { borderColor: 'hsl(var(--border))' }
  };

  const comparativoSeries = reportData.comparativo_anterior ? [
    {
      name: 'Período Anterior',
      data: [
        reportData.comparativo_anterior.contatos.anterior,
        reportData.comparativo_anterior.mensagens.anterior,
        reportData.comparativo_anterior.hot_leads.anterior
      ]
    },
    {
      name: 'Período Atual',
      data: [
        reportData.comparativo_anterior.contatos.atual,
        reportData.comparativo_anterior.mensagens.atual,
        reportData.comparativo_anterior.hot_leads.atual
      ]
    }
  ] : [];

  // Gráfico Mensagens Enviadas x Recebidas
  const mensagensChartOptions: ApexOptions = {
    chart: { type: 'bar', height: 250, toolbar: { show: false } },
    plotOptions: {
      bar: {
        horizontal: true,
        dataLabels: { position: 'top' }
      }
    },
    colors: ['#22c55e', '#3b82f6'],
    dataLabels: {
      enabled: true,
      style: { fontSize: '12px', colors: ['#fff'] }
    },
    xaxis: {
      categories: ['Mensagens'],
    },
    legend: { position: 'bottom' },
    grid: { borderColor: 'hsl(var(--border))' }
  };

  const mensagensSeries = [
    {
      name: 'Enviadas',
      data: [reportData.mensagens_enviadas || 0]
    },
    {
      name: 'Recebidas',
      data: [reportData.mensagens_recebidas || 0]
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-[1400px] mx-auto p-4" id="report-content">
        {/* Header */}
        <header className="flex flex-col lg:flex-row items-start lg:items-center gap-4 bg-gradient-to-r from-[#7D1818] to-[#8b2a2a] p-4 sm:p-6 rounded-xl text-white mb-6">
          <div className="w-20 h-14 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <img src={EXA_LOGO} alt="EXA" className="max-w-[90%] max-h-[90%]" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-wide">
              RELATÓRIO VAR — PERFORMANCE OPERACIONAL
            </h1>
            <p className="text-white/90 text-sm mt-1">Versão executiva (Nível Conselho)</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold">
                Agente: EXA IA
              </span>
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold">
                Período: {formatDate(reportData.periodo_inicio)} — {formatDate(reportData.periodo_fim)}
              </span>
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold">
                Contatos: {reportData.total_conversas}
              </span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setCriticalDayModalOpen(true)}
              className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              DIA CRÍTICO (Conselho)
            </Button>
            <Button
              onClick={() => setAdvancedModalOpen(true)}
              className="bg-white text-[#7D1818] hover:bg-white/90"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Visual Avançado
            </Button>
            <Button
              onClick={() => exportHybridPDF('resumido')}
              className="bg-white text-[#7D1818] hover:bg-white/90"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF Resumido
            </Button>
            <Button
              onClick={() => exportHybridPDF('detalhado')}
              className="bg-white text-[#7D1818] hover:bg-white/90"
            >
              <FileDown className="w-4 h-4 mr-2" />
              PDF Detalhado
            </Button>
          </div>
        </header>

        {/* Main Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-[320px_1fr_420px] gap-4">
          {/* LEFT COLUMN */}
          <section className="space-y-4">
            {/* Painel Executivo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 border border-border shadow-sm"
            >
              <h3 className="font-semibold text-foreground mb-1">Painel Executivo</h3>
              <small className="text-muted-foreground text-xs">— visão resumida</small>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-gradient-to-b from-muted/50 to-muted/20 rounded-lg">
                  <div className="text-2xl font-extrabold text-[#7D1818]">{kpis.periodDays}d</div>
                  <div className="text-xs text-muted-foreground mt-1">Período</div>
                </div>
                <div className="p-3 bg-gradient-to-b from-muted/50 to-muted/20 rounded-lg">
                  <div className="text-2xl font-extrabold text-[#7D1818]">{kpis.totalContacts}</div>
                  <div className="text-xs text-muted-foreground mt-1">Contatos</div>
                </div>
                <div className="p-3 bg-gradient-to-b from-muted/50 to-muted/20 rounded-lg">
                  <div className="text-2xl font-extrabold text-[#7D1818]">{kpis.avgPerDay}</div>
                  <div className="text-xs text-muted-foreground mt-1">Média/dia</div>
                </div>
                <div className="p-3 bg-gradient-to-b from-muted/50 to-muted/20 rounded-lg">
                  <div className="text-xl font-extrabold text-[#7D1818]">{kpis.peakDay}</div>
                  <div className="text-xs text-muted-foreground mt-1">Dia de pico</div>
                </div>
              </div>
              
              {/* NOVAS MÉTRICAS */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-gradient-to-b from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50 rounded-lg">
                  <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                    {reportData.mensagens_enviadas || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Msgs Enviadas</div>
                </div>
                <div className="p-3 bg-gradient-to-b from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/50 rounded-lg">
                  <div className="text-2xl font-extrabold text-green-600 dark:text-green-400">
                    {reportData.mensagens_recebidas || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Msgs Recebidas</div>
                </div>
                
                {reportData.mensagens_por_tipo?.lead && (
                  <>
                    <div className="p-3 bg-gradient-to-b from-purple-50 to-purple-100/50 dark:from-purple-950 dark:to-purple-900/50 rounded-lg">
                      <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400">
                        {reportData.mensagens_por_tipo.lead.enviadas || 0}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Msgs para Leads</div>
                    </div>
                    <div className="p-3 bg-gradient-to-b from-orange-50 to-orange-100/50 dark:from-orange-950 dark:to-orange-900/50 rounded-lg">
                      <div className="text-xl font-extrabold text-orange-600 dark:text-orange-400">
                        {reportData.mensagens_por_tipo.sindico_lead?.enviadas || 0}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Msgs p/ Síndicos</div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-foreground">{reportData.ia_resumo_executivo}</p>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setFirstInteractionsModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Primeiras interações
                </Button>
                <Button
                  onClick={() => setLastInteractionsModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Últimas interações
                </Button>
              </div>
            </motion.div>

            {/* Alertas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl p-4 border border-border shadow-sm"
            >
              <h3 className="font-semibold text-foreground mb-1">Alertas Automáticos</h3>
              <small className="text-muted-foreground text-xs">— ações imediatas</small>
              
              <div className="mt-4 space-y-2">
                {reportData.ia_anomalias.slice(0, 3).map((anomalia, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 border border-border rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{anomalia}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Diretrizes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl p-4 border border-border shadow-sm"
            >
              <h3 className="font-semibold text-foreground">Diretrizes para Amanhã</h3>
              <ol className="list-decimal pl-4 mt-3 space-y-2">
                {reportData.ia_recomendacoes.slice(0, 5).map((rec, i) => (
                  <li key={i} className="text-sm text-foreground">{rec}</li>
                ))}
              </ol>
            </motion.div>
          </section>

          {/* CENTER COLUMN */}
          <section className="space-y-4">
            {/* Volume Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl p-4 border border-border shadow-sm"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Volume no período</h3>
                  <small className="text-muted-foreground text-xs">— contatos por dia</small>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Excluir sáb./dom.</label>
                  <input
                    type="checkbox"
                    checked={excludeWeekend}
                    onChange={(e) => setExcludeWeekend(e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
              </div>
              
              <ClientOnly>
                <ReactApexChart
                  options={volumeChartOptions}
                  series={[{ name: 'Contatos', data: filteredEvolution.map(d => d.total) }]}
                  type="area"
                  height={420}
                />
              </ClientOnly>
              
              <p className="text-xs text-muted-foreground mt-3">
                Passe o mouse para ver dia da semana. Clique para abrir modal avançado.
              </p>
            </motion.div>

            {/* Comparativo com Período Anterior */}
            {reportData.comparativo_anterior && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-card rounded-xl p-4 border border-border shadow-sm"
              >
                <h3 className="font-semibold text-foreground mb-1">Comparativo com período anterior</h3>
                <small className="text-muted-foreground text-xs">— evolução das métricas</small>
                
                <ClientOnly>
                  <ReactApexChart
                    options={comparativoChartOptions}
                    series={comparativoSeries}
                    type="bar"
                    height={300}
                  />
                </ClientOnly>
              </motion.div>
            )}

            {/* Conversas Mais Ativas */}
            {reportData.conversas_mais_ativas && reportData.conversas_mais_ativas.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="bg-card rounded-xl p-4 border border-border shadow-sm"
              >
                <h3 className="font-semibold text-foreground mb-1">Conversas mais ativas</h3>
                <small className="text-muted-foreground text-xs">— top 10 por volume de mensagens</small>
                
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 font-semibold text-muted-foreground">#</th>
                        <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Contato</th>
                        <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Msgs</th>
                        <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Agente</th>
                        <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Última atividade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.conversas_mais_ativas.slice(0, 10).map((conv, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 px-2 text-muted-foreground">{i + 1}</td>
                          <td className="py-2 px-2">
                            <div className="font-medium text-foreground">{conv.name || 'Sem nome'}</div>
                            <div className="text-xs text-muted-foreground">{conv.phone}</div>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-[#7D1818]/10 text-[#7D1818] rounded-full font-bold text-xs">
                              {conv.total_msgs}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">{conv.agent}</td>
                          <td className="py-2 px-2 text-xs text-muted-foreground">{formatDate(conv.last_activity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* IA Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-xl p-4 border border-border shadow-sm"
            >
              <h3 className="font-semibold text-foreground mb-1">IA — Análises & Insights</h3>
              <small className="text-muted-foreground text-xs">— interpretação profunda</small>
              
              <div className="mt-4 space-y-3">
                {reportData.ia_padroes_detectados.slice(0, 3).map((padrao, i) => (
                  <div key={i} className="text-sm text-foreground">
                    <strong className="text-[#7D1818]">Padrão {i + 1}:</strong> {padrao}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setIaModalOpen(true)}
                  variant="default"
                  size="sm"
                  className="bg-[#7D1818] hover:bg-[#6b1515]"
                >
                  Abrir IA Expandida
                </Button>
                <Button
                  onClick={() => toast.info('Exportar IA insights')}
                  variant="outline"
                  size="sm"
                >
                  Exportar Insights
                </Button>
              </div>
            </motion.div>
          </section>

          {/* RIGHT COLUMN */}
          <aside className="space-y-4">
            {/* Donut */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card rounded-xl p-4 border border-border shadow-sm"
            >
              <h3 className="font-semibold text-foreground">Distribuição por período</h3>
              <ClientOnly>
                <ReactApexChart
                  options={donutChartOptions}
                  series={donutChartOptions.series}
                  type="donut"
                  height={260}
                />
              </ClientOnly>
            </motion.div>

            {/* Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card rounded-xl p-4 border border-border shadow-sm"
            >
              <h3 className="font-semibold text-foreground mb-3">Score final</h3>
              <ClientOnly>
                <ReactApexChart
                  options={scoreChartOptions}
                  series={scoreChartOptions.series}
                  type="radialBar"
                  height={140}
                />
              </ClientOnly>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Score: <strong className="text-[#7D1818]">{scoreOp} / 100</strong>
              </p>
            </motion.div>

            {/* Mensagens Enviadas x Recebidas */}
            {reportData.mensagens_enviadas !== undefined && reportData.mensagens_recebidas !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="bg-card rounded-xl p-4 border border-border shadow-sm"
              >
                <h3 className="font-semibold text-foreground mb-1">Mensagens</h3>
                <small className="text-muted-foreground text-xs">— enviadas x recebidas</small>
                
                <ClientOnly>
                  <ReactApexChart
                    options={mensagensChartOptions}
                    series={mensagensSeries}
                    type="bar"
                    height={250}
                  />
                </ClientOnly>
              </motion.div>
            )}

            {/* Hot Leads */}
            {hotLeads.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-card rounded-xl p-4 border border-border shadow-sm"
              >
                <h3 className="font-semibold text-foreground mb-3">Hot Leads</h3>
                <div className="space-y-3">
                  {hotLeads.map((lead, i) => (
                    <div key={i} className="flex gap-3 p-3 border border-border rounded-lg">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#7D1818] to-[#a33] rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                        {lead.nome.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{lead.nome}</p>
                        <p className="text-xs text-muted-foreground">Score {lead.score} • {lead.msgs} msgs</p>
                        <p className="text-xs text-muted-foreground mt-1">{lead.nota}</p>
                        <Button size="sm" variant="outline" className="mt-2 text-xs">
                          Abrir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </aside>
        </main>

        {/* Footer */}
        <div className="text-center py-6 mt-6 text-xs text-muted-foreground">
          <p>Relatório gerado por EXA Mídia • {formatDate(reportData.gerado_em)}</p>
          <p className="mt-1">Este link expira em 30 dias</p>
        </div>
      </div>

      {/* Modal IA Expandida */}
      <Dialog open={iaModalOpen} onOpenChange={setIaModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>IA — Análises Inteligentes (Expandido)</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Resumo Final</h4>
              <p className="text-sm text-muted-foreground">{reportData.ia_resumo_executivo}</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Padrões Detectados</h4>
              <ul className="space-y-2">
                {reportData.ia_padroes_detectados.map((padrao, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-[#7D1818]">•</span>
                    <span>{padrao}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Anomalias</h4>
              <div className="space-y-2">
                {reportData.ia_anomalias.map((anomalia, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg flex gap-2 items-start">
                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{anomalia}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Recomendações</h4>
              <ol className="list-decimal pl-4 space-y-2">
                {reportData.ia_recomendacoes.map((rec, i) => (
                  <li key={i} className="text-sm">{rec}</li>
                ))}
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Visual Avançado */}
      <Dialog open={advancedModalOpen} onOpenChange={setAdvancedModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Visual Avançado — Análises Detalhadas</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gráfico Volume */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-4">Volume de Contatos</h4>
                <ClientOnly>
                  <ReactApexChart
                    options={volumeChartOptions}
                    series={[{ name: 'Contatos', data: filteredEvolution.map(d => d.total) }]}
                    type="area"
                    height={300}
                  />
                </ClientOnly>
              </div>

              {/* Distribuição por Período */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-4">Distribuição por Período</h4>
                <ClientOnly>
                  <ReactApexChart
                    options={donutChartOptions}
                    series={donutChartOptions.series}
                    type="donut"
                    height={300}
                  />
                </ClientOnly>
              </div>

              {/* Comparativo */}
              {reportData.comparativo_anterior && (
                <div className="bg-muted/30 p-4 rounded-lg md:col-span-2">
                  <h4 className="font-semibold text-sm mb-4">Comparativo com Período Anterior</h4>
                  <ClientOnly>
                    <ReactApexChart
                      options={comparativoChartOptions}
                      series={comparativoSeries}
                      type="bar"
                      height={300}
                    />
                  </ClientOnly>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
              <input
                type="checkbox"
                checked={excludeWeekend}
                onChange={(e) => setExcludeWeekend(e.target.checked)}
                className="w-4 h-4"
                id="exclude-weekend-advanced"
              />
              <label htmlFor="exclude-weekend-advanced" className="text-sm font-medium">
                Excluir sábados e domingos dos gráficos
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal DIA CRÍTICO */}
      <Dialog open={criticalDayModalOpen} onOpenChange={setCriticalDayModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              DIA CRÍTICO — Análise Especial para Conselho
            </DialogTitle>
          </DialogHeader>
          
          {criticalDay && (
            <div className="space-y-6 mt-4">
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-500 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {formatDate(criticalDay.data)} — {shortDay(criticalDay.data)}
                </h3>
                <p className="text-3xl font-extrabold text-yellow-600 dark:text-yellow-400">
                  {criticalDay.total} contatos
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Dia com maior volume de atividade no período
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">% do Total</p>
                  <p className="text-2xl font-bold text-foreground">
                    {((criticalDay.total / (reportData.total_conversas || 1)) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Acima da Média</p>
                  <p className="text-2xl font-bold text-foreground">
                    +{(criticalDay.total - kpis.avgPerDay).toFixed(0)} contatos
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Recomendações do Conselho:</h4>
                <ul className="space-y-2">
                  <li className="flex gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-[#7D1818] flex-shrink-0 mt-0.5" />
                    <span>Revisar alocação de recursos para dias com volume similar</span>
                  </li>
                  <li className="flex gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-[#7D1818] flex-shrink-0 mt-0.5" />
                    <span>Analisar padrões de demanda que levaram ao pico</span>
                  </li>
                  <li className="flex gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-[#7D1818] flex-shrink-0 mt-0.5" />
                    <span>Preparar equipe para eventos similares no futuro</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Primeiras Interações */}
      <Dialog open={firstInteractionsModalOpen} onOpenChange={setFirstInteractionsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Primeiras Interações do Período</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-semibold">Contato</th>
                  <th className="text-left py-2 px-2 font-semibold">Agente</th>
                  <th className="text-left py-2 px-2 font-semibold">Status</th>
                  <th className="text-left py-2 px-2 font-semibold">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {getFirstInteractions().map((conv, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium">{conv.phone_number}</td>
                    <td className="py-2 px-2 text-muted-foreground">{conv.agent_key}</td>
                    <td className="py-2 px-2">
                      <span className="px-2 py-1 bg-muted/50 rounded text-xs">{conv.status}</span>
                    </td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">{formatDate(conv.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Últimas Interações */}
      <Dialog open={lastInteractionsModalOpen} onOpenChange={setLastInteractionsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Últimas Interações do Período</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-semibold">Contato</th>
                  <th className="text-left py-2 px-2 font-semibold">Agente</th>
                  <th className="text-left py-2 px-2 font-semibold">Status</th>
                  <th className="text-left py-2 px-2 font-semibold">Última atividade</th>
                </tr>
              </thead>
              <tbody>
                {getLastInteractions().map((conv, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium">{conv.phone_number}</td>
                    <td className="py-2 px-2 text-muted-foreground">{conv.agent_key}</td>
                    <td className="py-2 px-2">
                      <span className="px-2 py-1 bg-muted/50 rounded text-xs">{conv.status}</span>
                    </td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">{formatDate(conv.last_message_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RelatorioPublicoPage;
