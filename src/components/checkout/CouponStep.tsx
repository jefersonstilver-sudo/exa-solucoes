
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Tag, Smartphone, Mail, Gift } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CouponStepProps {
  couponCode: string;
  setCouponCode: (code: string) => void;
  validateCoupon: () => void;
  isValidatingCoupon: boolean;
  couponMessage: string;
  couponValid: boolean;
  removeCoupon: () => void;
  isSuperAdmin?: boolean;
}

const CouponStep: React.FC<CouponStepProps> = ({
  couponCode,
  setCouponCode,
  validateCoupon,
  isValidatingCoupon,
  couponMessage,
  couponValid,
  removeCoupon,
  isSuperAdmin = false
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateCoupon();
  };
  
  const handleApplyCortesia = () => {
    setCouponCode('CORTESIA_ADMIN');
    // Trigger validation immediately
    setTimeout(() => validateCoupon(), 100);
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
        <h2 className="text-lg sm:text-xl font-semibold flex items-center">
          <Tag className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
          Cupom de Desconto
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Se você possui um cupom promocional, insira o código abaixo
        </p>
      </motion.div>
      
      <motion.form 
        variants={itemVariants}
        onSubmit={handleSubmit} 
        className="space-y-3 sm:space-y-4"
      >
        <div className="flex gap-2 sm:gap-3">
          <Input 
            type="text" 
            placeholder="Código do cupom" 
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="uppercase text-sm sm:text-base h-11 sm:h-12"
            disabled={isValidatingCoupon || couponValid}
          />
          {couponValid ? (
            <Button 
              type="button" 
              variant="destructive"
              onClick={removeCoupon}
              className="min-w-[90px] sm:min-w-[110px] h-11 sm:h-12 text-sm sm:text-base px-4 transition-colors"
            >
              <XCircle className="h-4 w-4 sm:h-4.5 sm:w-4.5 sm:mr-2" />
              <span className="hidden sm:inline">Remover</span>
              <span className="sm:hidden">X</span>
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={!couponCode || isValidatingCoupon}
              className="min-w-[90px] sm:min-w-[110px] h-11 sm:h-12 bg-gray-900 hover:bg-gray-800 text-sm sm:text-base px-4 transition-colors"
            >
              {isValidatingCoupon ? (
                <Loader2 className="h-4 w-4 sm:h-4.5 sm:w-4.5 animate-spin" />
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
              p-3 sm:p-4 rounded-lg text-sm sm:text-base flex items-start gap-2 sm:gap-3
              ${couponValid 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
              }
            `}
          >
            {couponValid ? (
              <CheckCircle className="h-5 w-5 sm:h-5.5 sm:w-5.5 flex-shrink-0 mt-0.5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 sm:h-5.5 sm:w-5.5 flex-shrink-0 mt-0.5 text-red-600" />
            )}
            <span className="leading-relaxed">{couponMessage}</span>
          </motion.div>
        )}
      </motion.form>
      
      <motion.div variants={itemVariants}>
        {/* Super Admin - Botão Cortesia */}
        {isSuperAdmin && (
          <Card className="overflow-hidden shadow-sm border-2 border-pink-300 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500 rounded-full">
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-pink-700">Cupom Cortesia</h3>
                    <p className="text-xs text-pink-600">Exclusivo para Super Admin</p>
                  </div>
                </div>
                <Button
                  onClick={handleApplyCortesia}
                  variant="default"
                  className="bg-pink-500 hover:bg-pink-600"
                >
                  Aplicar Cortesia
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CouponStep;
