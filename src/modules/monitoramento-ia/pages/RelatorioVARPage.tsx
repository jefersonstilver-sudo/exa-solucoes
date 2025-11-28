import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Maximize2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useRelatorioVAR } from '../hooks/useRelatorioVAR';
import { RelatorioVARData } from '../types/relatorio-var';
import ReactApexChart from 'react-apexcharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export const RelatorioVARPage = () => {
  const { gerarRelatorio, loading } = useRelatorioVAR();
  const [data, setData] = useState<RelatorioVARData | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    loadRelatorio();
  }, []);

  const loadRelatorio = async () => {
    try {
      const relatorio = await gerarRelatorio({
        periodo_tipo: 'ultimos-30',
        agent_key: 'eduardo',
        diretores_ids: []
      });
      setData(relatorio);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    }
  };

  const exportarPDF = async () => {
    try {
      toast.info('Gerando PDF...');
      const elemento = document.getElementById('relatorio-container');
      if (!elemento) return;

      const canvas = await html2canvas(elemento, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`relatorio-var-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const exportarJPG = async () => {
    try {
      toast.info('Gerando imagem...');
      const elemento = document.getElementById('relatorio-container');
      if (!elemento) return;

      const canvas = await html2canvas(elemento, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `relatorio-var-${new Date().toISOString().split('T')[0]}.jpg`;
        link.href = url;
        link.click();
        toast.success('Imagem gerada com sucesso!');
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Erro ao gerar JPG:', error);
      toast.error('Erro ao gerar imagem');
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  const renderVariacao = (valor: number) => {
    if (valor > 0) return <Badge className="bg-green-100 text-green-800"><TrendingUp className="w-3 h-3 mr-1" />+{valor}%</Badge>;
    if (valor < 0) return <Badge className="bg-red-100 text-red-800"><TrendingDown className="w-3 h-3 mr-1" />{valor}%</Badge>;
    return <Badge className="bg-gray-100 text-gray-800"><Minus className="w-3 h-3 mr-1" />0%</Badge>;
  };

  // Configurações dos gráficos ApexCharts
  const evolucaoOptions = {
    chart: { type: 'area' as const, toolbar: { show: false }, animations: { enabled: true } },
    colors: ['#9C1E1E', '#D72638'],
    stroke: { curve: 'smooth' as const, width: 2 },
    fill: { type: 'gradient' as const, gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
    xaxis: { categories: data.evolucao_30d.map(d => d.data) },
    yaxis: { title: { text: 'Quantidade' } },
    tooltip: { theme: 'dark' },
    legend: { position: 'top' as const }
  };

  const evolucaoSeries = [
    { name: 'Conversas', data: data.evolucao_30d.map(d => d.conversas) },
    { name: 'Mensagens', data: data.evolucao_30d.map(d => d.mensagens) }
  ];

  const sentimentoOptions = {
    chart: { type: 'donut' as const },
    colors: ['#10b981', '#6b7280', '#ef4444'],
    labels: ['Positivo', 'Neutro', 'Negativo'],
    legend: { position: 'bottom' as const },
    plotOptions: { pie: { donut: { size: '70%' } } }
  };

  const sentimentoSeries = [data.sentimento_positivo, data.sentimento_neutro, data.sentimento_negativo];

  const tipoContatoOptions = {
    chart: { type: 'bar' as const, toolbar: { show: false } },
    colors: ['#9C1E1E'],
    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    xaxis: { categories: ['Novo', 'Retorno', 'VIP', 'Problema'] }
  };

  const tipoContatoSeries = [{
    name: 'Contatos',
    data: [data.tipo_novo, data.tipo_retorno, data.tipo_vip, data.tipo_problema]
  }];

  return (
    <div className={`${fullscreen ? 'fixed inset-0 z-50 bg-background overflow-auto' : ''} p-4 md:p-6`}>
      <div id="relatorio-container" className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#9C1E1E] to-[#D72638] bg-clip-text text-transparent">
              📊 Relatório VAR — EXA
            </h1>
            <p className="text-muted-foreground">
              {new Date(data.periodo.inicio).toLocaleDateString('pt-BR')} - {new Date(data.periodo.fim).toLocaleDateString('pt-BR')}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={exportarPDF} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button onClick={exportarJPG} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              JPG
            </Button>
            <Button onClick={() => setFullscreen(!fullscreen)} variant="outline" size="sm">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.total_conversas}</div>
              {renderVariacao(data.comparativo.conversas_variacao)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Mensagens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.total_mensagens}</div>
              {renderVariacao(data.comparativo.mensagens_variacao)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa Resolução</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.taxa_resolucao}%</div>
              {renderVariacao(data.comparativo.resolucao_variacao)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">TMA Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.tma_geral}</div>
              {renderVariacao(data.comparativo.tma_variacao)}
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📈 Evolução 30 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ReactApexChart options={evolucaoOptions} series={evolucaoSeries} type="area" height={300} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>😊 Distribuição de Sentimento</CardTitle>
            </CardHeader>
            <CardContent>
              <ReactApexChart options={sentimentoOptions} series={sentimentoSeries} type="donut" height={300} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>👥 Tipos de Contato</CardTitle>
            </CardHeader>
            <CardContent>
              <ReactApexChart options={tipoContatoOptions} series={tipoContatoSeries} type="bar" height={300} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🤖 Insights da IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Resumo Executivo</p>
                <p className="text-sm text-muted-foreground">{data.ia_insights.resumo_executivo}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Score de Qualidade</p>
                <div className="text-3xl font-bold text-primary">{data.ia_insights.score_qualidade}/100</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hot Leads */}
        <Card>
          <CardHeader>
            <CardTitle>🔥 Hot Leads ({data.hot_leads.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.hot_leads.map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{lead.nome}</p>
                    <p className="text-sm text-muted-foreground">{lead.telefone}</p>
                  </div>
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500">
                    Score: {lead.score}/100
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Padrões e Recomendações */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📊 Padrões Detectados</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.ia_insights.padroes_detectados.map((padrao, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span className="text-sm">{padrao}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>💡 Recomendações</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.ia_insights.recomendacoes.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default RelatorioVARPage;
