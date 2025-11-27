import React, { useState } from 'react';
import { FileDown, Loader2, FileBarChart, Sparkles, Zap, Brain, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';

export const GenerateReportNow = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
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

  const simulateProgress = async () => {
    const steps = [
      { progress: 15, text: 'Conectando com IA...', duration: 500 },
      { progress: 30, text: 'Buscando conversas...', duration: 800 },
      { progress: 50, text: 'Analisando dados...', duration: 1000 },
      { progress: 70, text: 'Gerando insights com IA...', duration: 1500 },
      { progress: 85, text: 'Criando visualizações...', duration: 700 },
      { progress: 95, text: 'Finalizando relatório...', duration: 500 },
    ];

    for (const step of steps) {
      setProgress(step.progress);
      setCurrentStep(step.text);
      await new Promise(resolve => setTimeout(resolve, step.duration));
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setProgress(0);
    setCurrentStep('Iniciando...');
    
    try {
      // Simular progresso
      const progressPromise = simulateProgress();

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

      await progressPromise;

      if (error) {
        console.error('[GenerateReportNow] Error:', error);
        throw error;
      }

      console.log('[GenerateReportNow] Report data received:', data);

      if (data.success) {
        setProgress(100);
        setCurrentStep('Concluído!');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
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
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        setCurrentStep('');
      }, 1000);
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

        {/* Progress Animation */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 py-2"
            >
              {/* Animated Icons */}
              <div className="flex justify-center gap-3 mb-4">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Brain className="w-6 h-6 text-[#9C1E1E]" />
                </motion.div>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                  }}
                >
                  <Zap className="w-6 h-6 text-[#D72638]" />
                </motion.div>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, -360],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.6,
                  }}
                >
                  <TrendingUp className="w-6 h-6 text-[#9C1E1E]" />
                </motion.div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 font-medium">{currentStep}</span>
                  <span className="text-[#9C1E1E] font-bold">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#9C1E1E] to-[#D72638]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Pulsing Dots */}
              <div className="flex justify-center gap-2 pt-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-[#9C1E1E] rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="w-full h-12 bg-gradient-to-r from-[#9C1E1E] to-[#D72638] hover:from-[#8B1A1A] hover:to-[#C12131] text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70"
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
