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
  deliveryDays?: number;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  benefitName,
  benefitIcon,
  deliveryDays = 3,
}) => {
  const deliveryLabel = deliveryDays === 1 ? 'até 24 horas' : `até ${deliveryDays} dias úteis`;
  const isFastDelivery = deliveryDays === 1;
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
        <div className="bg-gradient-to-br from-[#DC2626] to-[#991b1b] p-8">
          <AlertDialogTitle className="text-center text-3xl font-black text-white">
            Confirmar escolha?
          </AlertDialogTitle>
        </div>
        
        <div className="p-8">
          <AlertDialogDescription className="text-center space-y-6">
            <div className="relative inline-block">
              <div className="text-8xl animate-bounce">{benefitIcon}</div>
              <div className="absolute inset-0 bg-[#DC2626]/20 rounded-full blur-3xl" />
            </div>
            
            <div className="bg-gradient-to-br from-[#DC2626]/10 to-[#DC2626]/5 rounded-2xl p-6 border-2 border-[#DC2626]/20">
              <p className="text-lg text-gray-700 mb-2 font-medium">
                Você escolheu:
              </p>
              <p className="text-3xl font-black text-[#DC2626]">{benefitName}</p>
            </div>
            
            {/* Badge de prazo de entrega */}
            <div className={`${isFastDelivery ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border-2 rounded-2xl p-4`}>
              <p className={`text-sm font-bold ${isFastDelivery ? 'text-green-800' : 'text-blue-800'} flex items-center justify-center gap-2`}>
                <span className="text-xl">{isFastDelivery ? '⚡' : '📦'}</span>
                Você receberá o código <span className="underline">{deliveryLabel}</span>
              </p>
            </div>
            
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
              <p className="text-sm text-gray-700 font-medium leading-relaxed">
                ⚠️ Após confirmar, esta escolha não poderá ser alterada e você receberá o código do vale-presente por email.
              </p>
            </div>
          </AlertDialogDescription>
        </div>
        
        <AlertDialogFooter className="p-6 pt-0 gap-3">
          <AlertDialogCancel 
            onClick={onClose}
            className="flex-1 py-6 text-base font-bold rounded-2xl border-2 border-gray-300 hover:bg-gray-50"
          >
            Voltar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="flex-1 py-6 text-base font-bold rounded-2xl bg-gradient-to-r from-[#DC2626] to-[#991b1b] hover:from-[#991b1b] hover:to-[#7f1d1d] text-white shadow-lg"
          >
            ✅ Sim, confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationModal;
