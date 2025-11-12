/**
 * Botão flutuante para abrir painel de debug
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ContextualDebugPanel } from './ContextualDebugPanel';
import { GlobalDebugDashboard } from './GlobalDebugDashboard';
import { AIGeneratedDebugPanel } from './AIGeneratedDebugPanel';
import { AIAnalysisProgressModal } from './AIAnalysisProgressModal';
import { useDebugContext } from '@/contexts/DebugContext';
import { useAIDebug } from '@/hooks/useAIDebug';
import { AIDebugService } from '@/services/debug/AIDebugService';

export const FloatingDebugButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showGlobal, setShowGlobal] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [debugAIEnabled, setDebugAIEnabled] = useState(false);
  const [, forceUpdate] = useState({});
  
  const { isDebugMode, isDebugAuthorized, userEmail } = useDebugContext();
  const { isAnalyzing, progress, currentStep, analysis, analyzeCurrentPage } = useAIDebug();

  useEffect(() => {
    AIDebugService.isDebugAIEnabled().then(setDebugAIEnabled);
  }, []);

  useEffect(() => {
    if (analysis) {
      setShowAIPanel(true);
    }
  }, [analysis]);

  // Só mostra se:
  // 1. Está em dev OU
  // 2. Debug mode ativado E usuário autorizado
  const shouldShow = import.meta.env.DEV || (isDebugMode && isDebugAuthorized);
  
  // Log de debug (apenas em dev)
  if (import.meta.env.DEV) {
    console.log('🐛 [FLOATING DEBUG] Status:', {
      isDebugMode,
      isDebugAuthorized,
      userEmail,
      shouldShow
    });
  }

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setShowGlobal(false);
      setShowAIPanel(false);
      
      // Se Debug AI está ativo, verificar se tem análise em cache ou iniciar nova
      if (debugAIEnabled) {
        const cached = AIDebugService.getCachedAnalysis(window.location.pathname);
        if (cached) {
          setShowAIPanel(true);
        } else {
          // Iniciar análise automaticamente
          await analyzeCurrentPage();
        }
      }
      
      forceUpdate({});
    }
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-red-500 hover:bg-red-600 text-white border-red-600"
            title={`🐛 Debug Mode (${userEmail || 'dev'})`}
          >
            <Bug className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-6xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {showGlobal ? '🌐 Debug Global - Sistema Completo' : '🔍 Debug Contextual - Página Atual'}
            </SheetTitle>
            <SheetDescription>
              {showGlobal 
                ? 'Logs detalhados de TODAS as operações do sistema' 
                : 'Análise específica da página atual com erros conhecidos e correções'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {showGlobal ? (
              <GlobalDebugDashboard key={String(open)} />
            ) : showAIPanel && analysis ? (
              <AIGeneratedDebugPanel 
                analysis={analysis}
                onClose={() => setShowAIPanel(false)}
              />
            ) : (
              <ContextualDebugPanel 
                onOpenGlobalDebug={() => setShowGlobal(true)} 
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
      
      <AIAnalysisProgressModal
        open={isAnalyzing}
        progress={progress}
        currentStep={currentStep}
      />
    </>
  );
};
