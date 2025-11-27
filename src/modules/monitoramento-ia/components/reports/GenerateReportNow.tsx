import React, { useState, useEffect } from 'react';
import { FileDown, Loader2, FileBarChart, Sparkles, Zap, Brain, TrendingUp, User, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { DateRangePicker } from '../crm/DateRangePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateConversationReportPDF } from '../crm/ConversationReportPDF';

type PeriodType = 'today' | 'yesterday' | '7days' | '30days' | 'custom';

export const GenerateReportNow = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const { toast } = useToast();
  
  // Filtros
  const [period, setPeriod] = useState<PeriodType>('today');
  const [customStart, setCustomStart] = useState<Date>();
  const [customEnd, setCustomEnd] = useState<Date>();
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        break;
      case '7days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
        break;
      case '30days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
        break;
      case 'custom':
        if (!customStart || !customEnd) {
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        } else {
          start = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate(), 0, 0, 0, 0);
          end = new Date(customEnd.getFullYear(), customEnd.getMonth(), customEnd.getDate(), 23, 59, 59, 999);
        }
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    }

    // Ajustar para UTC-3 (America/Sao_Paulo)
    const offset = 3 * 60 * 60 * 1000;
    return {
      startDate: new Date(start.getTime() + offset).toISOString(),
      endDate: new Date(end.getTime() + offset).toISOString(),
    };
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
      const progressPromise = simulateProgress();
      const { startDate, endDate } = getDateRange();

      console.log('[GenerateReportNow] Generating report with filters:', {
        period,
        startDate,
        endDate,
        agent: selectedAgent,
        type: selectedType,
      });

      const { data, error } = await supabase.functions.invoke('generate-ai-report', {
        body: {
          startDate,
          endDate,
          agentKey: selectedAgent !== 'all' ? selectedAgent : undefined,
          contactType: selectedType !== 'all' ? selectedType : undefined,
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
        
        // Usar o novo gerador de PDF visual
        generateConversationReportPDF(
          data.data,
          data.data.aiInsights,
          new Date().toLocaleString('pt-BR')
        );
        
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

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'Hoje';
      case 'yesterday': return 'Ontem';
      case '7days': return 'Últimos 7 dias';
      case '30days': return 'Últimos 30 dias';
      case 'custom': 
        if (customStart && customEnd) {
          return `${customStart.toLocaleDateString('pt-BR')} - ${customEnd.toLocaleDateString('pt-BR')}`;
        }
        return 'Período customizado';
      default: return 'Hoje';
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
              Relatório completo com análise de IA avançada e filtros customizados
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-3 bg-gray-50/50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-[#9C1E1E]" />
            <span className="text-sm font-medium text-gray-700">Filtros do Relatório</span>
          </div>

          {/* Período */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Período</label>
            <DateRangePicker
              period={period}
              onPeriodChange={setPeriod}
              customStart={customStart}
              customEnd={customEnd}
              onCustomDatesChange={(start, end) => {
                setCustomStart(start);
                setCustomEnd(end);
              }}
            />
          </div>

          {/* Atendente */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Atendente</label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="eduardo">Eduardo</SelectItem>
                <SelectItem value="sofia">Sofia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Contato */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Tipo de Contato</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Síndico">Síndicos</SelectItem>
                <SelectItem value="Prestador">Prestadores</SelectItem>
                <SelectItem value="Anunciante">Anunciantes</SelectItem>
                <SelectItem value="Administrativo">Administrativos</SelectItem>
                <SelectItem value="Equipe Exa">Equipe Exa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-[#9C1E1E]/10 to-[#D72638]/10 rounded-xl p-3 border border-[#9C1E1E]/20">
            <p className="text-xs text-[#9C1E1E] font-medium">Período</p>
            <p className="text-xs font-semibold text-gray-900 mt-0.5">{getPeriodLabel()}</p>
          </div>
          <div className="bg-gradient-to-br from-[#9C1E1E]/10 to-[#D72638]/10 rounded-xl p-3 border border-[#9C1E1E]/20">
            <p className="text-xs text-[#9C1E1E] font-medium flex items-center gap-1">
              <User className="w-3 h-3" />
              Atendente
            </p>
            <p className="text-xs font-semibold text-gray-900 mt-0.5 capitalize">
              {selectedAgent === 'all' ? 'Todos' : selectedAgent}
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#9C1E1E]/10 to-[#D72638]/10 rounded-xl p-3 border border-[#9C1E1E]/20">
            <p className="text-xs text-[#9C1E1E] font-medium">Tipo</p>
            <p className="text-xs font-semibold text-gray-900 mt-0.5">
              {selectedType === 'all' ? 'Todos' : selectedType}
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
