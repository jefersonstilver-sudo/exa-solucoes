
import React from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tag, Check, X, Loader } from 'lucide-react';

interface CouponStepProps {
  couponCode: string;
  setCouponCode: (code: string) => void;
  validateCoupon: () => Promise<void>;
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
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2
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
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold flex items-center">
          <Tag className="mr-2 h-5 w-5 text-indexa-purple" />
          Cupom de desconto
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Se você possui um cupom promocional, insira-o abaixo para aplicar o desconto ao seu pedido.
        </p>
      </motion.div>
      
      <motion.div className="space-y-4" variants={itemVariants}>
        <div className="grid grid-cols-[1fr_auto] gap-2 items-start">
          <div className="space-y-1.5">
            <Label htmlFor="coupon" className="text-sm">Cupom</Label>
            <Input
              id="coupon"
              placeholder="Digite seu cupom promocional"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="w-full focus:border-indexa-purple focus:ring-indexa-purple/20"
              autoComplete="off"
            />
          </div>
          <div className="pt-7">
            <Button 
              onClick={validateCoupon}
              disabled={isValidatingCoupon || !couponCode.trim()}
              className="bg-indexa-purple hover:bg-indexa-purple-dark"
            >
              {isValidatingCoupon ? (
                <>
                  <Loader className="h-4 w-4 mr-1 animate-spin" />
                  Validando...
                </>
              ) : (
                "Aplicar"
              )}
            </Button>
          </div>
        </div>
        
        {couponMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start p-3 rounded ${
              couponValid 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {couponValid ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="ml-2 text-sm">
              {couponMessage}
            </div>
          </motion.div>
        )}
        
        <motion.div 
          variants={itemVariants}
          className="p-4 bg-indexa-purple/5 border border-indexa-purple/10 rounded-lg"
        >
          <h3 className="text-sm font-medium">Como conseguir cupons?</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-indexa-purple mr-1.5">•</span>
              <span>Acompanhe nossas redes sociais para promoções exclusivas</span>
            </li>
            <li className="flex items-start">
              <span className="text-indexa-purple mr-1.5">•</span>
              <span>Inscreva-se em nossa newsletter para receber ofertas especiais</span>
            </li>
            <li className="flex items-start">
              <span className="text-indexa-purple mr-1.5">•</span>
              <span>Entre em contato com nosso time comercial para negociar descontos</span>
            </li>
          </ul>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default CouponStep;
