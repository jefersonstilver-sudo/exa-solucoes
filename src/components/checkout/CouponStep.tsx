
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
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold flex items-center">
            <Tag className="mr-3 h-5 w-5 text-[#3C1361]" />
            Cupom de Desconto
          </h2>
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <button className="inline-flex items-center justify-center rounded-full w-5 h-5 bg-[#3C1361]/10 hover:bg-[#3C1361]/20 transition-colors">
                <Info className="h-3 w-3 text-[#3C1361]" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-4 bg-gradient-to-br from-white to-gray-50 border-2 shadow-xl">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="rounded-full p-2 bg-[#3C1361]/10">
                    <Tag className="h-4 w-4 text-[#3C1361]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900 mb-1">
                      Como funcionam os cupons?
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Os cupons podem ter diferentes requisitos como quantidade mínima de prédios, valor mínimo do pedido ou período de contrato específico.
                    </p>
                  </div>
                </div>
                
                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Descontos aplicados automaticamente no total</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Verifique as condições antes de aplicar</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Cada cupom tem limite de uso</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <p className="text-sm text-muted-foreground">
          Se você possui um cupom promocional, insira o código abaixo
        </p>
      </motion.div>
      
      <motion.form 
        variants={itemVariants}
        onSubmit={handleSubmit} 
        className="space-y-4"
      >
        <div className="flex gap-2">
          <Input 
            type="text" 
            placeholder="Insira o código do cupom" 
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="uppercase"
            disabled={isValidatingCoupon || couponValid}
          />
          {couponValid ? (
            <Button 
              type="button" 
              variant="destructive"
              onClick={removeCoupon}
              className="min-w-[90px] transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Remover
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={!couponCode || isValidatingCoupon}
              className="min-w-[90px] bg-[#3C1361] hover:bg-[#3C1361]/90 transition-colors"
            >
              {isValidatingCoupon ? (
                <Loader2 className="h-4 w-4 animate-spin" />
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
              p-4 rounded-xl text-sm flex items-start gap-2
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
      </motion.form>
      
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden shadow-sm border-none bg-gradient-to-br from-[#3C1361]/5 to-[#3C1361]/10 rounded-2xl">
          <CardContent className="p-5">
            <h3 className="text-sm font-medium mb-3 text-[#3C1361]">Como conseguir cupons</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start">
                <Smartphone className="mr-3 h-4 w-4 text-[#3C1361] flex-shrink-0 mt-0.5" />
                <span>Siga-nos nas redes sociais para cupons exclusivos</span>
              </li>
              <li className="flex items-start">
                <Mail className="mr-3 h-4 w-4 text-[#3C1361] flex-shrink-0 mt-0.5" />
                <span>Inscreva-se em nossa newsletter para receber promoções</span>
              </li>
              <li className="flex items-start">
                <Gift className="mr-3 h-4 w-4 text-[#3C1361] flex-shrink-0 mt-0.5" />
                <span>Participe de eventos e campanias promocionais</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default CouponStep;
