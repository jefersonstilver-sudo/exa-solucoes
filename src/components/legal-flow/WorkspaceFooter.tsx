import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Save, 
  Send, 
  FileText, 
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface WorkspaceFooterProps {
  canFinalize: boolean;
  healthScore: number;
  isSaving?: boolean;
  isSubmitting?: boolean;
  onSave: () => void;
  onFinalize: () => void;
  onPreviewPDF?: () => void;
  onDownloadDraft?: () => void;
}

export function WorkspaceFooter({
  canFinalize,
  healthScore,
  isSaving,
  isSubmitting,
  onSave,
  onFinalize,
  onPreviewPDF,
  onDownloadDraft
}: WorkspaceFooterProps) {
  const missingScore = Math.max(0, 85 - healthScore);

  return (
    <div className={cn(
      "flex-shrink-0 sticky bottom-0 z-50",
      "bg-white/80 backdrop-blur-md border-t border-gray-200/60",
      "shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
    )}>
      <div className="flex items-center justify-between px-6 py-4 gap-4 max-w-full">
        {/* Left side - Secondary actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onSave}
            disabled={isSaving}
            className="h-11 px-5 rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2 text-gray-500" />
            )}
            <span className="font-medium text-gray-700">Salvar Rascunho</span>
          </Button>

          {onPreviewPDF && (
            <Button
              variant="ghost"
              onClick={onPreviewPDF}
              className="h-11 px-4 rounded-xl text-gray-600 hover:bg-gray-100 hidden lg:flex"
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="font-medium">Visualizar PDF</span>
            </Button>
          )}

          {onDownloadDraft && (
            <Button
              variant="ghost"
              onClick={onDownloadDraft}
              className="h-11 px-4 rounded-xl text-gray-600 hover:bg-gray-100 hidden lg:flex"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="font-medium">Baixar Minuta</span>
            </Button>
          )}
        </div>

        {/* Center - Status message */}
        <div className="flex-1 flex justify-center min-w-0">
          {canFinalize ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium text-emerald-700 whitespace-nowrap">Pronto para envio!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm font-medium text-amber-700 whitespace-nowrap">
                Faltam {missingScore}% para liberar envio
              </span>
            </div>
          )}
        </div>

        {/* Right side - Primary action */}
        <div className="flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onFinalize}
                  disabled={!canFinalize || isSubmitting}
                  className={cn(
                    "h-12 px-8 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg",
                    canFinalize 
                      ? "bg-gradient-to-r from-[#9C1E1E] to-[#B40D1A] hover:from-[#8B1A1A] hover:to-[#A30C18] shadow-[#9C1E1E]/25 hover:shadow-[#9C1E1E]/40 hover:scale-[1.02]" 
                      : "bg-gray-300 cursor-not-allowed shadow-none"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      <span>Finalizar e Enviar</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              {!canFinalize && (
                <TooltipContent side="top" className="max-w-xs bg-gray-900 text-white border-0 rounded-xl px-4 py-3">
                  <p className="text-sm">
                    Complete os campos obrigatórios para atingir 85% de Health Score.
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
