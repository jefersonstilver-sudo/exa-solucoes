
import React from 'react';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Info, Lock, ShieldCheck, CreditCard } from 'lucide-react';

interface PaymentStepProps {
  acceptTerms: boolean;
  setAcceptTerms: (accepted: boolean) => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ acceptTerms, setAcceptTerms }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2 
        className="text-xl font-semibold flex items-center"
        variants={itemVariants}
      >
        <CreditCard className="mr-2 h-5 w-5 text-indexa-purple" />
        Finalizar pagamento
      </motion.h2>
      
      <div className="space-y-6">
        <motion.div 
          className="flex p-4 bg-gradient-to-r from-indexa-purple/10 to-indexa-mint/10 rounded-lg border border-indexa-purple/20 shadow-sm"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-white rounded-full shadow-sm">
              <ShieldCheck className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Pagamento Seguro</h3>
              <p className="text-sm text-gray-600">
                Seus dados estão protegidos com criptografia SSL e processados com segurança pelo Mercado Pago
              </p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="flex items-center space-x-2"
          variants={itemVariants}
        >
          <Checkbox 
            id="terms" 
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked === true)}
            className="border-indexa-purple data-[state=checked]:bg-indexa-purple"
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Aceito os <a href="#" className="text-indexa-purple underline hover:text-indexa-purple-dark">termos e condições</a>
          </label>
        </motion.div>
        
        <motion.div 
          className="p-4 bg-indexa-purple/5 rounded-md border border-indexa-purple/10"
          variants={itemVariants}
        >
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-indexa-purple mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Ao finalizar a compra:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2 text-gray-700">
                <li>Seus painéis serão reservados para o período selecionado</li>
                <li>Você será redirecionado para o Mercado Pago para concluir o pagamento</li>
                <li>Após o pagamento confirmado, suas campanhas serão criadas automaticamente</li>
              </ul>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="flex items-center justify-center space-x-2 p-3 bg-green-50 border border-green-100 rounded-md"
          variants={itemVariants}
        >
          <Lock className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">Compra 100% Segura com Mercado Pago</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PaymentStep;
