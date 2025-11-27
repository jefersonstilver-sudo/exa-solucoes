import React, { useState } from 'react';
import { FileDown, Loader2, FileBarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const GenerateReportNow = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Simular geração do relatório
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Relatório gerado!",
        description: "O PDF está sendo baixado automaticamente.",
      });
      
      // Aqui você implementaria a lógica real de geração do PDF
      // Por enquanto, apenas simulando
      
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
            <FileBarChart className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Gerar Relatório Agora</h2>
            <p className="text-sm text-gray-600 mt-1">
              Crie um relatório completo das conversas do dia atual e baixe em PDF
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <p className="text-xs text-blue-600 font-medium">Período</p>
            <p className="text-sm font-semibold text-blue-900 mt-0.5">Hoje</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <p className="text-xs text-blue-600 font-medium">Formato</p>
            <p className="text-sm font-semibold text-blue-900 mt-0.5">PDF</p>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando relatório...
            </>
          ) : (
            <>
              <FileDown className="w-5 h-5 mr-2" />
              Baixar PDF do Dia
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
