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

  // Só mostra em desenvolvimento ou se houver uma flag no localStorage
  const shouldShow = import.meta.env.DEV || localStorage.getItem('debug_mode') === 'true';

  if (!shouldShow) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            title="Abrir Debug Logs"
          >
            <Bug className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Debug Logs - Video Actions</SheetTitle>
            <SheetDescription>
              Logs detalhados de todas as ações relacionadas a vídeos
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <VideoLogViewer />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
