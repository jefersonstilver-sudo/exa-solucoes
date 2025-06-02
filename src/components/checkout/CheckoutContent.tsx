
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Lock, Award, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import PaymentMethodCard from '@/components/checkout/payment/PaymentMethodCard';
import UnifiedCheckoutProgress from '@/components/checkout/UnifiedCheckoutProgress';
import MobilePaymentMethods from '@/components/checkout/MobilePaymentMethods';

interface CheckoutContentProps {
  totalAmount: number;
  acceptTerms: boolean;
  setAcceptTerms: (value: boolean) => void;
  isProcessingPayment: boolean;
  onPixPayment: () => void;
  onBack: () => void;
}

const CheckoutContent: React.FC<CheckoutContentProps> = ({
  totalAmount,
  acceptTerms,
  setAcceptTerms,
  isProcessingPayment,
  onPixPayment,
  onBack
}) => {
  const { isMobile } = useMobileBreakpoints();
  const pixAmount = totalAmount * 0.95; // 5% discount

  const handleCreditCardPayment = () => {
    toast.info("Pagamento com cartão estará disponível em breve!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Unified Progress Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border p-4 sm:p-6 mb-6 sm:mb-8"
        >
          <UnifiedCheckoutProgress currentStep={3} />
        </motion.div>

        {/* Mobile Back Button */}
        {isMobile && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 -ml-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        )}

        {/* Main content */}
        <div className={`${isMobile ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-3 gap-8'}`}>
          {/* Payment methods */}
          <div className={`${isMobile ? '' : 'lg:col-span-2'}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {isMobile ? (
                <div className="space-y-6">
                  <MobilePaymentMethods 
                    selectedMethod="pix"
                    onSelectMethod={() => {}}
                    totalAmount={totalAmount}
                  />
                </div>
              ) : (
                <Card className="shadow-lg border-0">
                  <CardContent className="p-6 sm:p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Como você deseja pagar?
                    </h2>
                    <p className="text-gray-600 mb-8">
                      Atualmente disponível apenas pagamento via PIX
                    </p>

                    <div className="space-y-4 mb-8">
                      <PaymentMethodCard
                        id="pix"
                        title="PIX"
                        description="Pagamento instantâneo"
                        originalAmount={totalAmount}
                        finalAmount={pixAmount}
                        discount={5}
                        icon="pix"
                        selected={true}
                        onSelect={() => {}}
                        highlight={true}
                      />
                      
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <span className="text-blue-700 font-medium">
                            💳 Cartão de crédito estará disponível em breve!
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Terms acceptance */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`${isMobile ? 'mt-6' : 'mt-8'}`}
              >
                <Card className={`${isMobile ? '' : 'shadow-lg border-0'}`}>
                  <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Checkbox 
                        id="terms" 
                        checked={acceptTerms} 
                        onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                        className="h-5 w-5 mt-0.5 border-gray-300 text-[#3C1361] focus:ring-[#3C1361]"
                      />
                      <Label 
                        htmlFor="terms" 
                        className={`text-gray-600 cursor-pointer leading-relaxed ${isMobile ? 'text-sm' : 'text-sm'}`}
                      >
                        Li e concordo com os{' '}
                        <a href="/termos" className="text-[#3C1361] hover:underline font-medium">
                          Termos de Uso
                        </a>{' '}
                        e a{' '}
                        <a href="/privacidade" className="text-[#3C1361] hover:underline font-medium">
                          Política de Privacidade
                        </a>
                        .
                      </Label>
                    </div>

                    {/* Payment button */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`space-y-3 ${isMobile ? 'mt-4' : 'mt-6'}`}
                    >
                      <Button
                        onClick={onPixPayment}
                        disabled={!acceptTerms || isProcessingPayment}
                        className={`w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors ${isMobile ? 'h-12 text-base' : 'py-4 text-lg'}`}
                        size="lg"
                      >
                        {isProcessingPayment ? (
                          <>
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Processando...
                          </>
                        ) : (
                          `Pagar com PIX - R$ ${pixAmount.toFixed(2)}`
                        )}
                      </Button>
                      
                      {!acceptTerms && (
                        <p className={`text-amber-600 text-center ${isMobile ? 'text-sm' : 'text-sm'}`}>
                          ⚠️ Aceite os termos para continuar
                        </p>
                      )}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>

          {/* Summary sidebar - Desktop only */}
          {!isMobile && (
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6 sticky top-8"
              >
                <Card className="shadow-lg border-0">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Resumo do Pedido
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">R$ {totalAmount.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto PIX (5%)</span>
                        <span>-R$ {(totalAmount * 0.05).toFixed(2)}</span>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-[#3C1361]">
                            R$ {pixAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Pagamento Seguro
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-600">PIX Banco Central</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Lock className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-600">Dados protegidos</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Award className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-600">Aprovação instantânea</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutContent;
