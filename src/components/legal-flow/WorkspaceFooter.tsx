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
  const missingScore = 85 - healthScore;

  return (
    <div className="flex-shrink-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        {/* Left side - Secondary actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="text-gray-600"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">Salvar Rascunho</span>
            <span className="sm:hidden">Salvar</span>
          </Button>

          {onPreviewPDF && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreviewPDF}
              className="text-gray-600 hidden sm:flex"
            >
              <FileText className="h-4 w-4 mr-2" />
              Visualizar PDF
            </Button>
          )}

          {onDownloadDraft && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownloadDraft}
              className="text-gray-600 hidden sm:flex"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Minuta
            </Button>
          )}
        </div>

        {/* Center - Status message */}
        <div className="flex-1 flex justify-center">
          {canFinalize ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Pronto para envio!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">
                Faltam {missingScore}% para liberar envio
              </span>
              <span className="sm:hidden">
                +{missingScore}% necessário
              </span>
            </div>
          )}
        </div>

        {/* Right side - Primary action */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  onClick={onFinalize}
                  disabled={!canFinalize || isSubmitting}
                  className={`
                    min-w-[160px] transition-all duration-300
                    ${canFinalize 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/25' 
                      : 'bg-gray-300 cursor-not-allowed'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Finalizar e Enviar</span>
                      <span className="sm:hidden">Enviar</span>
                    </>
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            {!canFinalize && (
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">
                  O contrato precisa ter um Health Score de pelo menos 85% para ser enviado. 
                  Complete os campos obrigatórios através da conversa com a IA.
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
