
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Tag, Smartphone, Mail, Gift } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Info } from 'lucide-react';

interface CouponStepProps {
  couponCode: string;
  setCouponCode: (code: string) => void;
  validateCoupon: () => void;
  isValidatingCoupon: boolean;
  couponMessage: string;
  couponValid: boolean;
  removeCoupon: () => void;
}

const CouponStep: React.FC<CouponStepProps> = ({
  couponCode,
  setCouponCode,
  validateCoupon,
  isValidatingCoupon,
  couponMessage,
  couponValid,
  removeCoupon
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateCoupon();
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3 sm:space-y-6"
    >
      <motion.div variants={itemVariants} className="space-y-1 sm:space-y-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <h2 className="text-base sm:text-xl font-semibold flex items-center">
            <Tag className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
            Cupom de Desconto
          </h2>
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <button className="inline-flex items-center justify-center rounded-full w-4 h-4 sm:w-5 sm:h-5 bg-gray-100 hover:bg-gray-200 transition-colors">
                <Info className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-600" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-72 sm:w-80 p-3 sm:p-4 bg-white border shadow-xl">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start gap-2">
                  <div className="rounded-full p-1.5 sm:p-2 bg-gray-100">
                    <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-1">
                      Como funcionam os cupons?
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                      Os cupons podem ter diferentes requisitos como quantidade mínima de prédios, valor mínimo do pedido ou período de contrato específico.
                    </p>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Se você possui um cupom promocional, insira o código abaixo
        </p>
      </motion.div>
      
      <motion.form 
        variants={itemVariants}
        onSubmit={handleSubmit} 
        className="space-y-3 sm:space-y-4"
      >
        <div className="flex gap-2">
          <Input 
            type="text" 
            placeholder="Código do cupom" 
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="uppercase text-sm"
            disabled={isValidatingCoupon || couponValid}
          />
          {couponValid ? (
            <Button 
              type="button" 
              variant="destructive"
              onClick={removeCoupon}
              className="min-w-[80px] sm:min-w-[90px] text-xs sm:text-sm px-3 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden sm:inline">Remover</span>
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={!couponCode || isValidatingCoupon}
              className="min-w-[80px] sm:min-w-[90px] bg-gray-900 hover:bg-gray-800 text-xs sm:text-sm px-3 transition-colors"
            >
              {isValidatingCoupon ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                'Aplicar'
              )}
            </Button>
          )}
        </div>
        
        {couponMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className={`
              p-2.5 sm:p-4 rounded-lg text-xs sm:text-sm flex items-start gap-1.5 sm:gap-2
              ${couponValid 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
              }
            `}
          >
            {couponValid ? (
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5 text-green-600" />
            ) : (
              <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5 text-red-600" />
            )}
            <span>{couponMessage}</span>
          </motion.div>
        )}
      </motion.form>
      
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden shadow-sm border-none bg-gray-50 rounded-lg sm:rounded-2xl">
          <CardContent className="p-3 sm:p-5">
            <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-gray-700">Como conseguir cupons</h3>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
              <li className="flex items-start">
                <Smartphone className="mr-2 sm:mr-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <span>Siga-nos nas redes sociais</span>
              </li>
              <li className="flex items-start">
                <Mail className="mr-2 sm:mr-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <span>Inscreva-se na newsletter</span>
              </li>
              <li className="flex items-start">
                <Gift className="mr-2 sm:mr-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <span>Participe de eventos promocionais</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default CouponStep;
