import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  Undo2, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface WorkspaceControlToolbarProps {
  onRefreshPreview: () => void;
  onUndo: () => void;
  onAdvanceStep: () => void;
  canUndo: boolean;
  canAdvance: boolean;
  isProcessing?: boolean;
  healthScore: number;
}

export function WorkspaceControlToolbar({
  onRefreshPreview,
  onUndo,
  onAdvanceStep,
  canUndo,
  canAdvance,
  isProcessing,
  healthScore
}: WorkspaceControlToolbarProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-white/80 backdrop-blur-sm border-t border-gray-100">
      <TooltipProvider>
        {/* Refresh Preview */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshPreview}
              disabled={isProcessing}
              className="h-9 px-3 text-gray-600 hover:text-[#9C1E1E] hover:bg-[#9C1E1E]/10 transition-all"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2 text-sm font-medium">Atualizar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-gray-900 text-white border-0">
            <p className="text-xs">Força re-renderização do preview com dados atuais</p>
          </TooltipContent>
        </Tooltip>

        {/* Undo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo || isProcessing}
              className={cn(
                "h-9 px-3 transition-all",
                canUndo 
                  ? "text-gray-600 hover:text-amber-600 hover:bg-amber-50" 
                  : "text-gray-300 cursor-not-allowed"
              )}
            >
              <Undo2 className="h-4 w-4" />
              <span className="ml-2 text-sm font-medium">Desfazer</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-gray-900 text-white border-0">
            <p className="text-xs">
              {canUndo 
                ? 'Reverte a última alteração no contrato' 
                : 'Nenhuma alteração para desfazer'
              }
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Health indicator */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
          healthScore >= 85 
            ? "bg-emerald-50 text-emerald-700" 
            : healthScore >= 50 
              ? "bg-amber-50 text-amber-700"
              : "bg-red-50 text-red-700"
        )}>
          {healthScore >= 85 ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" />
          )}
          <span>{healthScore}%</span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Advance Step */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdvanceStep}
              disabled={!canAdvance || isProcessing}
              className={cn(
                "h-9 px-3 transition-all",
                canAdvance 
                  ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" 
                  : "text-gray-300 cursor-not-allowed"
              )}
            >
              <ArrowRight className="h-4 w-4" />
              <span className="ml-2 text-sm font-medium">Avançar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-gray-900 text-white border-0">
            <p className="text-xs">
              {canAdvance 
                ? 'IA focará na próxima lacuna do contrato' 
                : 'Preencha CNPJ e Nome do parceiro primeiro'
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
