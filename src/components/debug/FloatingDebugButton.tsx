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
import { DebugPasswordModal } from './DebugPasswordModal';
import { useDebugContext } from '@/contexts/DebugContext';
import { useAIDebug } from '@/hooks/useAIDebug';
import { AIDebugService } from '@/services/debug/AIDebugService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const FloatingDebugButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showGlobal, setShowGlobal] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [debugAIEnabled, setDebugAIEnabled] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, forceUpdate] = useState({});
  
  const { isDebugMode, isDebugAuthorized, userEmail } = useDebugContext();
  const { isAnalyzing, progress, currentStep, analysis, analyzeCurrentPage } = useAIDebug();

  useEffect(() => {
    // Verificação inicial
    AIDebugService.isDebugAIEnabled().then(setDebugAIEnabled);

    // Listener em tempo real para detectar quando Debug AI é ativado
    const channel = supabase
      .channel('debug-ai-config-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'configuracoes_sistema' 
        }, 
        (payload) => {
          console.log('🔄 Mudança detectada em configuracoes_sistema:', payload);
          if (payload.new && 'debug_ai_enabled' in payload.new) {
            const newValue = (payload.new as any).debug_ai_enabled;
            console.log('🤖 Debug AI mudou para:', newValue);
            setDebugAIEnabled(newValue);
            if (newValue) {
              toast.success('Debug AI ativado! Clique no botão vermelho para analisar.');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (analysis) {
      setShowAIPanel(true);
    }
  }, [analysis]);

  // Só mostra se:
  // 1. Está em dev OU
  // 2. Debug AI ativado E usuário autorizado
  const shouldShow = import.meta.env.DEV || (debugAIEnabled && isDebugAuthorized);
  
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
    if (newOpen && !isAuthenticated) {
      setShowPasswordModal(true);
      return;
    }
    
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
  
  const handlePasswordCorrect = () => {
    setIsAuthenticated(true);
    setShowPasswordModal(false);
    setOpen(true);
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <DebugPasswordModal 
        open={showPasswordModal}
        onCorrectPassword={handlePasswordCorrect}
        onClose={() => setShowPasswordModal(false)}
      />
      
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
