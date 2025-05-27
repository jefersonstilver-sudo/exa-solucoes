
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Lock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import PaymentMethodCard from '@/components/checkout/payment/PaymentMethodCard';
import PaymentProgressHeader from '@/components/checkout/payment/PaymentProgressHeader';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, isLoading: isSessionLoading, user } = useUserSession();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState(0);
  
  const orderId = searchParams.get('id') || searchParams.get('pedido');
  
  // Calculate total amount from cart
  useEffect(() => {
    try {
      const cartItems = JSON.parse(localStorage.getItem('panelCart') || '[]');
      const total = cartItems.reduce((sum: number, item: any) => {
        const price = item.panel?.buildings?.basePrice || item.price || 250;
        return sum + price;
      }, 0);
      setTotalAmount(total);
    } catch (error) {
      console.error("[Checkout] Error calculating total:", error);
      setTotalAmount(0);
    }
  }, []);

  // Authentication check
  useEffect(() => {
    if (!isSessionLoading && !isLoggedIn) {
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout');
    }
  }, [isLoggedIn, isSessionLoading, navigate]);

  const handleBack = () => {
    navigate('/checkout/resumo');
  };

  const handlePixPayment = () => {
    // Temporariamente sem ação - preparado para webhook
    toast.info("Método PIX será configurado em breve!");
  };

  const handleCreditCardPayment = () => {
    toast.info("Redirecionando para pagamento com cartão...");
    // Aqui seria a lógica do cartão de crédito
  };

  if (isSessionLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <div className="h-8 w-8 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando pagamento...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (!isLoggedIn || !user?.id) {
    return null;
  }

  const pixAmount = totalAmount * 0.95; // 5% discount

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header with back button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar para resumo
            </Button>
            
            <PaymentProgressHeader currentStep={2} />
          </motion.div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment methods */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="shadow-lg border-0">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Como você deseja pagar?
                    </h2>
                    <p className="text-gray-600 mb-8">
                      Escolha a forma de pagamento que preferir
                    </p>

                    <div className="space-y-4">
                      {/* PIX Payment Method */}
                      <PaymentMethodCard
                        id="pix"
                        title="PIX"
                        description="Pagamento instantâneo"
                        originalAmount={totalAmount}
                        finalAmount={pixAmount}
                        discount={5}
                        icon="pix"
                        selected={selectedMethod === 'pix'}
                        onSelect={setSelectedMethod}
                        highlight={true}
                      />

                      {/* Credit Card Payment Method */}
                      <PaymentMethodCard
                        id="credit_card"
                        title="Cartão de Crédito"
                        description="Visa, Mastercard, Elo, American Express"
                        originalAmount={totalAmount}
                        finalAmount={totalAmount}
                        icon="credit_card"
                        selected={selectedMethod === 'credit_card'}
                        onSelect={setSelectedMethod}
                      />
                    </div>

                    {/* Payment button */}
                    {selectedMethod && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8"
                      >
                        {selectedMethod === 'pix' ? (
                          <Button
                            onClick={handlePixPayment}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold rounded-xl"
                            size="lg"
                          >
                            Pagar com PIX - R$ {pixAmount.toFixed(2)}
                          </Button>
                        ) : (
                          <Button
                            onClick={handleCreditCardPayment}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-xl"
                            size="lg"
                          >
                            Pagar com Cartão - R$ {totalAmount.toFixed(2)}
                          </Button>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Summary sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* Order summary */}
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
                      
                      {selectedMethod === 'pix' && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Desconto PIX (5%)</span>
                          <span>-R$ {(totalAmount * 0.05).toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-[#1E1B4B]">
                            R$ {selectedMethod === 'pix' ? pixAmount.toFixed(2) : totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security badges */}
                <Card className="shadow-lg border-0">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Pagamento Seguro
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-600">SSL 256 bits</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Lock className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-600">Dados protegidos</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Award className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-600">Certificado PCI DSS</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
