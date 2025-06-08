
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import { useUnifiedCheckout } from '@/hooks/useUnifiedCheckout';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Lock, Award, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PaymentMethodCard from '@/components/checkout/payment/PaymentMethodCard';
import UnifiedCheckoutProgress from '@/components/checkout/UnifiedCheckoutProgress';
import MobileCheckoutStepper from '@/components/checkout/MobileCheckoutStepper';
import MobilePaymentMethods from '@/components/checkout/MobilePaymentMethods';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, isLoading: isSessionLoading, user } = useUserSession();
  const { isMobile } = useMobileBreakpoints();
  
  // CORREÇÃO CRÍTICA: Usar sistema unificado em vez do antigo
  const {
    currentTransactionId,
    sessionPrice,
    isProcessing,
    currentStep,
    initializeUnifiedCheckout,
    processPixPayment,
    validateBeforePayment,
    clearUnifiedCheckout,
    cartItems,
    selectedPlan,
    couponId
  } = useUnifiedCheckout();

  const [selectedMethod, setSelectedMethod] = useState<string>('pix');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const orderId = searchParams.get('id') || searchParams.get('pedido');

  // CRÍTICO: Inicializar checkout unificado na montagem
  useEffect(() => {
    if (!isSessionLoading && isLoggedIn && cartItems.length > 0 && selectedPlan && !isInitialized) {
      console.log("🔄 [Checkout] Inicializando sistema unificado");
      initializeUnifiedCheckout().then((result) => {
        if (result.success) {
          setIsInitialized(true);
          console.log("✅ [Checkout] Sistema unificado inicializado:", {
            transactionId: result.transactionId,
            price: result.price
          });
        } else {
          console.error("❌ [Checkout] Falha na inicialização");
          navigate('/checkout/resumo');
        }
      });
    }
  }, [isSessionLoading, isLoggedIn, cartItems.length, selectedPlan, isInitialized]);

  // Authentication check
  useEffect(() => {
    if (!isSessionLoading && !isLoggedIn) {
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout');
    }
  }, [isLoggedIn, isSessionLoading, navigate]);

  // Cart validation
  useEffect(() => {
    if (!isSessionLoading && isLoggedIn && cartItems.length === 0) {
      toast.error("Seu carrinho está vazio");
      navigate('/checkout/resumo');
    }
  }, [isSessionLoading, isLoggedIn, cartItems.length, navigate]);

  const handleBack = () => {
    clearUnifiedCheckout();
    navigate('/checkout/resumo');
  };

  // CORREÇÃO PRINCIPAL: Sistema PIX Unificado
  const handlePixPayment = async () => {
    if (!acceptTerms) {
      toast.error("Você precisa aceitar os termos para continuar");
      return;
    }

    if (!currentTransactionId || !sessionPrice) {
      toast.error("Erro: transação não inicializada");
      return;
    }

    if (currentStep !== 'order') {
      toast.error("Aguarde a finalização da preparação do pedido");
      return;
    }

    try {
      console.log("💳 [Checkout] Iniciando pagamento PIX unificado:", {
        transactionId: currentTransactionId,
        sessionPrice,
        selectedPlan
      });

      // Validar integridade do preço antes do pagamento
      const isValid = await validateBeforePayment(sessionPrice);
      if (!isValid) {
        toast.error("Erro de validação detectado. Reinicie o processo.");
        clearUnifiedCheckout();
        navigate('/checkout/resumo');
        return;
      }

      // Processar pagamento com preço bloqueado
      const success = await processPixPayment(currentTransactionId);
      
      if (!success) {
        toast.error("Erro ao processar pagamento PIX");
      }
      // Se success = true, usuário já foi navegado para /pix-payment
      
    } catch (error) {
      console.error("❌ [Checkout] Erro no pagamento:", error);
      toast.error("Erro inesperado no pagamento");
    }
  };

  if (isSessionLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <div className="h-8 w-8 border-4 border-[#3C1361] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando pagamento...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (!isLoggedIn || !user?.id) {
    return null;
  }

  // Mostrar loading até sistema estar inicializado
  if (!isInitialized || !currentTransactionId || !sessionPrice) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <div className="h-8 w-8 border-4 border-[#3C1361] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Preparando seu pedido...</p>
            <p className="text-sm text-gray-500 mt-2">Calculando preços e criando transação única</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const pixAmount = sessionPrice * 0.95; // 5% discount

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          {/* Unified Progress Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border p-4 sm:p-6 mb-6 sm:mb-8"
          >
            <UnifiedCheckoutProgress currentStep={3} />
          </motion.div>

          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 -ml-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>

          {/* Transaction Info - NOVO: Mostrar informações da transação */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Transação Segura</span>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <div>ID da Transação: <code className="bg-blue-100 px-1 rounded">{currentTransactionId}</code></div>
              <div>Preço Bloqueado: <span className="font-medium">R$ {sessionPrice.toFixed(2)}</span></div>
              <div>Desconto PIX (5%): <span className="font-medium text-green-600">R$ {(sessionPrice * 0.05).toFixed(2)}</span></div>
              <div>Total a Pagar: <span className="font-bold text-blue-800">R$ {pixAmount.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Main content */}
          <div className={`${isMobile ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-3 gap-8'}`}>
            {/* Payment methods */}
            <div className={`${isMobile ? '' : 'lg:col-span-2'}`}>
              <div>
                {isMobile ? (
                  <div className="space-y-6">
                    <MobilePaymentMethods 
                      selectedMethod={selectedMethod}
                      onSelectMethod={setSelectedMethod}
                      totalAmount={sessionPrice}
                    />
                  </div>
                ) : (
                  <Card className="shadow-lg border-0">
                    <CardContent className="p-6 sm:p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Como você deseja pagar?
                      </h2>
                      <p className="text-gray-600 mb-8">
                        Pagamento PIX com preço garantido e sem recálculos
                      </p>

                      <div className="space-y-4 mb-8">
                        <PaymentMethodCard
                          id="pix"
                          title="PIX"
                          description="Pagamento instantâneo com preço bloqueado"
                          originalAmount={sessionPrice}
                          finalAmount={pixAmount}
                          discount={5}
                          icon="pix"
                          selected={true}
                          onSelect={setSelectedMethod}
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
                <div className={`${isMobile ? 'mt-6' : 'mt-8'}`}>
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

                      <div className={`space-y-3 ${isMobile ? 'mt-4' : 'mt-6'}`}>
                        <Button
                          onClick={handlePixPayment}
                          disabled={!acceptTerms || isProcessing || currentStep !== 'order'}
                          className={`w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors ${isMobile ? 'h-12 text-base' : 'py-4 text-lg'}`}
                          size="lg"
                        >
                          {isProcessing ? (
                            <>
                              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Processando...
                            </>
                          ) : currentStep !== 'order' ? (
                            'Preparando pedido...'
                          ) : (
                            `Pagar com PIX - R$ ${pixAmount.toFixed(2)}`
                          )}
                        </Button>
                        
                        {!acceptTerms && (
                          <p className={`text-amber-600 text-center ${isMobile ? 'text-sm' : 'text-sm'}`}>
                            ⚠️ Aceite os termos para continuar
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
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
                          <span className="text-gray-600">Painéis selecionados</span>
                          <span className="font-medium">{cartItems.length}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Plano</span>
                          <span className="font-medium">{selectedPlan} meses</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">R$ {sessionPrice.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Desconto PIX (5%)</span>
                          <span>-R$ {(sessionPrice * 0.05).toFixed(2)}</span>
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
                        Segurança Total
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600">Preço bloqueado</span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Lock className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600">Transação única</span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Award className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600">Zero duplicação</span>
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
    </Layout>
  );
};

export default Checkout;
