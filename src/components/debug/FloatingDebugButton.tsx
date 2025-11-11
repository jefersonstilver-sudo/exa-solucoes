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
import { VideoLogViewer } from './VideoLogViewer';

export const FloatingDebugButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [, forceUpdate] = useState({});

  // Só mostra em desenvolvimento ou se houver uma flag no localStorage
  const shouldShow = import.meta.env.DEV || localStorage.getItem('debug_mode') === 'true';

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Forçar atualização quando abrir
      forceUpdate({});
    }
  };

  if (!shouldShow) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-red-500 hover:bg-red-600 text-white border-red-600"
            title="Abrir Debug Logs (Backend + Frontend)"
          >
            <Bug className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>🐛 Debug Completo - Backend + Frontend</SheetTitle>
            <SheetDescription>
              Logs detalhados de TODAS as operações (RPC, triggers, frontend)
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <VideoLogViewer key={String(open)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
