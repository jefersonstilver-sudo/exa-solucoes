
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CouponStepProps {
  couponCode: string;
  setCouponCode: (code: string) => void;
  validateCoupon: () => void;
  isValidatingCoupon: boolean;
  couponMessage: string;
  couponValid: boolean;
}

const CouponStep: React.FC<CouponStepProps> = ({
  couponCode,
  setCouponCode,
  validateCoupon,
  isValidatingCoupon,
  couponMessage,
  couponValid
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateCoupon();
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center">
          <span className="mr-2">🏷️</span>
          Cupom de Desconto
        </h2>
        <p className="text-sm text-muted-foreground">
          Se você possui um cupom promocional, insira o código abaixo
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input 
            type="text" 
            placeholder="Insira o código do cupom" 
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="uppercase"
            disabled={isValidatingCoupon || couponValid}
          />
          <Button 
            type="submit" 
            disabled={!couponCode || isValidatingCoupon || couponValid}
            className="min-w-[80px] bg-indexa-purple hover:bg-indexa-purple-dark"
          >
            {isValidatingCoupon ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : couponValid ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              'Aplicar'
            )}
          </Button>
        </div>
        
        {couponMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`
              p-3 rounded-md text-sm flex items-start gap-2
              ${couponValid 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
              }
            `}
          >
            {couponValid ? (
              <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
            )}
            <span>{couponMessage}</span>
          </motion.div>
        )}
      </form>
      
      <div className="bg-gray-50 p-4 rounded-lg mt-6">
        <h3 className="text-sm font-medium mb-2">Como conseguir cupons</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="mr-2">📱</span>
            <span>Siga-nos nas redes sociais para cupons exclusivos</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">📧</span>
            <span>Inscreva-se em nossa newsletter para receber promoções</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">🎁</span>
            <span>Participe de eventos e campanhas promocionais</span>
          </li>
        </ul>
      </div>
    </motion.div>
  );
};

export default CouponStep;
