import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  benefitName: string;
  benefitIcon: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  benefitName,
  benefitIcon,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-2xl">
            Confirmar escolha?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4 pt-4">
            <div className="text-6xl">{benefitIcon}</div>
            <p className="text-lg">
              Você escolheu: <strong className="text-primary">{benefitName}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Após confirmar, esta escolha não poderá ser alterada e você receberá o código do vale-presente por email.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            ✅ Sim, confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationModal;
