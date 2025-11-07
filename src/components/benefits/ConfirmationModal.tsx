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
            Confirmar sua escolha?
          </AlertDialogTitle>
        </div>
        
        <div className="p-8">
          <AlertDialogDescription className="text-center space-y-6">
            <div className="relative inline-block">
              <div className="text-8xl animate-bounce">{benefitIcon}</div>
              <div className="absolute inset-0 bg-[#DC2626]/20 rounded-full blur-3xl" />
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200">
              <p className="text-base text-gray-700 mb-2 font-semibold">
                Vale-presente escolhido:
              </p>
              <p className="text-3xl font-black text-[#DC2626]">{benefitName}</p>
            </div>
            
            {/* Badge de prazo de entrega */}
            <div className={`${isFastDelivery ? 'bg-green-100 border-green-300' : 'bg-blue-100 border-blue-300'} border-2 rounded-2xl p-5`}>
              <p className={`text-base font-black ${isFastDelivery ? 'text-green-800' : 'text-blue-800'} flex items-center justify-center gap-2`}>
                <span className="text-2xl">{isFastDelivery ? '⚡' : '📦'}</span>
                Código por email <span className="underline">{deliveryLabel}</span>
              </p>
            </div>
            
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6">
              <p className="text-sm text-gray-800 font-bold leading-relaxed">
                ⚠️ Atenção: Após confirmar, não será possível alterar sua escolha!
              </p>
            </div>
          </AlertDialogDescription>
        </div>
        
        <AlertDialogFooter className="p-6 pt-0 gap-3 flex-col sm:flex-row">
          <AlertDialogCancel 
            onClick={onClose}
            className="flex-1 py-6 text-base font-bold rounded-2xl border-2 border-gray-300 hover:bg-gray-50 w-full sm:w-auto"
          >
            ← Voltar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="flex-1 py-6 text-base font-bold rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg w-full sm:w-auto"
          >
            ✅ Confirmar Escolha
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationModal;
