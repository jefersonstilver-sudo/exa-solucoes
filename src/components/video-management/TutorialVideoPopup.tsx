import React from 'react';
import { X, GraduationCap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/video-management/VideoPlayer';

interface TutorialVideoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialVideoPopup: React.FC<TutorialVideoPopupProps> = ({
  isOpen,
  onClose
}) => {
  const tutorialVideoUrl = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/EXA/feem_FCC41_2025-08-31_15539849070035110049.mov?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9FWEEvZmVlbV9GQ0M0MV8yMDI1LTA4LTMxXzE1NTM5ODQ5MDcwMDM1MTEwMDQ5Lm1vdiIsImlhdCI6MTc1NjY4Mzk0MCwiZXhwIjo0ODc4NzQ3OTQwfQ.07AFEpZ7IFq_-Ncl9TPlFf-BnBmF9JoBdk-mtgqyfOc";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <GraduationCap className="h-5 w-5 text-primary" />
            Tutorial - Como usar a Gestão de Vídeos
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="aspect-video bg-black">
          <VideoPlayer
            src={tutorialVideoUrl}
            autoPlay={false}
            muted={false}
            controls={true}
          />
        </div>
        
        <div className="px-6 py-4 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Este tutorial explica como enviar, gerenciar e agendar seus vídeos nos painéis digitais.
            Use os controles do player para pausar, avançar ou retroceder conforme necessário.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};