/**
 * Botão flutuante para abrir painel de debug
 */

import React, { useState } from 'react';
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
import { useDebugContext } from '@/contexts/DebugContext';

export const FloatingDebugButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showGlobal, setShowGlobal] = useState(false);
  const [, forceUpdate] = useState({});
  
  const { isDebugMode, isDebugAuthorized, userEmail } = useDebugContext();

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

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Resetar para contextual ao abrir
      setShowGlobal(false);
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
            ) : (
              <ContextualDebugPanel 
                onOpenGlobalDebug={() => setShowGlobal(true)} 
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
