import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CheckCircle, Upload, Calendar, Tv } from 'lucide-react';

interface VideoInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoInstructionsModal: React.FC<VideoInstructionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Como funciona a gestão de vídeos</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Entenda como gerenciar seus vídeos nos painéis
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Upload className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">1. Envie seus vídeos</h4>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                Faça upload de até 4 vídeos (máx. 15 segundos, 100MB cada). Adicione títulos descritivos para fácil identificação.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Tv className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">2. Defina o vídeo principal</h4>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                Escolha qual vídeo será exibido por padrão nos painéis quando não houver agendamento ativo.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">3. Agende exibições (opcional)</h4>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                Configure horários e dias específicos para cada vídeo. Útil para promoções sazonais ou campanhas temporárias.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">4. Aguarde aprovação</h4>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                Todos os vídeos passam por análise antes de ir ao ar. Você será notificado assim que forem aprovados.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-[11px] sm:text-xs text-blue-800">
            <strong>Dica:</strong> Mantenha sempre um vídeo principal definido para garantir que seus painéis nunca fiquem sem conteúdo.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
