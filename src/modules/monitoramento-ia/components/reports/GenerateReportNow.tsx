import React, { useState } from 'react';
import { FileDown, Loader2, FileBarChart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

export const GenerateReportNow = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = (reportData: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Header com gradiente EXA
    doc.setFillColor(156, 30, 30);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Relatório de Conversas IA', margin, 25);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, 35);

    yPos = 55;
    doc.setTextColor(0, 0, 0);

    // Resumo Executivo
    if (reportData.aiInsights?.executiveSummary) {
      doc.setFontSize(16);
      doc.setTextColor(156, 30, 30);
      doc.text('Resumo Executivo', margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const summaryLines = doc.splitTextToSize(
        reportData.aiInsights.executiveSummary,
        pageWidth - 2 * margin
      );
      doc.text(summaryLines, margin, yPos);
      yPos += summaryLines.length * 5 + 10;
    }

    // Métricas Principais
    doc.setFontSize(16);
    doc.setTextColor(156, 30, 30);
    doc.text('Métricas Principais', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de Conversas: ${reportData.metrics?.totalConversations || 0}`, margin, yPos);
    yPos += 7;
    doc.text(`Total de Mensagens: ${reportData.metrics?.totalMessages || 0}`, margin, yPos);
    yPos += 7;
    doc.text(
      `Média por Conversa: ${(reportData.metrics?.averageMessagesPerConv || 0).toFixed(1)}`,
      margin,
      yPos
    );
    yPos += 7;
    doc.text(`Aguardando Resposta: ${reportData.metrics?.awaitingResponse || 0}`, margin, yPos);
    yPos += 15;

    // Insights da IA
    if (reportData.aiInsights?.insights?.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(156, 30, 30);
      doc.text('Insights Principais', margin, yPos);
      yPos += 10;

      reportData.aiInsights.insights.forEach((insight: any, index: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${insight.title}`, margin, yPos);
        yPos += 7;

        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const descLines = doc.splitTextToSize(insight.description, pageWidth - 2 * margin);
        doc.text(descLines, margin + 5, yPos);
        yPos += descLines.length * 4 + 8;
      });
    }

    // Recomendações
    if (reportData.aiInsights?.recommendations?.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(156, 30, 30);
      doc.text('Recomendações', margin, yPos);
      yPos += 10;

      reportData.aiInsights.recommendations.forEach((rec: string, index: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const recLines = doc.splitTextToSize(`• ${rec}`, pageWidth - 2 * margin);
        doc.text(recLines, margin, yPos);
        yPos += recLines.length * 5 + 5;
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${totalPages} - EXA Soluções`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Download
    const fileName = `relatorio-conversas-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      console.log('[GenerateReportNow] Calling edge function...');

      const { data, error } = await supabase.functions.invoke('generate-ai-report', {
        body: {
          startDate: startOfDay,
          endDate: endOfDay,
        },
      });

      if (error) {
        console.error('[GenerateReportNow] Error:', error);
        throw error;
      }

      console.log('[GenerateReportNow] Report data received:', data);

      if (data.success) {
        generatePDF(data.data);
        
        toast({
          title: "✨ Relatório gerado com IA!",
          description: "PDF criado e baixado com insights avançados.",
        });
      } else {
        throw new Error(data.error || 'Erro ao gerar relatório');
      }
      
    } catch (error: any) {
      console.error('[GenerateReportNow] Error:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-all">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-[#9C1E1E] to-[#D72638] rounded-xl shadow-md relative">
            <FileBarChart className="w-6 h-6 text-white relative z-10" />
            <Sparkles className="w-3 h-3 text-yellow-300 absolute top-1 right-1 animate-pulse" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Gerar Relatório Agora</h2>
            <p className="text-sm text-gray-600 mt-1">
              Relatório completo com análise de IA avançada das conversas de hoje
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-[#9C1E1E]/10 to-[#D72638]/10 rounded-xl p-3 border border-[#9C1E1E]/20">
            <p className="text-xs text-[#9C1E1E] font-medium">Período</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">Hoje</p>
          </div>
          <div className="bg-gradient-to-br from-[#9C1E1E]/10 to-[#D72638]/10 rounded-xl p-3 border border-[#9C1E1E]/20">
            <p className="text-xs text-[#9C1E1E] font-medium">Powered by</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D72638]" />
              IA Avançada
            </p>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="w-full h-12 bg-gradient-to-r from-[#9C1E1E] to-[#D72638] hover:from-[#8B1A1A] hover:to-[#C12131] text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando com IA...
            </>
          ) : (
            <>
              <FileDown className="w-5 h-5 mr-2" />
              Baixar PDF com Insights IA
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
